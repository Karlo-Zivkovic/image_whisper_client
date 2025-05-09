import { createClient } from "@/lib/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log("User:", data);
  return NextResponse.json(data);
}
