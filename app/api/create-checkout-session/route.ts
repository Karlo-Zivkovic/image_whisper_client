import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
// Make sure to set this in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil", // Use the latest API version available in the library
});

export async function POST(request: Request) {
  try {
    // Extract data from the request
    const body = await request.json();
    const { imageId, imagePath, imageUrl, prompt } = body;

    // Get the origin for success/cancel URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // For development, optionally bypass Stripe
    if (process.env.NEXT_PUBLIC_BYPASS_STRIPE === "true") {
      return await bypassStripe(origin, imageId, imagePath, imageUrl, prompt);
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "AI Image Transformation",
              description:
                prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
              images: imageUrl ? [imageUrl] : undefined, // Show the image in Stripe Checkout
              metadata: {
                imageId,
                imagePath,
              },
            },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}`,
      metadata: {
        imageId,
        imagePath,
        imageUrl,
        prompt: prompt.substring(0, 500), // Limited to 500 chars for metadata
      },
    });

    // Return the session URL to redirect to
    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
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
}

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}

async function bypassStripe(
  origin: string,
  imageId: string,
  imagePath: string,
  imageUrl: string,
  prompt: string
) {
  console.log("Bypassing Stripe in development mode");

  // Create a "fake" session ID
  const mockSessionId = `dev_session_${Date.now()}`;

  // You might want to call your webhook handler directly here
  // to simulate the webhook event
  try {
    const response = await fetch(`${origin}/api/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add a special header to indicate this is a development call
        "x-development-mode": "true",
      },
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            id: mockSessionId,
            payment_status: "paid",
            metadata: {
              imageId,
              imagePath,
              imageUrl,
              prompt,
            },
          },
        },
      }),
    });

    // Check if webhook call was successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Webhook returned an error:", errorData);

      // If in development, we might want to throw this error to stop the process
      if (process.env.NODE_ENV === "development") {
        throw new Error(`Webhook error: ${JSON.stringify(errorData)}`);
      }
      // In production, we log but continue since the user already paid
    }
  } catch (webhookError) {
    console.error("Error calling development webhook:", webhookError);
    // In development, we might want to stop and alert the developer
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

  // Return success URL with mock session ID
  return NextResponse.json({
    url: `${origin}/payment-success?session_id=${mockSessionId}`,
  });
}
