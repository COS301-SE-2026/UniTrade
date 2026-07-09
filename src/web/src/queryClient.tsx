import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      
      staleTime: 30 * 1000,

      retry: 1,

      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  reservations: (role: 'buyer' | 'seller') => ['reservations', role] as const,
  reservationMessages: (reservationId: string) =>
    ['reservations', reservationId, 'messages'] as const,
};

export function AppQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
