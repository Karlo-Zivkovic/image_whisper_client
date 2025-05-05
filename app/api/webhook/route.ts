import { NextResponse } from "next/server";
import Stripe from "stripe";
import { authAdminSupabase, dbAdminSupabase } from "@/lib/supabase/admin";
import { User, Session } from "@supabase/supabase-js";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Type definitions for better code organization
type SessionMetadata = {
  imageId: string;
  imagePath: string;
  imageUrl: string;
  prompt: string;
};

interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
}

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
 * Create an anonymous user for the session
 */
async function createAnonymousUser(): Promise<{
  user: { id: string };
  session: Session;
}> {
  const { data, error } =
    (await authAdminSupabase.auth.signInAnonymously()) as AuthResponse;

  if (error || !data.user) {
    console.error("Error creating anonymous user:", error);
    throw new Error(`Auth error: ${error?.message}`);
  }

  // Verify session data exists
  if (!data.session?.access_token || !data.session?.refresh_token) {
    console.error("No session tokens available for anonymous user");
    throw new Error("Auth session error: No tokens available");
  }

  return {
    user: { id: data.user.id },
    session: data.session,
  };
}

/**
 * Store payment session mapping in the database
 */
async function storePaymentSession(
  stripeSessionId: string,
  userId: string,
  sessionToken: string,
  refreshToken: string,
  expiresAt?: number
): Promise<void> {
  const { error } = await dbAdminSupabase.from("payment_sessions").insert({
    stripe_sessions_id: stripeSessionId,
    user_id: userId,
    session_token: sessionToken,
    refresh_token: refreshToken,
    expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
  });

  if (error) {
    console.error("Error storing session mapping:", error);
    console.error("Details:", JSON.stringify(error));
    // We don't throw here because we want to continue even if this fails
  }
}

/**
 * Create a new chat entry for the user
 */
async function createChatEntry(userId: string) {
  const { data, error } = await dbAdminSupabase
    .from("chats")
    .insert({
      user_id: userId,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat record:", error);
    console.error("Details:", JSON.stringify(error));
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data) {
    console.error("No chat data returned after insert");
    throw new Error("No chat data returned");
  }

  return data;
}

/**
 * Create a request entry linked to the chat
 */
async function createRequestEntry(
  chatId: number,
  imageUrl: string,
  prompt: string
) {
  const { data, error } = await dbAdminSupabase
    .from("requests")
    .insert({
      chat_id: chatId,
      image_url: imageUrl,
      prompt: prompt,
    })
    .select()
    .single();

  if (error) {
    console.error("Error storing request in Supabase:", error);
    console.error("Details:", JSON.stringify(error));
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data) {
    console.error("No request data returned after insert");
    throw new Error("No request data returned");
  }

  return data;
}

/**
 * Handle successful checkout session
 */
async function handleSuccessfulCheckout(
  session: Stripe.Checkout.Session
): Promise<NextResponse> {
  try {
    // Extract the metadata from the session
    const { imageUrl, prompt } = session.metadata as SessionMetadata;

    // Create an anonymous user
    const authData = await createAnonymousUser();
    const userId = authData.user.id;
    const sessionToken = authData.session.access_token;
    const refreshToken = authData.session.refresh_token;
    const expiresAt = authData.session.expires_at;

    // Store the payment session mapping
    await storePaymentSession(
      session.id,
      userId,
      sessionToken,
      refreshToken,
      expiresAt
    );

    // Create chat entry
    const chatData = await createChatEntry(userId);

    // Create request entry
    await createRequestEntry(chatData.id, imageUrl, prompt);

    // Return success with the user ID
    return NextResponse.json({
      received: true,
      success: true,
      userId: userId,
    });
  } catch (error) {
    // Handle errors from any of the functions
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
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
