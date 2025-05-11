import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/utils/supabase/client";
import { createClientWithSession } from "@/lib/utils/supabase/clientWithSession";
import { Request } from "@/lib/supabase/entity.types";

/**
 * Hook for fetching request data by chat ID
 * If sessionId is provided, it will be used to authenticate the request
 * for shared access via RLS policies
 */
export function useGetRequest(chatId: number | null, sessionId?: string) {
  return useQuery({
    queryKey: ["request", chatId, sessionId],
    queryFn: async (): Promise<Request | null> => {
      if (!chatId) return null;

      // Use client with sessionId header if provided, otherwise use standard client
      const client = sessionId ? createClientWithSession(sessionId) : supabase;

      try {
        const { data, error } = await client
          .from("requests")
          .select("*")
          .eq("chat_id", chatId)
          .single();

        if (error) {
          // Check if this is a "no rows" error which can happen when data isn't yet available
          if (error.code === "PGRST116") {
            console.log("No request data found yet for chat_id:", chatId);
            return null;
          }

          // Otherwise it's a more serious error
          console.error("Error fetching request:", error);
          throw error;
        }

        return data as Request;
      } catch (err) {
        console.error("Error in useGetRequest:", err);
        throw err;
      }
    },
    // Enable polling to check for updates every 10 seconds
    // refetchInterval: 10000,
    // Don't refetch on window focus to avoid too many requests
    refetchOnWindowFocus: false,
    // Only run the query if we have a chatId
    enabled: !!chatId,
  });
}
