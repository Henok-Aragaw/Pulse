"use client";

import { useQuery } from "@tanstack/react-query";

export function useJournals() {
  return useQuery({
    queryKey: ["journals"],
    queryFn: async () => {
      const res = await fetch("/api/journals");
      if (!res.ok) throw new Error("Failed to fetch journals");
      return res.json();
    },
  });
}
