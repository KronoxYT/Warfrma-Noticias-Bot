import { useQuery } from "@tanstack/react-query";

export interface Build {
  id: string;
  displayName: string;
  type: "warframe" | "weapon";
  description: string;
  mods: string[];
  forma: number;
  difficulty: string;
}

export function useBuilds() {
  return useQuery({
    queryKey: ["/api/builds"],
    queryFn: async (): Promise<Build[]> => {
      const res = await fetch("/api/builds");
      if (!res.ok) throw new Error("Failed to fetch builds");
      return res.json();
    },
    staleTime: 300000, // 5 minutes
  });
}
