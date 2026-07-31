import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectionManager } from "../services/realtime/connectionManager";
import { queryKeys } from "../lib/queryKeys";

export function useReservationRealtime(reservationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    connectionManager
      .joinRoom(reservationId)
      .then(() => {
        if (active) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.reservationMessages(reservationId),
          });
        }
      })
      .catch((e) => console.error("joinRoom failed", e));

    const offMessage = connectionManager.onMessageReceived((m) => {
      if (m.reservationId !== reservationId) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.reservationMessages(reservationId),
      });
    });
    const offRead = connectionManager.onMessagesRead((e) => {
      if (e.reservationId !== reservationId) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.reservationMessages(reservationId),
      });
    });
    const off = connectionManager.onReservationUpdated((r) => {
      if (r.reservationId === reservationId) {
        queryClient.invalidateQueries({
          queryKey: ["reservation", reservationId],
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.reservationMessages(reservationId),
        });
      }
    });
    return () => {
      active = false;
      offMessage();
      offRead();
      off();
      void connectionManager.leaveRoom(reservationId);
    };
  }, [reservationId, queryClient]);
}
