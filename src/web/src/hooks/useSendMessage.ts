import {useMutation, useQueryClient} from '@tanstack/react-query';
import {connectionManager } from '../services/realtime/connectionManager';
import { queryKeys } from '../lib/queryKeys';
import type { ClientChatMessage } from '../types/chat';
import { useAuthStore } from '../store/useAuthStore';
import type { ChatMessage } from '../types/Reservations';

interface MutationContext {
    clientId: string;
}

export function useSendMessage(reservationId: string) {
    const queryClient = useQueryClient();
    const {user } = useAuthStore();
    const key = queryKeys.reservationMessages(reservationId);

    const mutation = useMutation<ChatMessage, Error, string, MutationContext>({
        mutationFn: (content: string): Promise<ChatMessage> => connectionManager.sendMessage(reservationId, content),

        onMutate: async (content: string): Promise<MutationContext> => {
            await queryClient.cancelQueries({queryKey: key});

            const clientId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

            const optimisticMessage: ClientChatMessage = {
                messageId: clientId,
                clientId,
                senderId: user?.id ?? 'me',
                messageType: 'text',
                content,
                payload: null,
                sentAt: new Date().toISOString(),
                readAt: null,
                status: 'sending',
            };

            queryClient.setQueryData<ClientChatMessage[]>(key, (old: ClientChatMessage[] =[]) => [...old, optimisticMessage]);

            return {clientId};
        },

        onSuccess: (serverMessage: ChatMessage, _content: string, context?: MutationContext) => {
            if (!context) return;
            queryClient.setQueryData<ClientChatMessage[]>(key, (old: ClientChatMessage[] = []) =>
                old.map((m) => (m.clientId === context.clientId ? { ...serverMessage, status: 'sent' as const } : m))
            );
        },

        onError: (_err: Error, _content: string, context?: MutationContext) => {
            if (!context) return;
            queryClient.setQueryData<ClientChatMessage[]>(key, (old: ClientChatMessage[] = []) =>
                old.map((m) => (m.clientId === context.clientId ? { ...m, status: 'failed' as const } : m))
            );
        },
    });

    const retry = (clientId: string, content: string) => {
        queryClient.setQueryData<ClientChatMessage[]>(key, (old: ClientChatMessage[] =[]) => old.filter((m) => m.clientId !== clientId));
        mutation.mutate(content);
    };

    return { ...mutation, retry};
}