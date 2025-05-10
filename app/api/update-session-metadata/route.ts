import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, userId, chatId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      );
    }

    // Only userId or chatId is required
    if (!userId && !chatId) {
      return NextResponse.json(
        { error: "Missing userId or chatId parameter" },
        { status: 400 }
      );
    }

    // Retrieve the current session to get existing metadata
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Create updated metadata object by merging existing metadata with new data
    const updatedMetadata = {
      ...session.metadata,
    };

    // Add userId if provided
    if (userId) {
      updatedMetadata.userId = userId;
    }

    // Add chatId if provided - ensure it's stored as a string (Stripe requirement)
    if (chatId) {
      updatedMetadata.chatId = chatId;
    }

    // Update the session with the new metadata
    const updatedSession = await stripe.checkout.sessions.update(sessionId, {
      metadata: updatedMetadata,
    });

    return NextResponse.json({
      success: true,
      metadata: updatedSession.metadata,
    });
  } catch (error) {
    console.error("Error updating session metadata:", error);
    const err = error as Error;

    return NextResponse.json(
      {
        error: "Failed to update session metadata",
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
