export const queryKeys = {
  allReservationMessages: () => ["reservation-messages"] as const,
  reservationMessages: (reservationId: string) =>
    ["reservation-messages", reservationId] as const,
  reservations: (role: "buyer" | "seller") => ["reservations", role] as const,
  wishlist: () => ["wishlist"] as const,
  disputes: () => ["disputes"] as const,
  dashboardStats: () => ["dashboard"] as const 
};
