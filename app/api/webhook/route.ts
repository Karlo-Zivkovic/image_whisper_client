import { NextResponse } from "next/server";
import Stripe from "stripe";
import { authAdminSupabase, dbAdminSupabase } from "@/lib/supabase/admin";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  let event;

  // Check if this is a development mode call
  const isDevelopmentMode =
    request.headers.get("x-development-mode") === "true";

  if (isDevelopmentMode) {
    // For development mode, parse the JSON directly
    const payload = await request.json();
    event = payload;
  } else {
    // For real Stripe webhooks, verify the signature
    const payload = await request.text();
    const sig = request.headers.get("stripe-signature") as string;

    try {
      // Verify the event came from Stripe
      event = stripe.webhooks.constructEvent(
        payload,
        sig,
        endpointSecret as string
      );
    } catch (err) {
      const error = err as Error;
      console.error(`Webhook Error: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${error.message}` },
        { status: 400 }
      );
    }
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Make sure this is a successful payment
    if (session.payment_status === "paid") {
      try {
        // Extract the metadata we stored during checkout
        const {
          // imageId and imagePath are available for future use in image processing
          // We're storing them in variables for clarity of what data is available
          imageUrl,
          prompt,
        } = session.metadata as {
          imageId: string;
          imagePath: string;
          imageUrl: string;
          prompt: string;
        };

        // Create an anonymous user
        const { data: authData, error: authError } =
          await authAdminSupabase.auth.signInAnonymously();

        if (authError || !authData.user) {
          console.error("Error creating anonymous user:", authError);
          return NextResponse.json(
            { error: "Auth error: " + authError?.message },
            { status: 500 }
          );
        }

        // Extract the session data to store
        const sessionToken = authData.session?.access_token;
        const refreshToken = authData.session?.refresh_token;
        const expiresAt = authData.session?.expires_at;

        if (!sessionToken || !refreshToken) {
          console.error("No session tokens available for anonymous user");
          return NextResponse.json(
            { error: "Auth session error: No tokens available" },
            { status: 500 }
          );
        }

        // Store the mapping between Stripe session and user, including the session token
        const { error: sessionMappingError } = await dbAdminSupabase
          .from("payment_sessions")
          .insert({
            stripe_sessions_id: session.id,
            user_id: authData.user.id,
            session_token: sessionToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
              ? new Date(expiresAt * 1000).toISOString()
              : null,
          });

        if (sessionMappingError) {
          console.error("Error storing session mapping:", sessionMappingError);
          console.error("Details:", JSON.stringify(sessionMappingError));
          // Continue anyway since we've already created the user
        }

        // First, create a chat entry
        const { data: chatData, error: chatError } = await dbAdminSupabase
          .from("chats")
          .insert({
            user_id: authData.user.id, // Use the newly created user ID
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (chatError) {
          console.error("Error creating chat record:", chatError);
          console.error("Details:", JSON.stringify(chatError));
          return NextResponse.json(
            { error: "Database error: " + chatError.message },
            { status: 500 }
          );
        }

        if (!chatData) {
          console.error("No chat data returned after insert");
          return NextResponse.json(
            { error: "No chat data returned" },
            { status: 500 }
          );
        }

        // Create a record in the requests table
        const { data, error } = await dbAdminSupabase
          .from("requests")
          .insert({
            chat_id: chatData.id,
            image_url: imageUrl,
            prompt: prompt,
          })
          .select()
          .single();

        if (error) {
          console.error("Error storing request in Supabase:", error);
          console.error("Details:", JSON.stringify(error));
          return NextResponse.json(
            { error: "Database error: " + error.message },
            { status: 500 }
          );
        }

        if (!data) {
          console.error("No request data returned after insert");
          return NextResponse.json(
            { error: "No request data returned" },
            { status: 500 }
          );
        }

        // Log whether this was processed in development mode or not
        console.log(
          `Payment was successful and request created (${
            isDevelopmentMode ? "DEV MODE" : "PRODUCTION MODE"
          }):`,
          data.id
        );

        // Return success with the user ID
        return NextResponse.json({
          received: true,
          success: true,
          userId: authData.user.id,
        });
      } catch (error) {
        // This catch block should catch any unhandled errors in the try block
        const err = error as Error;
        console.error("Error processing webhook:", err);
        console.error("Stack trace:", err.stack);
        return NextResponse.json(
          {
            error: "Server error",
            message: err.message,
            stack:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          },
          { status: 500 }
        );
      }
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
