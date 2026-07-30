import { http, HttpResponse } from 'msw'
import type { CreateReservationRequest, ChatMessage } from '../../types/Reservations'
import type { ReservationListItem} from '../../types/Reservations'
import type { ProposeMeetupPayload } from '../../types/listing';
import type { Review } from '../../types/listing';

interface MockListing {
  listingId: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  listingStatus: string;
  viewCount: number;
  sellerId: string;
  seller: { sellerId: string; fullName: string };
  createdAt: string;
  courseId: string | null;
  categoryName: string;
  metadata: Record<string, unknown> | null;
  images: string[];
}
interface AcceptMeetupRequestBody {
  proposalMessageId: number
}

interface MockTransaction {
  reservationId: string
  transactionId: string | null
  transactionStatus: 'none' | 'completed' | string
  pinStatus: 'pending' | 'confirmed' | null
  pin: string | null
  paidAt: string | null 
}

let mockTransactions: MockTransaction[] = []
let mockReviews: Review[] = []

export function resetMockTransactions() {
  mockTransactions = []
}

export function resetMockReviews() {
  mockReviews = []
}


let mockListings: MockListing[] = [];
let nextId = 1;
let mockReservations: ReservationListItem[] = []
let nextReservationId = 1
let mockMessages: ChatMessage[] = []

export function resetMockMessages() {
  mockMessages = []
}

export function resetMockListings() {
  mockListings = []
  nextId = 1
}
export function resetMockReservations() {
  mockReservations = []
  nextReservationId = 1
}

export function seedMockTransaction(overrides: Partial<MockTransaction> = {}): MockTransaction{
  const tx: MockTransaction = {
    reservationId: '1',
    transactionId: `txn-${overrides.reservationId ?? '1'}`,
    transactionStatus: 'completed',
    pinStatus: 'confirmed',
    pin: null,
    paidAt: new Date().toISOString(),
    ...overrides,
  }
  mockTransactions.push(tx)
  return tx
}

