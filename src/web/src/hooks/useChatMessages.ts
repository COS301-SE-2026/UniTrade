import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages } from "../services/reservationService";
import { queryKeys } from "../lib/queryKeys";
import type { ClientChatMessage } from "../types/chat";

export function useChatMessages(reservationId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.reservationMessages(reservationId);

  return useQuery<ClientChatMessage[]>({
    queryKey: key,
    queryFn: async () => {
      const result = await getMessages({ reservationId });
      if (!result.success) {
        throw new Error(result.error.message ?? result.error.code);
      }
      const server = result.data.items;

      const cached = queryClient.getQueryData<ClientChatMessage[]>(key) ?? [];
      const localOnly = cached.filter(
        (m) =>
          (m.status === "sending" || m.status === "failed") &&
          !server.some(
            (s) =>
              s.messageId === m.messageId ||
              (m.clientId != null && s.clientKey === m.clientId),
          ),
      );
      return [...server, ...localOnly];
    },
    enabled: !!reservationId,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
