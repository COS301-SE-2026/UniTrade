import React, { useEffect } from "react";
import { connectionManager } from "../services/realtime/connectionManager";
import { queryKeys } from "../lib/queryKeys";
import { useAuthStore } from "../store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import type { Reservation, ReservationListItem } from "../types/Reservations";
import type { ClientChatMessage } from "../types/chat";
import type { ChatMessage } from "../types/Reservations";
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      return;
    }
    connectionManager
      .connect()
      .catch((e) => console.error("hub connect failed", e));

    const onOnline = () => void connectionManager.connect().catch(() => {});
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
      void connectionManager.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const offMessage = connectionManager.onMessageReceived(
      (msg: ChatMessage) => {
        const key = queryKeys.reservationMessages(msg.reservationId);
        queryClient.setQueryData<ClientChatMessage[]>(key, (old = []) => {
          if (old.some((m) => m.messageId === msg.messageId)) return old;

          const i = msg.clientKey
            ? old.findIndex((m) => m.clientId === msg.clientKey)
            : -1;

          if (i !== -1) {
            const next = [...old];
            next[i] = { ...msg, clientId: msg.clientKey!, status: "sent" };
            return next;
          }

          return [...old, { ...msg, status: "sent" as const }];
        });
      },
    );
    const offReconnected = connectionManager.onReconnected(() => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.allReservationMessages(),
      });
    });
    const offRead = connectionManager.onMessagesRead((e) => {
      queryClient.setQueryData<ClientChatMessage[]>(
        queryKeys.reservationMessages(e.reservationId),
        (old = []) =>
          old.map((m) =>
            m.senderId !== e.readBy &&
            m.messageId != null &&
            m.messageId <= e.upToMessageId &&
            m.readAt == null
              ? { ...m, readAt: new Date().toISOString() }
              : m,
          ),
      );
    });

    const offReservationUpdated = connectionManager.onReservationUpdated(
      (updated: Reservation) => {
        for (const role of ["buyer", "seller"] as const) {
          queryClient.setQueryData<ReservationListItem[]>(
            queryKeys.reservations(role),
            (old) =>
              old?.map((item) =>
                item.reservationId === updated.reservationId
                  ? {
                      ...item,
                      reservationStatus: updated.reservationStatus,
                      timerStage: updated.timerStage,
                      expiresAt: updated.expiresAt,
                      sellerAcknowledgedAt: updated.sellerAcknowledgedAt,
                    }
                  : item,
              ),
          );
        }
        queryClient.invalidateQueries({
          queryKey: queryKeys.wishlist(),
        });
        queryClient.invalidateQueries({
          queryKey: ["listings", "browse"],
        });
        queryClient.invalidateQueries({
          queryKey: ["listings", "my"],
        });
      },
    );

    return () => {
      offMessage();
      offReconnected();
      offRead();
      offReservationUpdated();
    };
  }, [queryClient]);
  return <>{children}</>;
}
