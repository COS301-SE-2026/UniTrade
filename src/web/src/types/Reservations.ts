export type ReservationStatus = 'active' | 'expired' | 'cancelled' | 'completed';
export type TimerStage = 'awaiting_seller' | 'awaiting_buyer' | 'coordinating';
export type MessageType = 'text' | 'system' | 'meetup_proposal' | 'meetup_response';

export interface Reservation {
    reservationId: string;
    listingId: string;
    buyerId: string;
    sellerId: string;
    reservationStatus: ReservationStatus;
    timerStage: TimerStage;
    expiresAt: string;
    createdAt: string;
}

export interface ReservationCounterparty {
    userId: string;
    name: string;
    initials: string;
}

export interface ReservationListingPreview {
    title: string;
    price: number;
    imagePath: string;
}

export interface ReservationListItem extends Reservation {
    counterparty: ReservationCounterparty;
    listing: ReservationListingPreview;
    unreadCount: number;
}

export interface ReservationListResponse {
    items: ReservationListItem[];
    nextCursor?: string | null;
    hasMore: boolean;
}