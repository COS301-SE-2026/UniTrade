import { useQuery } from "@tanstack/react-query";
import { listingsService } from "../services/listingsService";

export const useWishlist = () =>
  useQuery({
    queryKey: ["wishlist"],
    queryFn: () => listingsService.getWishlist(),
  });
