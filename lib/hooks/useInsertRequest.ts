import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/utils/supabase/client";
import { Request } from "../supabase/entity.types";

export function useInsertRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: Omit<Request, "id" | "created_at">) => {
      const { error } = await supabase.from("requests").insert(request);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
