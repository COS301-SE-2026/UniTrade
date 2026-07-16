import { useMutation, useQueryClient } from "@tanstack/react-query";
import { connectionManager } from "../services/realtime/connectionManager";
import { queryKeys } from "../lib/queryKeys";
import type { ClientChatMessage } from "../types/chat";
import { useAuthStore } from "../store/useAuthStore";
import type { ChatMessage } from "../types/Reservations";

interface SendVars {
  content: string;
  clientId: string;
  isRetry: boolean;
}

interface MutationContext {
  clientId: string;
  isRetry: boolean;
}

export function useSendMessage(reservationId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const key = queryKeys.reservationMessages(reservationId);

  const mutation = useMutation<ChatMessage, Error, SendVars, MutationContext>({
    mutationFn: async ({ content, clientId }) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Send timed out")), 10_000);
      });

      try {
        return await Promise.race([
          connectionManager.sendMessage(reservationId, content, clientId),
          timeoutPromise,
        ]);
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }
    },

    onMutate: async (vars: SendVars): Promise<MutationContext> => {
      const { content, clientId, isRetry } = vars;
      await queryClient.cancelQueries({ queryKey: key });

      if (isRetry) {
        queryClient.setQueryData<ClientChatMessage[]>(key, (old = []) =>
          old.map((m) =>
            m.clientId === clientId ? { ...m, status: "sending" as const } : m,
          ),
        );
      } else {
        const optimisticMessage: ClientChatMessage = {
          clientId,
          reservationId,
          senderId: user?.id ?? "me",
          messageType: "text",
          content,
          payload: null,
          sentAt: new Date().toISOString(),
          readAt: null,
          status: "sending",
        };
        queryClient.setQueryData<ClientChatMessage[]>(key, (old = []) => [
          ...old,
          optimisticMessage,
        ]);
      }

      return { clientId, isRetry };
    },

    onSuccess: (
      serverMessage: ChatMessage,
      _vars: SendVars,
      context?: MutationContext,
    ) => {
      if (!context || !serverMessage) return;

      queryClient.setQueryData<ClientChatMessage[]>(key, (old = []) => {
        const alreadyReceivedViaSocket = old.some(
          (m) =>
            m.messageId === serverMessage.messageId &&
            m.clientId !== context.clientId,
        );

        if (alreadyReceivedViaSocket) {
          return old
            .filter((m) => m.clientId !== context.clientId)
            .map((m) =>
              m.messageId === serverMessage.messageId
                ? {
                    ...m,
                    senderId: user?.id ?? "me",
                    status: "sent" as const,
                  }
                : m,
            );
        }

        return old.map((m) =>
          m.clientId === context.clientId
            ? {
                ...serverMessage,
                clientId: context.clientId,
                senderId: user?.id ?? "me",
                status: "sent" as const,
              }
            : m,
        );
      });
    },

    onError: (_err: Error, _vars: SendVars, context?: MutationContext) => {
      if (!context) return;
      queryClient.setQueryData<ClientChatMessage[]>(key, (old = []) =>
        old.map((m) =>
          m.clientId === context.clientId
            ? { ...m, status: "failed" as const }
            : m,
        ),
      );
    },
  });

  const send = (content: string) => {
    const clientId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (navigator.onLine && connectionManager.getState() !== "Connected") {
      queryClient.setQueryData<ClientChatMessage[]>(key, (old = []) => [
        ...old,
        {
          clientId,
          reservationId,
          senderId: user?.id ?? "me",
          messageType: "text",
          content,
          payload: null,
          sentAt: new Date().toISOString(),
          readAt: null,
          status: "failed" as const,
        },
      ]);
      return;
    }
    mutation.mutate({ content, clientId, isRetry: false });
  };

  const retry = (clientId: string, content: string) => {
    if (navigator.onLine && connectionManager.getState() !== "Connected") {
      queryClient.setQueryData<ClientChatMessage[]>(key, (old = []) =>
        old.map((m) =>
          m.clientId === clientId ? { ...m, status: "failed" as const } : m,
        ),
      );
      return;
    }
    mutation.mutate({ content, clientId, isRetry: true });
  };

  return { send, retry, isPending: mutation.isPending };
}