export function seedMockReview(overrides: Partial<Review> = {}): Review {
  const review = {
    reviewId: String(Date.now()),
    reviewType: 'buyer_to_seller',
    reviewerId: 'buyer-1',
    revieweeId: 'seller-1',
    transactionId: 'txn-1',
    rating: 5,
    comment: 'Great transaction, really easy to communicate with the seller',
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Review
  mockReviews.push(review)
  return review

}

export const orderFlowHandlers = [
  http.get('http://localhost:5000/api/reservations/:id/transaction-status', ({ params }) => {
    const tx = mockTransactions.find(t => t.reservationId === params.id)
    if (!tx) {
      return HttpResponse.json({
        transactionId: null,
        transactionStatus: 'none',
        pinStatus: null,
        pin: null,
        paidAt: null,
      })
    }
    return HttpResponse.json(tx)
  }),

  http.get('http://localhost:5000/api/reviews/users/:userId', ({ params }) => {
    const reviews = mockReviews.filter(r => r.revieweeId === params.userId)
    return HttpResponse.json({ reviews })
  }),

  http.post('http://localhost:5000/api/reviews', async ({ request }) => {
    const body = await request.json() as Partial<Review>
    const review = seedMockReview(body)
    return HttpResponse.json(review, { status: 201 })
  }),

  http.get('http://localhost:5000/api/reservations/:id/meetup', () => {
    return new HttpResponse(null, { status: 404 })
  }),
]

export function seedMockListing(overrides: Partial<MockListing> = {}) {
  const listing = {
    listingId: String(nextId++),
    title: 'Calculus Textbook',
    description: 'Good condition, minor highlighting.',
    price: 250,
    condition: 'like_new',
    listingStatus: 'live',
    viewCount: 42,
    sellerId: 'seller-1',
    seller: { sellerId: 'seller-1', fullName: 'Test Seller' },
    createdAt: '2026-05-07T09:14:00Z',
    courseId: null,
    categoryName: 'book',
    metadata: null,
    images: [],
    ...overrides,
  }
  mockListings.push(listing)
  return listing
}

export function seedMockReservation(overrides: Partial<ReservationListItem> = {}): ReservationListItem {
  const reservation: ReservationListItem = {
    reservationId: String(nextReservationId++),
    listingId: '1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    reservationStatus: 'active',
    timerStage: 'awaiting_seller',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    sellerAcknowledgedAt: null,
    handoverConfirmedAt: null,
    completedAt: null,
    counterParty: { userId: 'buyer-1', name: 'Test Buyer', initials: 'TB' },
    listing: { title: 'Chemistry Textbook - 3rd Ed', price: 250, imagePath: '' },
    unreadCount: 0,
    lastMessagePreview: null,
    lastMessageAt: null,
    ...overrides,
  }
  mockReservations.push(reservation)
  return reservation
}
export const listingLifecycleHandlers = [


  http.post('http://localhost:5000/api/listings', async ({ request }) => {
    const body = await request.json() as Omit<MockListing, 'listingId' | 'createdAt' | 'viewCount' | 'seller' | 'sellerId'>;
    const listing: MockListing = {
      listingId: String(nextId++),
      title: body.title,
      description: body.description,
      price: body.price,
      condition: body.condition,
      categoryName: body.categoryName,
      listingStatus: body.listingStatus,
      courseId: 'WTW114',
      viewCount: 0,
      sellerId: 'seller-1',
      createdAt: new Date().toISOString(),
      metadata: body.metadata ?? null,
      images: [],
      seller: { sellerId: 'seller-1', fullName: 'Test Seller' },
    }
    mockListings.push(listing)
    return HttpResponse.json(listing, { status: 201 })
  }),

  http.post('http://localhost:5000/api/listings/:id/images', () => {
    return HttpResponse.json({ imageIds: [1] })
  }),

  http.get('http://localhost:5000/api/listings', ({ request }) => {
    const url = new URL(request.url)

    if (url.searchParams.has('sellerId')) {
      return HttpResponse.json({ items: mockListings, total: mockListings.length })
    }
    const excludeSellerId = url.searchParams.get('excludeSellerId')
    const results = mockListings.filter(l => {
      if (l.listingStatus !== 'live') return false
      if (excludeSellerId && l.sellerId === excludeSellerId) return false
      return true
    })

    return HttpResponse.json({ items: results, total: results.length })
  }),

  http.get('http://localhost:5000/api/listings/:id', ({ params }) => {
    const listing = mockListings.find(l => l.listingId === params.id)
    if (!listing) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(listing)
  }),

  http.put('http://localhost:5000/api/listings/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<MockListing>;
    const listing = mockListings.find(l => l.listingId === params.id)
    if (!listing) return new HttpResponse(null, { status: 404 })
    Object.assign(listing, body)
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('http://localhost:5000/api/listings/:id', ({ params }) => {
    mockListings = mockListings.filter(l => l.listingId !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
  http.patch('http://localhost:5000/api/listings/:id/status', async ({ params, request }) => {
    const body = await request.json() as { status: string };
    const listing = mockListings.find(l => l.listingId === params.id)
    if (!listing) return new HttpResponse(null, { status: 404 })
    listing.listingStatus = body.status
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('http://localhost:5000/api/listing-categories', () => {
    return HttpResponse.json([
      { id: 1, name: 'book' },
      { id: 2, name: 'electronics' },
    ])
  }),

  http.get('http://localhost:5000/api/courses', () => {
    return HttpResponse.json([
      { courseId: 1076, courseCode: 'WTW114', courseName: 'Calculus' },
    ])
  }),

]

export const browseAndReserveHandlers = [
  http.get('http://localhost:5000/api/listings', ({ request }) => {
    const url = new URL(request.url)
    if (!url.searchParams.has('sellerId')) {
      return HttpResponse.json({ items: mockListings, total: mockListings.length })
    }
    return HttpResponse.json({ items: [], total: 0 })
  }),

  http.post('http://localhost:5000/api/reservations', async ({ request }) => {
    const body = await request.json() as CreateReservationRequest
    const listing = mockListings.find(l => l.listingId === body.listingId)

    if (listing?.sellerId === 'buyer-1') {
      return HttpResponse.json({ error: 'self_reserve' }, { status: 403 })
    }

    const alreadyReserved = mockReservations.some(
      r => r.listingId === body.listingId && r.reservationStatus === 'active'
    )
    if (alreadyReserved) {
      return HttpResponse.json({ error: 'already_reserved' }, { status: 409 })
    }

    const reservation: ReservationListItem = {
      reservationId: String(nextReservationId++),
      listingId: body.listingId,
      buyerId: 'buyer-1',
      sellerId: listing?.sellerId ?? 'seller-1',
      reservationStatus: 'active',
      timerStage: 'awaiting_seller',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      sellerAcknowledgedAt: null,
      handoverConfirmedAt: null,
      completedAt: null,
      counterParty: { userId: listing?.sellerId ?? 'seller-1', name: 'Test Seller', initials: 'TS' },
      listing: {
        title: listing?.title ?? 'Unknown listing',
        price: listing?.price ?? 0,
        imagePath: '',
      },
      unreadCount: 0,
      lastMessagePreview: null,
      lastMessageAt: null,
    }

    mockReservations.push(reservation)
    return HttpResponse.json(reservation, { status: 201 })
  }),


  http.get('http://localhost:5000/api/reservations/', () => {
    const items = mockReservations.map(r => {
      const listing = mockListings.find(l => l.listingId === r.listingId);
      return {
        reservationId: r.reservationId,
        listingId: r.listingId,
        reservationStatus: r.reservationStatus,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timerStage: r.timerStage ?? 'awaiting_seller',
        unreadCount: 0,
        listing: {
          title: listing?.title ?? 'Unknown listing',
          price: listing?.price ?? 0,
          imagePath: '',
        },
        counterParty: {
          userId: listing?.sellerId ?? 'seller-2',
          name: 'Test Seller',
          initials: 'TS',
        },
      };
    });

    return HttpResponse.json({ items, total: items.length });
  }),

  

]

export const chatHandlers =[
http.get('http://localhost:5000/api/reservations/:id/messages', ({ params}) => {
    const items = mockMessages.filter(m => m.reservationId === params.id)
    return HttpResponse.json({ items, hasMore: false, oldestMessageId: items[0]?.messageId ?? null })
  }),

  http.get('http://localhost:5000/api/reservations/:id', ({params}) => {
     const reservation = mockReservations.find(r => r.reservationId === params.id)
     if (!reservation) return new HttpResponse(null, { status: 404})
      return HttpResponse.json(reservation)
  }),
]

export const sellerReservationHandlers = [
  http.get('http://localhost:5000/api/reservations/', ({request}) => {
    const url = new URL(request.url)
    const role = url.searchParams.get('role')
    const items = mockReservations.filter(r =>
      role === 'seller' ? r.sellerId === 'seller-1': r.buyerId === 'buyer-1'
    )
    return HttpResponse.json({items, total: items.length})
  }),

  http.post('http://localhost:5000/api/reservations/:id/acknowledge', ({ params }) => {
    const reservation = mockReservations.find(r => r.reservationId === params.id)
    if (!reservation) return new HttpResponse(null, {status: 404})
      reservation.timerStage = 'coordinating'
    reservation.sellerAcknowledgedAt = new Date().toISOString()
    return HttpResponse.json(reservation)
  }),

  http.post('http://localhost:5000/api/reservations/:id/cancel', ({ params }) => {
    const reservation = mockReservations.find(r => r.reservationId === params.id)
    if (!reservation) return new HttpResponse(null, {status: 404})
      reservation.reservationStatus = 'cancelled'
    return HttpResponse.json(reservation)
  })
]

export const meetupHandlers = [
  http.get('https://nominatim.openstreetmap.org/reverse', () => {
    return HttpResponse.json({ display_name: 'Merensky Library, Lynnwood Road, Pretoria'})
  }),

  http.post('http://localhost:5000/api/reservations/:id/meetup/propose', async ({params, request}) => {
    const body = await request.json() as ProposeMeetupPayload
    const message: ChatMessage = {
      messageId: Date.now(),
      reservationId: String(params.id),
      senderId: 'buyer-1',
      clientKey: null,
      sentAt: new Date().toISOString(),
      readAt: null,
      messageType: 'meetup_proposal' as const,
      content: 'Meetup proposed',
      payload: {
        LocationName: body.locationName,
        ProposedTime: body.proposedTime,
        lat: body.lat,
        Lng: body.lng,
        status: 'pending',
      },
    }
    mockMessages.push(message)
    return HttpResponse.json({ status: 'pending'})
  }),

  http.post('http://localhost:5000/api/reservations/:id/meetup/accept', async ({ params,request}) => {
    const body = await request.json() as AcceptMeetupRequestBody
    //const proposal = mockMessages.find(m => m.messageId === body.proposalMessageId)
    const message:ChatMessage = {
      messageId: Date.now(),
      reservationId: String(params.id),
      senderId: 'buyer-1',
      clientKey: null,
      sentAt: new Date().toISOString(),
      readAt: null,
      messageType: 'meetup_response' as const,
      content: 'Meetup accepted',
      payload: { Accepted: true, ProposalMessageId: body.proposalMessageId},
    }
    mockMessages.push(message)
    return HttpResponse.json({ status: 'accepted'})
  }),
]
