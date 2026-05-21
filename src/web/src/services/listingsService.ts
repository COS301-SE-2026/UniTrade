import type { ListingDetail, ListingCategory } from '../types/listing'
import type { ListingSummary, MyListingsResponse } from '../types/listing'
import type { SellerListingDetail } from '../types/listing'
import type { BrowseListing, BrowseListingsResponse, BrowseCondition, BrowseCategory } from '../types/listing'
import biologyTextbook from '../assets/bio-textbook.jpg'
import { useAuthStore } from '../store/useAuthStore'

const BASE_URL = import.meta.env.VITE_API_URL

function mapCondition(condition: string): BrowseCondition {
  const map: Record<string, BrowseCondition> = {
    like_new: 'Good',
    good:     'Good',
    fair:     'Fair',
    worn:     'Poor',
  }
  return map[condition] ?? 'Fair'
}

function mapCategory(listingType: string): ListingCategory {
  const map: Record<string, ListingCategory> = {
    textbook:      'textbook',
    electronics:   'electronics',
    lab_equipment: 'lab_equipment',
    stationery:    'stationery',
    laptop:        'electronics',
  }
  return map[listingType] ?? 'other'
}

function mapBrowseCategory(listingType: string): BrowseCategory {
  const map: Record<string, BrowseCategory> = {
    textbook:      'Textbooks',
    electronics:   'Electronics',
    lab_equipment: 'Lab Equipment',
    stationery:    'Stationary',
    laptop:        'Electronics',
  }
  return map[listingType] ?? 'Textbooks'
}

