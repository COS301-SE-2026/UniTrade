import type {
    Reservation,
    ReservationListResponse,
    ChatHistoryResponse,
    CreateReservationRequest,
    GetReservationParams,
    //GetMessagesParams,
    Result,
    //ApiError,
    
} from '../types/Reservations'

//const BASE_URL = import.meta.env.VITE_API_URL;
//const API_ORIGIN = new URL(BASE_URL).origin;

/*async function handleResponse<T>(res: Response): Promise<Result<T>>{
     if (res.ok) {
        const data = (await res.json()) as T;
        return { success: true, data};
     }

     let code = 'unknown_error';
     let message: string | undefined;

     try {
        const body = await res.json();
        code = body.code ?? code;
        message = body.message;
     } catch {
        //no body
     }

     const error: ApiError = { code, message, status: res.status };
     return { success: false, error};
}*/

export async function createReservation(
    payload: CreateReservationRequest
): Promise<Result<Reservation>> {
    //Mock 
    if (payload.listingId === 'already-reserved-mock-id') {
        return {
            success: false,
            error: {code: 'already_reserved', status: 409}
        };
    }
    return {
        success: true,
        data: {
            reservationId: 'mock-res-10',
            listingId: payload.listingId,
            buyerId: 'mock-buyer-1',
            sellerId: 'mock-seller-1',
            reservationStatus: 'active',
            timerStage: 'awaiting_seller',
            expiresAt: new Date(Date.now() + 1000 * 60 *60).toISOString(),
            createdAt: new Date().toISOString(),
        },
    };

    //const res = await fetch(`${BASE_URL}/reservations`, {
    // method: 'POST',
    // credentials: 'include',
    // headers: { 'Content-Type': 'application/json'},
    // body: JSON.stringify(payload),
    // });
    // return handleResponse<Reservation>(res);
}

export async function acknowledgeReservatioin(
    reservationId: string
): Promise<Result<Reservation>> {
    //mock 
    return {
        success: true,
        data: {
            reservationId,
            listingId: 'mock-listing-1',
            buyerId: 'mock-buyer-1',
            sellerId: 'mock-seller-1',
            reservationStatus: 'active',
            timerStage: 'awaiting_buyer',
            expiresAt: new Date(Date.now() + 1000 * 60 *60).toISOString(),
            createdAt: new Date().toISOString(),
        },
    };

    // const res = await fetch(`${BASE_URL}/reservations/${reservationId}/acknowledge`, {
    // method: 'POST',
    // credentials: 'include',
    // headers: { 'Content-Type': 'application/json'},
    //});
    // return handleResponse<Reservation>(res)
}

export async function cancelReservation(
    reservationId: string
): Promise<Result<Reservation>> {
    //mock 
    return {
        success: true,
        data: {
            reservationId,
            listingId: 'mock-listing-1',
            buyerId: 'mock-seller-1',
            sellerId: 'mock-seller-1',
            reservationStatus: 'cancelled',
            timerStage: 'awaiting_seller',
            expiresAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        },
    };

    // const res = await fetch(`${BASE_URL}/reservations/${reservationId}/cancel`, {
    // method: 'POST',
    // credentials: 'include',
    // headers: { 'Content-Type': 'application/json'},
    //});
    // return handleResponse<Reservation>(res)
}

export async function getReservations(
    params: GetReservationParams
): Promise<Result<ReservationListResponse>> {
    //mock
    if (params.role === 'buyer') {
            return {
      success: true,
      data: {
        items: [
          mockListItem('res-b1', 'awaiting_seller', 0),
          mockListItem('res-b2', 'awaiting_buyer', 2),
          mockListItem('res-b3', 'coordinating', 0),
        ],
        hasMore: false,
        nextCursor: null,
      },
    };
  }
  return {
    success: true,
    data: {
      items: [
        mockListItem('res-s1', 'awaiting_seller', 1),
        mockListItem('res-s2', 'coordinating', 0),
      ],
      hasMore: false,
      nextCursor: null,
    },
    };

    // const query = new URLSearchParams({ role: params.role });
    // const res = await fetch(`${BASE_URL}/reservations/?${query}`);
    // return handleResponse<ReservationListResponse>(res);
}

export async function getMessages(
    //params: GetMessagesParams
): Promise<Result<ChatHistoryResponse>> {
    //mock
    return {
    success: true,
    data: {
      items: [
        {
          messageId: 'msg-3',
          senderId: 'mock-buyer-1',
          messageType: 'meetup_proposal',
          content: 'Can we meet at the library at 3pm?',
          payload: {
            proposedTime: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
            proposedLocation: 'Merensky Library',
          },
          sentAt: new Date().toISOString(),
          readAt: null,
        },
        {
          messageId: 'msg-2',
          senderId: 'system',
          messageType: 'system',
          content: 'Seller acknowledged the reservation.',
          payload: null,
          sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          readAt: new Date().toISOString(),
        },
        {
          messageId: 'msg-1',
          senderId: 'mock-buyer-1',
          messageType: 'text',
          content: 'Hi, is this still available?',
          payload: null,
          sentAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          readAt: new Date().toISOString(),
        },
      ],
      hasMore: false,
      oldestMessageId: 'msg-1',
    },
  };

  // const query = new URLSearchParams();
  // if (params.before) query.set('before', params.before);
  // query.set('limit', String(params.limit ?? 20));
  // const res = await fetch(
  // `${BASE_URL}/reservations/${params.reservationId}/messages?${query}`
  //);
  // return handleResponse<ChatHistoryResponse>(res);
}

function mockListItem(
    id: string,
    timerStage: Reservation['timerStage'],
    unreadCount: number
) {
     return {
    reservationId: id,
    listingId: `listing-${id}`,
    buyerId: 'mock-buyer-1',
    sellerId: 'mock-seller-1',
    reservationStatus: 'active' as const,
    timerStage,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    createdAt: new Date().toISOString(),
    counterparty: {
      userId: 'mock-counterparty-1',
      name: 'Thabo M.',
      initials: 'TM',
    },
    listing: {
      title: 'Calculus: Early Transcendentals (8th Ed)',
      price: 350,
      imagePath: '/assets/textbook.jpg',
    },
    unreadCount,
  }; 
}