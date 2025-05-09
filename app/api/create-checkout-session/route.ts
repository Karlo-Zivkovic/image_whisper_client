import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
// Make sure to set this in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil", // Use the latest API version available in the library
});

// Type definitions
interface ImageData {
  imageUrl: string;
}

interface CheckoutRequestData {
  images: ImageData[];
  prompt: string;
  userId?: string;
}

interface MockWebhookResponse {
  error?: string;
  details?: string;
  received?: boolean;
  success?: boolean;
}

/**
 * Split images data into chunks that fit within Stripe's 500 character limit
 */
function splitImagesForMetadata(images: ImageData[]): Record<string, string> {
  const result: Record<string, string> = {};

  // Store just the URLs with their index
  images.forEach((img, index) => {
    result[`imageUrl_${index}`] = img.imageUrl;
  });

  // Store the count
  result.image_count = images.length.toString();

  return result;
}

/**
 * Create a Stripe checkout session
 */
async function createStripeCheckoutSession(
  origin: string,
  data: CheckoutRequestData
): Promise<Stripe.Checkout.Session> {
  const { images, prompt, userId } = data;

  // Check if we have valid images
  if (!images || images.length === 0) {
    throw new Error("No images provided");
  }

  // TODO: Handle the price
  // Create a price for multiple images (charge per image)
  const unitAmount = 100; // $1.00 in cents per image

  // Split images into metadata-friendly chunks
  const imagesMetadata = splitImagesForMetadata(images);

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `AI Image Transformation (${images.length} image${
              images.length > 1 ? "s" : ""
            })`,
            description:
              prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
            images: images.map((img) => img.imageUrl),
            metadata: {
              imageCount: images.length.toString(),
            },
          },
          unit_amount: unitAmount * images.length, // Charge per image
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}`,
    metadata: {
      // Add all image data in separate fields
      ...imagesMetadata,
      // Add other metadata
      prompt,
      userId: userId || null,
    },
  });
}

/**
 * Call the webhook endpoint directly for development mode
 */
async function callDevelopmentWebhook(
  origin: string,
  mockSessionId: string,
  data: CheckoutRequestData
): Promise<Response> {
  const { images, prompt, userId } = data;

  // Split images into metadata-friendly chunks
  const imagesMetadata = splitImagesForMetadata(images);

  return await fetch(`${origin}/api/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-development-mode": "true",
    },
    body: JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: {
          id: mockSessionId,
          payment_status: "paid",
          metadata: {
            ...imagesMetadata,
            prompt: prompt.substring(0, 450),
            userId: userId || null,
          },
        },
      },
    }),
  });
}

/**
 * Handle development mode bypass of Stripe
 */
async function bypassStripe(
  origin: string,
  data: CheckoutRequestData
): Promise<NextResponse> {
  console.log("Bypassing Stripe in development mode");

  // Create a "fake" session ID
  const mockSessionId = `dev_session_${Date.now()}`;
  const userId = data.userId || "";

  try {
    // Call the webhook handler directly to simulate the webhook event
    const response = await callDevelopmentWebhook(origin, mockSessionId, data);

    // Check if webhook call was successful
    if (!response.ok) {
      const errorData = (await response.json()) as MockWebhookResponse;
      console.error("Webhook returned an error:", errorData);

      // If in development, throw this error to stop the process
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Webhook error: ${JSON.stringify(errorData)}`);
      }
      // In production, we log but continue since the user already paid
    }
  } catch (webhookError) {
    console.error("Error calling development webhook:", webhookError);

    // In development, stop and alert the developer
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "Development webhook error",
          details: (webhookError as Error).message,
        },
        { status: 500 }
      );
    }
    // In production, continue anyway since this is just development mode
  }

  // Return success URL with mock session ID and userId if present
  return NextResponse.json({
    url: `${origin}/payment-success?session_id=${mockSessionId}${
      userId ? `&user_id=${userId}` : ""
    }`,
  });
}

/**
 * Handle error responses
 */
function handleError(error: unknown): NextResponse {
  const err = error as Error;
  console.error("Error creating checkout session:", err);
  console.error("Stack trace:", err.stack);

  return NextResponse.json(
    {
      error: "Error creating checkout session",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
    { status: 500 }
  );
}

/**
 * Main POST handler for creating checkout sessions
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Extract data from the request
    const body = await request.json();

    // Validate images array
    if (
      !body.images ||
      !Array.isArray(body.images) ||
      body.images.length === 0
    ) {
      return NextResponse.json(
        { error: "No images provided or invalid images format" },
        { status: 400 }
      );
    }

    const requestData: CheckoutRequestData = {
      images: body.images,
      prompt: body.prompt,
      userId: body.userId, // Get userId if provided by client
    };

    // Get the origin for success/cancel URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // For development, optionally bypass Stripe
    if (process.env.NEXT_PUBLIC_BYPASS_STRIPE === "true") {
      return await bypassStripe(origin, requestData);
    }

    // Create a Stripe Checkout Session
    const session = await createStripeCheckoutSession(origin, requestData);

    // Return the session URL to redirect to
    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Simple GET handler
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ message: "Hello, world!" });
}
