import { NextResponse } from "next/server";
import { dbAdminSupabase } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id parameter" },
      { status: 400 }
    );
  }

  try {
    // Look up the user ID and session tokens for this payment session
    const { data, error } = await dbAdminSupabase
      .from("payment_sessions")
      .select("user_id, session_token, refresh_token, expires_at")
      .eq("stripe_sessions_id", sessionId)
      .single();

    if (error || !data) {
      console.error("Error retrieving user for session:", error);
      return NextResponse.json(
        { error: "Session not found or no user associated" },
        { status: 404 }
      );
    }

    // Check if we have session tokens
    if (!data.session_token || !data.refresh_token) {
      console.error("No session tokens found for user", data.user_id);
      return NextResponse.json(
        { error: "Authentication data not found" },
        { status: 500 }
      );
    }

    // Return the tokens and user ID
    return NextResponse.json({
      userId: data.user_id,
      session: {
        access_token: data.session_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
          ? new Date(data.expires_at).getTime() / 1000
          : undefined,
      },
    });
  } catch (err) {
    console.error("Error processing get-session-user request:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
