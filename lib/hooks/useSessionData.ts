import { useQuery } from "@tanstack/react-query";
import { Request, Response } from "@/lib/supabase/entity.types";

export interface SessionData {
  request: Request;
  response: Response | null;
}

export function useSessionData(chatId: string | number | null) {
  return useQuery({
    queryKey: ["sessionData", chatId],
    queryFn: async (): Promise<SessionData> => {
      if (!chatId) {
        throw new Error("Chat ID is required");
      }

      const response = await fetch(`/api/public-session?chat_id=${chatId}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!chatId, // Only run the query if a chatId is provided
    // staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when the window regains focus
  });
}
