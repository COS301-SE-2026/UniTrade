import React, { useEffect } from "react";
import { connectionManager } from "../services/realtime/connectionManager";
import { queryKeys } from "../lib/queryKeys";
import { useAuthStore } from "../store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Reservation,
  ReservationListItem,
  ChatMessage,
} from "../types/Reservations";
import type { ClientChatMessage } from "../types/chat";
import { registerForPushN, onForegroundMessage } from "../services/fcmService";
import { useToast } from "../components/layout/useToast";
import { authService } from "../services/authService";
import { useNavigate } from "react-router";

function statusToast(status: string, n: number): string {
  const one = n === 1;
  const what = one ? "A listing was" : `${n} listings were`;
  switch (status) {
    case "under_review":
      return `${what} held for review.`;
    case "removed":
      return `${what} removed by an admin.`;
    case "suspended":
      return `${what} put on hold while your account is suspended.`;
    case "banned":
      return `${what} permanently banned.`;
    default:
      return one ? "A listing is now live." : `${n} listings are now live.`;
  }
}
export function RealtimeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useQueryClient();
  const { user, clearUser } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV || !user) return;

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
    const alreadyRegistered = sessionStorage.getItem("pushRegistered");
    if (!alreadyRegistered) {
      registerForPushN()
        .then(() => {
          sessionStorage.setItem("pushRegistered", "true");
        })
        .catch((err) => {
          console.error("Push token failed", err);
          sessionStorage.setItem("pushAttempted", "true");
        });
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((title, body) => {
      showToast("info", `${title}: ${body}`);
      // note to FE: play some sound.
    });
    return unsubscribe;
  }, [user, showToast]);

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
        queryClient.invalidateQueries({
          queryKey: ["reservation", updated.reservationId],
        });
      },
    );

    const offListing = connectionManager.onListingChanged(() => {
      queryClient.invalidateQueries({ queryKey: ["listings", "browse"] });
      queryClient.invalidateQueries({ queryKey: ["listings", "my"] });
    });
    const pending = new Map<string, number>();
    let flushTimer: ReturnType<typeof setTimeout> | undefined;
    const offListingStatusChanged = connectionManager.onListingStatusChanged(
      (e) => {
        queryClient.invalidateQueries({ queryKey: ["listings", "my"] });
        queryClient.invalidateQueries({ queryKey: ["listings", e.listingId] });
        queryClient.invalidateQueries({ queryKey: ["listings", "browse"] });

        pending.set(e.status, (pending.get(e.status) ?? 0) + 1);
        clearTimeout(flushTimer);
        flushTimer = setTimeout(() => {
          pending.forEach((n, status) =>
            showToast("info", statusToast(status, n)),
          );
          pending.clear();
        }, 700);
      },
    );

    if (user?.role === "admin") {
      connectionManager
        .joinAdminGroup()
        .catch((e) => console.error("joinAdminGroup failed", e));
    }

    const offDisputeCreated = connectionManager.onDisputeCreated(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    });

    const offDisputeResubmitted = connectionManager.onDisputeResubmitted(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    });
    const offVerificationCreated = connectionManager.onVerificationCreated(
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.verifications() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      },
    );

    const offDisputeResolved = connectionManager.onDisputeResolved(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    });

    const matchPending = new Map<
      string,
      { title: string; price: number; n: number }
    >();
    let matchTimer: ReturnType<typeof setTimeout> | undefined;

    const offSavedSearchMatch = connectionManager.onSavedSearchMatch((e) => {
      const key = `${e.title}|${e.price}`;
      const cur = matchPending.get(key);
      matchPending.set(key, {
        title: e.title,
        price: e.price,
        n: (cur?.n ?? 0) + 1,
      });
      clearTimeout(matchTimer);
      matchTimer = setTimeout(() => {
        matchPending.forEach(({ title, price, n }) =>
          showToast(
            "info",
            `New match for your search; ${title} - R${price.toFixed(2)}${n > 1 ? ` (${n} copies)` : ""}`,
          ),
        );
        matchPending.clear();
      }, 700);
    });
    const offDisputeOutcome = connectionManager.onDisputeOutcome((e) => {
      showToast("error", e.message + (e.reason ? ` Reason: ${e.reason}` : ""));
    });
    const offListingSold = connectionManager.onListingSold(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist() });
    });
    const offForceLogout = connectionManager.onForceLogout(async (e) => {
      const message =
        e.reason == "account_banned"
          ? "Your account has been permanently banned. You've been logged out."
          : "Your verification was rejected - you have been logged out. Please signup from scratch to use the system again.";

      showToast("info", message);
      try {
        await authService.logout(() => connectionManager.disconnect());
      } catch (err) {
        console.error("logout request failed", err);
      } finally {
        clearUser();
        navigate("/auth/Login", { replace: true });
      }
    });

    const offVerificationResubmission =
      connectionManager.onVerificationResubmissionRequired((e) => {
        showToast(
          "info",
          e.reason
            ? `More info needed for your verification: ${e.reason}`
            : "Please resubmit your proof of registration.",
        );
        navigate("/auth/ProofUpload");
      });

    const offVerificationApproved = connectionManager.onVerificationApproved(
      async () => {
        try {
          await authService.refresh();
        } catch (e) {
          console.error("token refresh failed", e);
        }
        await queryClient.invalidateQueries();
        showToast(
          "success",
          "You're verified-you can now reserve and save items.",
        );
      },
    );

    const offAuditEvent = connectionManager.onAuditEvent(() => {
      queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    });
    return () => {
      offMessage();
      offReconnected();
      offRead();
      offReservationUpdated();
      offListing();
      offDisputeCreated();
      offDisputeResubmitted();
      offDisputeResolved();
      offSavedSearchMatch();
      offVerificationCreated();
      offForceLogout();
      offVerificationResubmission();
      offListingStatusChanged();
      offDisputeOutcome();
      offListingSold();
      offVerificationApproved();
      offAuditEvent();
      clearTimeout(flushTimer);
      if (user?.role === "admin") {
        connectionManager.leaveAdminGroup();
      }
    };
  }, [queryClient, user, showToast, navigate, clearUser]);
  return <>{children}</>;
}
