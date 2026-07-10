import { useQuery } from '@tanstack/react-query';
import { getMessages } from '../services/reservationService';
import { queryKeys } from '../lib/queryKeys';

export function useChatMessages(reservationId: string) {
    return useQuery({
        queryKey: queryKeys.reservationMessages(reservationId),
        queryFn : async () => {
            const result = await getMessages({ reservationId});
            if (!result.success) {
                throw new Error(result.error.message ?? result.error.code);
            }
            return result.data.items;
        },
        enables: !!reservationId,
    });
}