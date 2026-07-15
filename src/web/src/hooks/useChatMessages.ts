import { useQuery } from "@tanstack/react-query";
import { getMessages } from "../services/reservationService";
import { queryKeys } from "../lib/queryKeys";
import type { ClientChatMessage } from "../types/chat";

export function useChatMessages(reservationId: string) {
  return useQuery<ClientChatMessage[]>({
    queryKey: queryKeys.reservationMessages(reservationId),
    queryFn: async () => {
      const result = await getMessages({ reservationId });
      if (!result.success) {
        throw new Error(result.error.message ?? result.error.code);
      }
      return result.data.items;
    },
    enabled: !!reservationId,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
