import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Process the incoming webhook request to verify and extract the Stripe event
 */
async function processWebhookRequest(
  request: Request
): Promise<Stripe.Event | null> {
  // Check if this is a development mode call
  const isDevelopmentMode =
    request.headers.get("x-development-mode") === "true";

  try {
    if (isDevelopmentMode) {
      // For development mode, parse the JSON directly
      return await request.json();
    } else {
      // For real Stripe webhooks, verify the signature
      const payload = await request.text();
      const sig = request.headers.get("stripe-signature") as string;

      // Verify the event came from Stripe
      return stripe.webhooks.constructEvent(
        payload,
        sig,
        endpointSecret as string
      );
    }
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook Error: ${error.message}`);
    throw new Error(`Webhook Error: ${error.message}`);
  }
}

/**
 * Handle successful checkout session
 */
async function handleSuccessfulCheckout(
  session: Stripe.Checkout.Session
): Promise<NextResponse> {
  try {
    // Simply confirm the payment was successful
    return NextResponse.json({
      received: true,
      success: true,
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    // Handle errors
    const err = error as Error;
    console.error("Error processing webhook:", err);
    console.error("Stack trace:", err.stack);

    return NextResponse.json(
      {
        error: "Server error",
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: Request) {
  try {
    // Process webhook request and get Stripe event
    const event = await processWebhookRequest(request);

    if (!event) {
      return NextResponse.json(
        { error: "No event data found" },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Make sure this is a successful payment
      if (session.payment_status === "paid") {
        return await handleSuccessfulCheckout(session);
      } else {
        return NextResponse.json({
          received: true,
          success: false,
          sessionId: session.id,
          paymentStatus: session.payment_status,
        });
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
