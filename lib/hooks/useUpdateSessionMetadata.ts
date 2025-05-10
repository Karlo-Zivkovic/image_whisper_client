import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateSessionParams {
  sessionId: string;
  userId?: string;
  chatId?: number;
}

/**
 * Hook for updating Stripe session metadata
 */
export function useUpdateSessionMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, userId, chatId }: UpdateSessionParams) => {
      // At least one of userId or chatId must be provided
      if (!userId && !chatId) {
        throw new Error("At least one of userId or chatId must be provided");
      }

      const response = await fetch("/api/update-session-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          ...(userId && { userId }),
          ...(chatId && { chatId }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update session metadata: ${errorText}`);
      }

      const data = await response.json();
      return data.metadata;
    },
    onSuccess: (_, variables) => {
      // Invalidate the session metadata query to refetch with updated data
      queryClient.invalidateQueries({
        queryKey: ["session-metadata", variables.sessionId],
      });
    },
  });
}
