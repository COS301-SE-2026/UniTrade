import { http, HttpResponse } from 'msw'
import type { CreateReservationRequest } from '../../types/Reservations'


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

interface MockReservation {
  reservationId: string;
  listingId: string;
  reservationStatus: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  timerStage: string;
}

let mockListings: MockListing[] = [];
let nextId = 1;
let mockReservations: MockReservation[] = [];
let nextReservationId = 1;

export function resetMockListings() {
  mockListings = []
  nextId = 1
}
export function resetMockReservations() {
  mockReservations = []
  nextReservationId = 1
}

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

    const reservation: MockReservation = {
      reservationId: String(nextReservationId++),
      listingId: body.listingId,
      reservationStatus: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      timerStage: 'awaiting_seller',
    };
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

