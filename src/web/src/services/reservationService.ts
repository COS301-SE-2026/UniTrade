import type {
    Reservation,
    ReservationListResponse,
    ChatHistoryResponse,
    CreateReservationRequest,
    GetReservationParams,
    GetMessagesParams,
    Result,
    ReservationListItem,
    //ApiError,
    
} from '../types/Reservations'
import { getApiUrl } from "../config";



async function handleResponse<T>(res: Response): Promise<Result<T>>{
     if (res.ok) {
        const data = (await res.json()) as T;
        return { success: true, data};
     }

     let code = 'unknown_error';
     let message: string | undefined;

     try {
        const body = await res.json();
        code = body.error ?? body.code ?? code;
        message = body.message;
     } catch {
        //no body
     }

     return { success: false, error: { code, message, status: res.status } };
}

const mockReservations:ReservationListItem[] = []


export interface MockListingInfo {
  title: string
  price: number
  imagePath: string

}

export interface MockCounterparty {
  userId: string
  name: string
  initials: string
}
export async function createReservation(
    payload: CreateReservationRequest,   
): Promise<Result<Reservation>> {
  const alreadyActive = mockReservations.some(
    (r) => r.listingId === payload.listingId && r.reservationStatus === 'active'
  )

  if(alreadyActive)
  {
    return{ success: false, error: { code: 'already_reserved', status: 409 } }
  }

    const res = await fetch(`${getApiUrl()}/reservations`, {
     method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
    });
    return handleResponse<Reservation>(res);    
}

export async function acknowledgeReservatioin(
    reservationId: string
): Promise<Result<Reservation>> {
    
    const res = await fetch(`${getApiUrl()}/reservations/${reservationId}/acknowledge`, {
    method: 'POST',
    credentials: 'include',
     headers: { 'Content-Type': 'application/json'},
    });
    return handleResponse<Reservation>(res)
}

export async function cancelReservation(
    reservationId: string
): Promise<Result<Reservation>> {
   
    const res = await fetch(`${getApiUrl()}/reservations/${reservationId}/cancel`, {
    method: 'POST',
    credentials: 'include',
    });
    return handleResponse<Reservation>(res)
}

export async function getReservations(
  params: GetReservationParams
): Promise<Result<ReservationListResponse>> {

    const query = new URLSearchParams({ role: params.role });
    const res = await fetch(`${getApiUrl()}/reservations/?${query}`, {
      credentials: 'include'
    });
    return handleResponse<ReservationListResponse>(res);
}

export async function getMessages(
    params: GetMessagesParams
): Promise<Result<ChatHistoryResponse>> {
 

   const query = new URLSearchParams();
  if (params.before) query.set('before', params.before);
  query.set('limit', String(params.limit ?? 20));
  const res = await fetch(
   `${getApiUrl()}/reservations/${params.reservationId}/messages?${query}`,
   { credentials: 'include'}
  );
  return handleResponse<ChatHistoryResponse>(res);
}



export async function getReservationById(
  reservationId: string ): 
  Promise<Result<Reservation>> {
const res = await fetch(`${getApiUrl()}/reservations/${reservationId}`, {
  credentials: 'include',
});
return handleResponse<Reservation>(res)
  }