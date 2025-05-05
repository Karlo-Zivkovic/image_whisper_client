import { Database } from "@/lib/supabase/database.types";
import { createClient } from "@supabase/supabase-js";

// This file should ONLY be imported by server components or API routes
// NEVER import this in client components

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY");
}

// Admin client for authentication operations - SERVER USE ONLY
// This client will be used for auth.signInAnonymously() and similar operations
export const authAdminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Admin client for database operations - SERVER USE ONLY
// This client will be used for database queries and will not be affected by auth operations
export const dbAdminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
