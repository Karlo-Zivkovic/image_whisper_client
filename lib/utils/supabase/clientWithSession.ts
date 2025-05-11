import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/supabase/database.types";

/**
 * Creates a Supabase client that includes the session ID in request headers
 * Specifically for shared session access via RLS policies
 * Creates a new instance to avoid modifying the global one
 */
export function createClientWithSession(sessionId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create a new client with the session header
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-session-id": sessionId,
      },
    },
  });
}
