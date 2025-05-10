import { useQuery } from "@tanstack/react-query";

/**
 * Session metadata interface
 */
export interface SessionMetadata {
  imagesUrl: string[];
  prompt: string;
  userId: string;
  chatId: string;
}

/**
 * Hook for fetching session metadata from Stripe
 */
export function useGetSessionMetadata(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-metadata", sessionId],
    queryFn: async (): Promise<SessionMetadata | null> => {
      if (!sessionId) return null;

      try {
        const response = await fetch(
          `/api/get-session-metadata?session_id=${sessionId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch session metadata");
        }

        const data = await response.json();
        return data.metadata || {};
      } catch (error) {
        console.error("Error fetching session metadata:", error);
        throw error;
      }
    },
    // Only run the query if we have a sessionId
    enabled: !!sessionId,
  });
}
