import { useQuery } from "@tanstack/react-query";
import { listingsService } from "../services/listingsService";
import { useAuthStore } from "../store/useAuthStore";

export const useBrowsingListings = () => {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["listings", "browse"],
    queryFn: async () => {
      const data = await listingsService.getBrowseListings();
      const filtered = user
        ? data.listings.filter((l) => l.sellerId !== user.id)
        : data.listings;
      return { listings: filtered, total: filtered.length };
    },
  });
};
