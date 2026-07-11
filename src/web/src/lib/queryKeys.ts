export const queryKeys = {
  reservations: (role: 'buyer' | 'seller') =>
    ['reservations', role] as const,

  reservationMessages: (reservationId: string) =>
    ['reservations', reservationId, 'messages'] as const,
};