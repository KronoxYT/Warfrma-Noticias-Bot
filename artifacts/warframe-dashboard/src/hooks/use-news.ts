import { useQuery } from "@tanstack/react-query";

export interface NewsArticle {
  message: string;
  link: string;
  imageLink: string;
  date: string;
}

export function useNews() {
  return useQuery({
    queryKey: ["/api/news"],
    queryFn: async (): Promise<NewsArticle[]> => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch Warframe news");
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });
}
