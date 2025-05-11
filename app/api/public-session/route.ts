import { dbAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chat_id");

  if (!chatId) {
    return NextResponse.json({ error: "Missing chat_id" }, { status: 400 });
  }

  // Fetch request and response for the given chat_id
  const [{ data: request }, { data: response }] = await Promise.all([
    dbAdminSupabase
      .from("requests")
      .select("created_at, image_url, prompt")
      .eq("chat_id", parseInt(chatId, 10))
      .single(),
    dbAdminSupabase
      .from("responses")
      .select("created_at, image_url, message")
      .eq("chat_id", parseInt(chatId, 10))
      .single(),
  ]);

  if (!request) {
    return NextResponse.json({ error: "No request found" }, { status: 404 });
  }

  return NextResponse.json({
    request,
    response,
  });
}
