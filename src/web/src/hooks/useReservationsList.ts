import {useQuery} from '@tanstack/react-query';
import { getReservations } from '../services/reservationService';
import {queryKeys} from '../lib/queryKeys';
import type { ReservationListItem } from '../types/Reservations';

export function useReservationsList(role: 'buyer' | 'seller', options?: {enabled?: boolean}){
    return useQuery<ReservationListItem[]>({
        queryKey: queryKeys.reservations(role),
        queryFn: async () => {
            const result = await getReservations({role });
            if(!result.success){
                throw new Error(result.error.message ?? result.error.code);
            }
            return result.data.items;
        },
        enabled: options?.enabled ?? true,
    });
}