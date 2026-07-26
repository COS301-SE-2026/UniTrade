import { useQuery } from "@tanstack/react-query";
import { listingsService } from "../services/listingsService";
import { useEffect } from "react";
import { connectionManager } from "../services/realtime/connectionManager";
import type { WishlistResponse } from "../types/listing";
import { queryClient } from "../lib/queryClient";

export const useWishlist = () =>
{
  useEffect(() => {
    connectionManager.connect().catch(() => {});
    const unsubscribe= connectionManager.onListingChanged((listingId, event) => {
      queryClient.setQueryData<WishlistResponse>(["wishlist"], (old) => {
         return old && {
        ...old,
        listings: old.listings.map((l) =>
        l.id === listingId 
      ? { ...l,status: event === "reserved"? "reserved" :"live"}
    : l,
  ),
      };
    });
    });

  return unsubscribe;
  }, []);

  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => listingsService.getWishlist(),
  });};
