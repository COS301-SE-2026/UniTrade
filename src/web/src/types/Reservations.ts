export type ReservationStatus = 'active' | 'expired' | 'cancelled' | 'completed';
export type TimerStage = 'awaiting_seller' | 'awaiting_buyer' | 'coordinating' | 'meetup_confirmed';
export type MessageType = 'text' | 'system' | 'meetup_proposal' | 'meetup_response';
export type MeetupStatus = 'pending' | 'accepted' | 'declined';

export interface Reservation {
    reservationId: string;
    listingId: string;
    buyerId: string;
    sellerId: string;
    reservationStatus: ReservationStatus;
    timerStage: TimerStage;
    expiresAt: string;
    createdAt: string;
    sellerAcknowledgedAt?:string |null;
    counterParty: ReservationCounterparty | null;
    handoverConfirmedAt: string | null
    completedAt: string | null
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
    counterParty: ReservationCounterparty;
    listing: ReservationListingPreview;
    unreadCount: number;
    lastMessagePreview: string | null;
    lastMessageAt: string | null;
}

export interface ReservationListResponse {
    items: ReservationListItem[];
    nextCursor?: string | null;
    hasMore: boolean;
}

interface ChatMessageBase {
    messageId: number;
    reservationId: string;
    senderId: string;
    clientKey?: string | null;
    sentAt: string;
    readAt: string | null;
}

export interface TextMessage extends ChatMessageBase {
    messageType: 'text';
    content: string;
    payload: null;
}

export interface SystemMessage extends ChatMessageBase {
    messageType: 'system';
    content: string;
    payload: null;
}

export interface MeetupProposalPayload {
    LocationName?: string;
    proposedLocation?: string;
    ProposedTime?: string;
    proposedTime?: string;
    Lat?: number;
    Lng?: number;
    lat?: number;
    lng?: number;
    status?: MeetupStatus;
}

export interface MeetupProposalMessage extends ChatMessageBase {
    messageType: 'meetup_proposal';
    content: string;
    payload: MeetupProposalPayload;
}

export interface MeetupResponsePayload {
    Accepted: boolean;
    ProposalMessageId: number;
}

export interface TransactionRequestResponse {
    sandbox_url: string;
    fields: Record<string, string>;
}



export interface MeetupResponseMessage extends ChatMessageBase {
    messageType: 'meetup_response';
    content: string;
    payload: MeetupResponsePayload;
}

export type ChatMessage =
    | TextMessage
    | SystemMessage
    | MeetupProposalMessage
    | MeetupResponseMessage;

export interface ChatHistoryResponse {
    items: ChatMessage[];
    hasMore: boolean;
    oldestMessageId: number | null;
}
export interface CreateReservationRequest {
    listingId: string;
}

export interface GetReservationParams {
    role: 'buyer' | 'seller';
}

export interface GetMessagesParams {
    reservationId: string;
    before?: string;
    limit?: number;
}
export interface MessagesReadEvent {
    reservationId: string;
    upToMessageId: number;
    readBy: string;
}
export type ApiErrorCode = 'already_reserved' | string;

export interface ApiError {
    code: ApiErrorCode;
    message?: string;
    status: number;
}

export type Result<T> =
    | { success: true; data: T }
    | { success: false; error: ApiError };

