import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectionManager } from '../services/realtime/connectionManager';
import { queryKeys } from '../lib/queryKeys';

export function useReservationRealtime(reservationId: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        let active = true;


        connectionManager.joinRoom(reservationId).then(() => {
            if (active) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.reservationMessages(reservationId),
                });

            }
        })
            .catch((e) => console.error('joinRoom failed', e));

        return () => {
            active = false;
            void connectionManager.leaveRoom(reservationId);
        };

    }, [reservationId, queryClient]);
}