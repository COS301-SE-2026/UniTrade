export type ListingStatus = 'live' | 'pending' | 'draft' | 'rejected'
export type ListingCondition = 'like_new' | 'good' | 'fair' | 'worn'


export interface ListingImage {
  id: string
  url: string
  isPrimary: boolean
}

export interface SellerReview {
  id: string
  initials: string
  name: string
  stars: number
  text: string
  date: string
}

export interface SimilarListing {
  id: string
  title: string
  meta: string
  condition: ListingCondition
}

export interface ListingDetail {
  id: string
  title: string
  description: string
  price: number
  condition: ListingCondition
  category: string
  status: ListingStatus
  courseCode: string
  university: string
  tags: string[]
  images: ListingImage[]
  views: number
  listedAt: string
  sellerId: string
  sellerName: string
  sellerInitials: string
  sellerRating: number
  sellerResponseRate: number
  sellerTotalListings: number
  isReserved: boolean
  aiScore: number | null
  aiLabel: 'low_risk' | 'medium_risk' | 'high_risk' | null
  reviews: SellerReview[]
  similarListings: SimilarListing[]
}

export interface ListingSummary {
  id: string
  title: string
  meta: string
  price: number
  status: ListingStatus
  views: number
  imageUrl: string
}

export interface MyListingsResponse {
  listings: ListingSummary[]
  total: number
}

export interface TimelineStep {
  label: string
  time: string
  done: boolean
}

export interface SellerListingDetail {
  id: string
  title: string
  price: number
  condition: ListingCondition
  category: string
  courseCode: string
  listedAt: string
  views: number
  description: string
  tags: string[]
  images: string[]
  status: ListingStatus
  aiScore: number | null
  aiLabel: 'Low Risk' | 'Medium Risk' | 'High Risk' | null
  isReserved: boolean
  timeline: TimelineStep[]
}

export type BrowseCondition = 'Good' | 'Fair' | 'Poor'


export interface BrowseListing {
  id: string
  image: string
  title: string
  module: string
  category: string
  price: number
  condition: BrowseCondition
}

export interface BrowseListingsResponse {
  listings: BrowseListing[]
  total: number
}


export interface Category {
  id: number;
  name: string;
}