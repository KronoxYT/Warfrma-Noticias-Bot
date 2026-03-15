import { useQuery } from "@tanstack/react-query";

export interface BotStatus {
  online: boolean;
  name: string;
  avatar: string | null;
  guildCount: number;
  userCount: number;
  uptimeMs: number;
  uptimeFormatted: string;
  connectedAt: string | null;
}

export function useBotStatus() {
  return useQuery({
    queryKey: ["/api/status"],
    queryFn: async (): Promise<BotStatus> => {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch bot status");
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time feel
  });
}
