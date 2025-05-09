import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/utils/supabase/client";
import { Chat } from "../supabase/entity.types";

export function useInsertChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chat: Omit<Chat, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("chats")
        .insert(chat)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
