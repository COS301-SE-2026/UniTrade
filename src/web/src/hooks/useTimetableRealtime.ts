import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { connectionManager } from "../services/realtime/connectionManager";
import { queryKeys } from "../lib/queryKeys";

export function useTimetableRealtime(
  reservationId: string | undefined,
  buyerId: string | undefined,
  sellerId: string | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!reservationId) return;

    const off = connectionManager.onTimetableUpdated((payload) => {
      const relevant =
        payload.userId === buyerId || payload.userId === sellerId;

      if (!relevant) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.meetupAvailability(reservationId),
      });
    });

    return () => off();
  }, [reservationId, buyerId, sellerId, queryClient]);
}
