import { useEffect } from 'react';
import {useQueryClient } from '@tanstack/react-query';
import { connectionManager } from '../services/realtime/connectionManager';
import { queryKeys } from '../lib/queryKeys';
import type {ClientChatMessage} from '../types/chat';
//import type { ChatMessage } from '../types/Reservations';

export function useReservationRealtime(reservationId: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        let cancelled = false;

        connectionManager.connect().then(() => {
            if (!cancelled) {
                connectionManager.joinRoom(reservationId).catch(() => {});
            }
        });

        const unsubscribeMessage = connectionManager.onMessageReceived((newMessage) => {
            queryClient.setQueryData<ClientChatMessage[]>(
                queryKeys.reservationMessages(reservationId),
                (oldMessages = []) => {
                    const existingIndex = oldMessages.findIndex(
                        (m) => m.messageId === newMessage.messageId
                    );
                    if (existingIndex !== -1) {
                        const updated = [...oldMessages];
                        updated[existingIndex] = {...updated[existingIndex], ...newMessage};
                        return updated;
                    }

                   return [...oldMessages, newMessage];
                }
            );
        });

        const unsubscribeReconnected = connectionManager.onReconnected(() => {
            connectionManager.joinRoom(reservationId).catch(() => {});
            queryClient.invalidateQueries({ queryKey: queryKeys.reservationMessages(reservationId) });
        });

        const unsubscribeRead = connectionManager.onMessagesRead(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.reservations('buyer') });
            queryClient.invalidateQueries({ queryKey: queryKeys.reservations('seller') });
        });

        return () => {
            cancelled = true;
            unsubscribeMessage();
            unsubscribeReconnected();
            unsubscribeRead();
        };
    }, [reservationId, queryClient]);
}