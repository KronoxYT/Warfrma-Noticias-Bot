import { useQuery } from "@tanstack/react-query";

export interface SellerInfo {
  platinum: number;
  quantity: number;
  seller: string;
  status: string;
  reputation: number;
}

export interface PriceResult {
  item: string;
  slug: string;
  totalSellers: number;
  cheapest: SellerInfo;
  topSellers: SellerInfo[];
}

export function usePrice(item: string) {
  return useQuery({
    queryKey: ["/api/price", item],
    queryFn: async (): Promise<PriceResult> => {
      const res = await fetch(`/api/price/${encodeURIComponent(item)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch price from Warframe Market");
      }
      return res.json();
    },
    enabled: !!item && item.trim().length > 0,
    retry: false,
    staleTime: 30000,
  });
}
