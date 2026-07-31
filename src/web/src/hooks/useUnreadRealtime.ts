import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectionManager } from "../services/realtime/connectionManager";
import { queryKeys } from "../lib/queryKeys";

export function useUnreadRealtime(role: "buyer" | "seller") {
  const queryClient = useQueryClient();

  useEffect(() => {
    connectionManager.connect().catch(() => {});

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations(role) });
    };

    const unsubscribeMessage = connectionManager.onMessageReceived(invalidate);
    const unsubscribeRead = connectionManager.onMessagesRead(invalidate);
    const unsubscribeReconnected = connectionManager.onReconnected(invalidate);
    const unsubscribeReservation =
      connectionManager.onReservationUpdated(invalidate);
    return () => {
      unsubscribeMessage();
      unsubscribeRead();
      unsubscribeReconnected();
      unsubscribeReservation();
    };
  }, [role, queryClient]);
}