const mockMyListings: ListingSummary[] = [
  { id: '1', title: 'Chemistry Textbook - 3rd Ed',      meta: 'CMY127 · Listed 7 May 2026',      price: 250,  status: 'live',     views: 42, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CH' },
  { id: '2', title: 'HP Laptop 15" - Good Condition',   meta: 'Electronics · Listed 5 May 2026',  price: 4500, status: 'live',     views: 25, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=LP' },
  { id: '3', title: 'Geometry Set - Unopened',          meta: 'Stationery · Listed 4 May 2026',   price: 250,  status: 'pending',  views: 68, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=GS' },
  { id: '4', title: 'Calculus - Early Transcendentals', meta: 'WTW114 · Listed 3 May 2026',       price: 350,  status: 'draft',    views: 89, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CA' },
  { id: '5', title: 'Molecular Biology - 6th Ed',       meta: 'BIO226 · Listed 3 May 2026',       price: 350,  status: 'rejected', views: 89, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=MB' },
]

const mockListingDetail: ListingDetail = {
  id: '1',
  title: 'Calculus - Early Transcendentals',
  description: 'Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP.',
  price: 280,
  condition: 'like_new',
  category: 'textbook',
  status: 'live',
  courseCode: 'WTW114',
  university: 'University of Pretoria',
  tags: ['WTW114', 'First Year', 'University of Pretoria'],
  images: [
    { id: '1', url: '', isPrimary: true  },
    { id: '2', url: '', isPrimary: false },
    { id: '3', url: '', isPrimary: false },
  ],
  views: 42,
  listedAt: '2026-05-07T09:14:00Z',
  sellerId: 'seller-1',
  sellerName: 'Langa Vakalisa',
  sellerInitials: 'LV',
  sellerRating: 4.9,
  sellerResponseRate: 98,
  sellerTotalListings: 12,
  isReserved: false,
  aiScore: 78,
  aiLabel: 'low_risk',
  reviews: [
    { id: 'r1', initials: 'ZS', name: 'Zelamene S.', stars: 5, text: 'Item was exactly as described.', date: '2026-05-03T00:00:00Z' },
    { id: 'r2', initials: 'SK', name: 'Sabira K.',   stars: 4, text: 'Book was in good condition.',    date: '2026-04-28T00:00:00Z' },
  ],
  similarListings: [
    { id: '2', title: 'Calculus - Early Transcendentals 3rd Ed', meta: 'UP · R120', condition: 'good' },
    { id: '3', title: 'Linear Algebra - 6th Ed',                 meta: 'UP · R310', condition: 'fair' },
  ],
}

const mockSellerListingDetail: SellerListingDetail = {
  id: '4',
  title: 'Calculus - Early Transcendentals',
  price: 4500,
  condition: 'good',
  category: 'textbook',
  courseCode: 'WTW114',
  listedAt: '2026-05-07T09:15:00Z',
  views: 42,
  description: 'Good condition with minor highlighting on pages 3-5.',
  tags: ['WTW114', 'First Year', 'UP'],
  images: [
    'https://placehold.co/540x300/1a3a7a/ffffff?text=Calculus',
    'https://placehold.co/80x70/1a3a7a/ffffff?text=img2',
    'https://placehold.co/80x70/1a3a7a/ffffff?text=img3',
    'https://placehold.co/80x70/1a3a7a/ffffff?text=img4',
  ],
  status: 'live',
  aiScore: 78,
  aiLabel: 'Low Risk',
  isReserved: true,
  timeline: [
    { label: 'Draft created',        time: '2026-05-07T09:15:00Z', done: true },
    { label: 'Submitted for review', time: '2026-05-07T09:22:00Z', done: true },
    { label: 'AI Scoring Complete',  time: '2026-05-07T09:23:00Z', done: true },
    { label: 'Live',                 time: '2026-05-07T09:23:00Z', done: true },
  ],
}

export const listingsService = {
  getById: async (id: string): Promise<ListingDetail> => {
    const res = await fetch(`${BASE_URL}/listings/${id}`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch listing')

    const item = await res.json()

    return {
      ...mockListingDetail,
      id:          item.listingId,
      title:       item.title,
      description: item.description,
      price:       item.price,
      condition:   item.condition,
      status:      item.listingStatus,
      views:       item.viewCount,
      sellerId:    item.sellerId,
      listedAt:    item.createdAt,
      courseCode:  item.courseId?.toString() ?? mockListingDetail.courseCode,
      category:    mapCategory(item.listingType),
      images:      item.images.map((i: any) => ({
        id:        i.imageId.toString(),
        url:       i.path,
        isPrimary: i.isPrimary,
      })),
    }
  },

getMyListings: async (): Promise<MyListingsResponse> => {
  const user = useAuthStore.getState().user

  if (!user) return { listings: mockMyListings, total: mockMyListings.length }

  const res = await fetch(`${BASE_URL}/listings?sellerId=${user.id}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch listings')

  const data = await res.json()

  const listings: ListingSummary[] = data.items.map((item: any) => ({
    id:       item.listingId,
    title:    item.title,
    meta:     `${item.listingType} · Listed ${new Date(item.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    price:    item.price,
    status:   item.listingStatus,
    views:    item.viewCount,
    imageUrl: item.images.find((i: any) => i.isPrimary)?.path
              ?? item.images[0]?.path
              ?? biologyTextbook,
  }))

  return { listings, total: data.total }
},

getSellerListingById: async (id: string): Promise<SellerListingDetail> => {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch listing')

  const item = await res.json()

  return {
    ...mockSellerListingDetail,
    id:          item.listingId,
    title:       item.title,
    price:       item.price,
    condition:   item.condition,
    status:      item.listingStatus,
    views:       item.viewCount,
    listedAt:    item.createdAt,
    description: item.description,
    courseCode:  item.courseId?.toString() ?? mockSellerListingDetail.courseCode,
    category:    mapCategory(item.listingType) as SellerListingDetail['category'],
    images:      item.images.length > 0
                   ? item.images.map((i: any) => i.path)
                   : mockSellerListingDetail.images,
  }
},

  getBrowseListings: async (): Promise<BrowseListingsResponse> => {
    const res = await fetch(`${BASE_URL}/listings`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to fetch listings')

    const data = await res.json()

    const listings: BrowseListing[] = data.items.map((item: any) => ({
      id:        item.listingId,
      title:     item.title,
      price:     item.price,
      module:    item.courseId?.toString() ?? 'General',
      category:  mapBrowseCategory(item.listingType),
      condition: mapCondition(item.condition),
      image:     item.images.find((i: any) => i.isPrimary)?.path
                 ?? item.images[0]?.path
                 ?? biologyTextbook,
    }))

    return { listings, total: data.total }
  },

updateListing: async (id: string, payload: { title: string; description: string; price: number; condition: string }): Promise<void> => {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title:       payload.title,
      description: payload.description,
      price:       payload.price,
      condition:   payload.condition,
    }),
  })
  if (!res.ok) throw new Error('Failed to update listing')
},

}
