import { useEffect, useState } from "react";
import { supabase } from "@/lib/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getUser() {
      try {
        setIsLoading(true);

        // Get session and user data
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        setCurrentUser(data.user);
      } catch (err) {
        console.log("No current user found", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user")
        );
      } finally {
        setIsLoading(false);
      }
    }

    // Get initial user
    getUser();

    // Listen for auth state changes
    // const {
    //   data: { subscription },
    // } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setCurrentUser(session?.user ?? null);
    // });

    // // Cleanup subscription
    // return () => {
    //   subscription.unsubscribe();
    // };
  }, []);

  return { user: currentUser, isLoading, error };
}
