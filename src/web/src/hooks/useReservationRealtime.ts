import { useEffect } from 'react';
import {useQueryClient } from '@tanstack/react-query';
import { connectionManager } from '../services/realtime/connectionManager';
import { queryKeys } from '../lib/queryKeys';
import type {ClientChatMessage} from '../types/chat';
import type { ChatMessage } from '../types/Reservations';

export function useReservationRealtime(reservationId: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        connectionManager.connect();

        const unsubscribeMessage = connectionManager.onMessageReceived((message: ChatMessage) => {
        queryClient.setQueryData<ClientChatMessage[]>(
            queryKeys.reservationMessages(reservationId),
            (old: ClientChatMessage[] = []) => {
                if(old.some((m) => m.messageId === message.messageId)) return old;
                return [...old, {...message , status: 'sent'as const}];
            }
        );
    });

        const unsubscribeReconnected = connectionManager.onReconnected(() => {
            queryClient.invalidateQueries({queryKey: queryKeys.reservationMessages(reservationId)});

        });

        const unsubscribeRead = connectionManager.onMessagesRead(() => {
            queryClient.invalidateQueries({querKey: queryKeys.reservations('buyer')});
            queryClient.invalidateQueries({queryKey: queryKeys.reservations('seller')});
        });
            return () => {
                 unsubscribeMessage();
                 unsubscribeReconnected();
                 unsubscribeRead();
            };
        }, [reservationId, queryClient]);
        
    }