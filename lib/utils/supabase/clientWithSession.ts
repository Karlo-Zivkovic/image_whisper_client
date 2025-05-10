import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

/**
 * Creates a Supabase client that includes the session ID in request headers
 * for use with the RLS policies that allow access to shared resources
 */
export function createClientWithSession(sessionId: string) {
  // Get the ANON key for the public client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create client with global headers
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-session-id": sessionId,
      },
    },
  });
}
