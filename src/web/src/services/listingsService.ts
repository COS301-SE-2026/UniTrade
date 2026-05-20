import type { ListingDetail } from '../types/listing'
import type { ListingSummary, MyListingsResponse } from '../types/listing'
import type { SellerListingDetail } from '../types/listing'
import calculasTextbook from '../assets/calculas-textbook.jpg'
import pencil from '../assets/mechanical-pencil.jpg'
import biologyTextbook from '../assets/bio-textbook.jpg'
import labCoat from '../assets/labcoat.jpg'
import hplaptop from '../assets/hp-laptop.jpg'
import laptop from '../assets/laptop.jpg'
import type {
  BrowseListing,
  BrowseListingsResponse,
} from '../types/listing'

const mockMyListings: ListingSummary[] = [
  { id: '1', title: 'Chemistry Textbook - 3rd Ed',      meta: 'CMY127 · Listed 7 May 2026',      price: 250,  status: 'live',     views: 42, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CH' },
  { id: '2', title: 'HP Laptop 15" - Good Condition',   meta: 'Electronics · Listed 5 May 2026',  price: 4500, status: 'live',     views: 25, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=LP' },
  { id: '3', title: 'Geometry Set - Unopened',          meta: 'Stationery · Listed 4 May 2026',   price: 250,  status: 'pending',  views: 68, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=GS' },
  { id: '4', title: 'Calculus - Early Transcendentals', meta: 'WTW114 · Listed 3 May 2026',       price: 350,  status: 'draft',    views: 89, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=CA' },
  { id: '5', title: 'Molecular Biology - 6th Ed',       meta: 'BIO226 · Listed 3 May 2026',       price: 350,  status: 'rejected', views: 89, imageUrl: 'https://placehold.co/48x48/1a3a7a/ffffff?text=MB' },
]

//Mock data matchinf the actual type
const mockListingDetail: ListingDetail = {
  id: '1',
  title: 'Calculus - Early Transcendentals',
  description: 'Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP. Includes the original bookmark and a handwritten summary sheet for chapter 5.',
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
    {
      id: 'r1',
      initials: 'ZS',
      name: 'Zelamene S.',
      stars: 5,
      text: 'Item was exactly as described. Seller was on time and very friendly at the meetup.',
      date: '2026-05-03T00:00:00Z',
    },
    {
      id: 'r2',
      initials: 'SK',
      name: 'Sabira K.',
      stars: 4,
      text: 'Book was in good condition. Would buy from this seller again.',
      date: '2026-04-28T00:00:00Z',
    },
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
  description: 'Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP. Includes the original bookmark and a handwritten summary sheet for chapter 5.',
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

const mockBrowseListings: BrowseListing[] = [
  { id: '1', image: biologyTextbook,   title: 'Cambridge IGCSE Biology', module: 'BIO121',   category: 'Textbooks',     price: 1200, condition: 'Good' },
  { id: '2', image: laptop,            title: 'Macbook Air',             module: 'COS101',   category: 'Electronics',   price: 8000, condition: 'Fair' },
  { id: '3', image: hplaptop,          title: 'HP Laptop',               module: 'BEng 345', category: 'Electronics',   price: 4500, condition: 'Good' },
  { id: '4', image: labCoat,           title: 'Lab Coat',                module: 'CHM101',   category: 'Lab Equipment', price: 350,  condition: 'Fair' },
  { id: '5', image: calculasTextbook,  title: 'Calculus Textbook',       module: 'WTW114',   category: 'Textbooks',     price: 350,  condition: 'Fair' },
  { id: '6', image: pencil,            title: 'Mechanical Pencil',       module: 'All',      category: 'Stationary',    price: 85,   condition: 'Good' },
]
//Service, right now this returns mock data, when the actual API is ready, we have to replace the insodes of each function only

//const BASE_URL = import.meta.env.VITE_API_URL

export const listingsService = {
    getById: async (id: string): Promise<ListingDetail> => {
        // we should replace this when the api is ready
        console.log('getById called with', id)
        return mockListingDetail

        //this has to be uncommented whe  the backend is ready
        //const res = await fetch(`${BASE_URL}/listings/${id}`)
        // if (!res.ok) throw new Error('Failed to fetch listing')
        // return res.json()
    },

     getMyListings: async (): Promise<MyListingsResponse> => {
    // MOCK — replacing this block when API is ready:
    return {
      listings: mockMyListings,
      total: mockMyListings.length,
    }

    // REAL API — should uncomment when backend is ready:
    // const res = await fetch(`${BASE_URL}/listings/my`, {
    //   headers: { Authorization: `Bearer ${token}` }
    // })
    // if (!res.ok) throw new Error('Failed to fetch listings')
    // return res.json()
  },

  getSellerListingById: async (id: string): Promise<SellerListingDetail> => {
  // MOCK — replacing this block when API is ready:
  console.log('getSellerListingById called with', id)
  return mockSellerListingDetail

  //REAL API — should uncomment when backend is ready:
  // const res = await fetch(`${BASE_URL}/listings/${id}/seller`, {
  //   headers: { Authorization: `Bearer ${token}` }
  // })
  // if (!res.ok) throw new Error('Failed to fetch listing')
  // return res.json()
},

getBrowseListings: async (): Promise<BrowseListingsResponse> => {
  //MOCK — replacing this block when API is ready:
  return {
    listings: mockBrowseListings,
    total: mockBrowseListings.length,
  }

  // REAL API — should uncomment when backend is ready:
  // const res = await fetch(`${BASE_URL}/listings`)
  // if (!res.ok) throw new Error('Failed to fetch listings')
  // return res.json()
},

}

