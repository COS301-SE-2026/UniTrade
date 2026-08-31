import React, { useEffect } from "react";
import { connectionManager } from "../services/realtime/connectionManager";
import { queryKeys } from "../lib/queryKeys";
import { useAuthStore } from "../store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import type { Reservation, ReservationListItem, ChatMessage } from "../types/Reservations";
import type { ClientChatMessage } from "../types/chat";
import { registerForPushN, onForegroundMessage } from "../services/fcmService";
import { useToast } from "../components/layout/useToast";

export function RealtimeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  /*if (import.meta.env.DEV) {//this needs to be removed once backedn  is set up , minor fix so that i can see the actual progress on the pages 
    return <>
    {children}
    </>;
  }*/

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  useEffect(() => {
if (import.meta.env.DEV || !user) return;

    connectionManager
      .connect()
      .catch((e) => console.error("hub connect failed", e));

    const onOnline = () => void connectionManager.connect().catch(() => { });
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
      void connectionManager.disconnect();
    };
  }, [user]);

  useEffect(() => {
 if (import.meta.env.DEV || !user) return;

    const alreadyRegistered = sessionStorage.getItem("pushRegistered");
    if (!alreadyRegistered) {
      registerForPushN()
        .then(() => {
          sessionStorage.setItem("pushRegistered", "true");

        })
        .catch((err) => {
          console.error("Push token failed", err);
          sessionStorage.setItem("pushAttempted", "true");
        })
    }
  }, [user]);

  useEffect(() => {
if (import.meta.env.DEV || !user) return;

    const unsubscribe = onForegroundMessage((title, body) => {
      showToast("info", `${title}: ${body}`);
      // note to FE: play some sound.
    });
    return unsubscribe;
  }, [user, showToast]);

  useEffect(() => {
    if (import.meta.env.DEV || !user) return;

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
        queryClient.invalidateQueries({
          queryKey: ["reservation", updated.reservationId],
        });
      },
    );

    const offListing = connectionManager.onListingChanged(() => {
      queryClient.invalidateQueries({ queryKey: ["listings", "browse"] });
      queryClient.invalidateQueries({ queryKey: ["listings", "my"] });
    });

    if(user?.role === "admin") {
      connectionManager.joinAdminGroup().catch((e) =>
      console.error("joinAdminGroup failed", e),
    );
    }

    const offDisputeCreated = connectionManager.onDisputeCreated(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes()});
      queryClient.invalidateQueries({queryKey: queryKeys.dashboardStats()});
    })

    return () => {
      offMessage();
      offReconnected();
      offRead();
      offReservationUpdated();
      offListing();
      offDisputeCreated();
    };
  }, [queryClient, user]);
  return <>{children}</>;
}