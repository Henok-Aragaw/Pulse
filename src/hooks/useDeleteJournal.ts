"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeleteJournal() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/journals/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete journal");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Journal deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Error deleting journal");
    },
  });

  // ✅ Return consistent naming
  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
  };
}
