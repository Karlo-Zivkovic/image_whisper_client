import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/utils/supabase/client";

interface RegisterSessionParams {
  sessionId: string;
  chatId: number;
}

/**
 * Hook for registering a session ID with a chat ID in the shared_sessions table
 * This allows public, unauthenticated access to the specific transformation
 */
export function useRegisterSharedSession() {
  return useMutation({
    mutationFn: async ({ sessionId, chatId }: RegisterSessionParams) => {
      // Validate inputs
      if (!sessionId || !chatId) {
        throw new Error("Session ID and chat ID are required");
      }

      // Insert the record into shared_sessions
      const { data, error } = await supabase.from("shared_sessions").upsert(
        {
          session_id: sessionId,
          chat_id: chatId,
        },
        {
          onConflict: "session_id,chat_id",
          ignoreDuplicates: true,
        }
      );

      if (error) {
        console.error("Error registering shared session:", error);
        throw error;
      }

      return data;
    },
  });
}
