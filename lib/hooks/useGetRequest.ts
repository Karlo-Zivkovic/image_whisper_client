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

      const { data, error } = await client
        .from("requests")
        .select("*")
        .eq("chat_id", chatId)
        .single();

      if (error) {
        console.error("Error fetching request:", error);
        return null;
      }

      return data as Request;
    },
    // Enable polling to check for updates every 30 seconds
    // refetchInterval: 30000,
    // Only run the query if we have a chatId
    enabled: !!chatId,
  });
}
