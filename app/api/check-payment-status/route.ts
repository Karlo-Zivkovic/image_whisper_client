import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

export async function GET(request: Request) {
  // Get the session ID from query parameters
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id parameter" },
      { status: 400 }
    );
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Return the payment status
    return NextResponse.json({
      status: session.payment_status,
      isPaid: session.payment_status === "paid",
    });
  } catch (error) {
    console.error("Error retrieving payment status:", error);

    return NextResponse.json(
      { error: "Failed to retrieve payment status" },
      { status: 500 }
    );
  }
}
