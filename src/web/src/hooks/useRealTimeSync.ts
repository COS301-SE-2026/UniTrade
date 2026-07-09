import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectionManager } from '../services/realtime/connectionManager';
import { queryKeys } from '../queryClient';


export function useRealtimeSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    connectionManager.connect();

    const unsubMessage = connectionManager.onMessageReceived(() => {
    
      queryClient.invalidateQueries({ queryKey: ['reservations'], exact: false });
    });

    const unsubReservationUpdated = connectionManager.onReservationUpdated(
      () => {
        
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations('buyer') });
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations('seller') });
      }
    );

   
    const unsubReconnected = connectionManager.onReconnected(() => {
      queryClient.invalidateQueries({ queryKey: ['reservations'], exact: false });
    });

    return () => {
      unsubMessage();
      unsubReservationUpdated();
      unsubReconnected();
    };
  }, [queryClient]);
}
