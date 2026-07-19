import { useQuery } from "@tanstack/react-query";
import { listingsService } from "../services/listingsService";

export const useMyListings = () =>
  useQuery({
    queryKey: ["listings", 'my'],
    queryFn: () => listingsService.getMyListings(),
  });
