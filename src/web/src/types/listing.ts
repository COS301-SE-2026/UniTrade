export type ListingStatus = 'live' | 'pending' | 'draft' | 'rejected' | 'reserved'
export type ListingCondition = 'new' | 'good' | 'fair' | 'poor'
export type ListingMetadata = Record<string, string> | null

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
  price: number
  image: string
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
  courseId: number
  //university: string
  //tags: string[]
  images: ListingImage[]
  views: number
  listedAt: string
  sellerId: string
  //sellerName: string
  //sellerInitials: string
  //sellerRating: number
  //sellerResponseRate: number
  //sellerTotalListings: number
  //isReserved: boolean
  //aiScore: number | null
  //aiLabel: 'low_risk' | 'medium_risk' | 'high_risk' | null
  //reviews: SellerReview[]
  //similarListings: SimilarListing[]
  metadata: ListingMetadata
  seller: ListingSellerInfo | null
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
  courseId: number | null
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
  metadata: ListingMetadata
}

export type BrowseCondition = 'like_new' | 'Good' | 'Fair' | 'Poor'


export interface BrowseListing {
  id: string
  image: string
  title: string
  module: string
  courseId: number | null
  category: string
  price: number
  condition: BrowseCondition
  metadata: ListingMetadata
  sellerId: string
}

export interface BrowseListingsResponse {
  listings: BrowseListing[]
  total: number
}


export interface Category {
  id: number;
  name: string;
}

export interface Course {
  courseId: number;
  courseCode: string;
  courseName: string;
  faculty: string;
}

export interface ListingSellerInfo {
  sellerId: string
  firstName: string
  lastName: string
  fullName: string
  university: string | null
  activeListingCount: number
}

export interface WishlistListing extends BrowseListing {
  status : ListingStatus
  addedAt: string
  sellerName: string | null
}

export interface WishlistResponse {
  listings: WishlistListing[]
  total: number
}

export type MeetupStatus = 'pending' | 'accepted' | 'declined'

export interface ProposeMeetupPayload {
  locationName: string
  lat: number 
  lng : number 
  proposedTime : string 
}

export interface MeetupStatusResponse {
  proposalMessageId: number 
  locationName: string
  lat : number 
  lng : number 
  proposedTime : string 
  status : MeetupStatus
  checkedInAt?: string | null
}

export type ReviewType = 'buyer_to_seller' | 'seller_to_buyer'

export interface Review {
  reviewId: number
  transactionId: string
  reviewerId: string
  revieweeId: string
  reviewType: string
  rating: number
  comment : string | null
  createdAt: string


}

export interface UserReviewsResponse {
  userId: string
  sellerScore: number 
  buyerScore: number
  reviews: Review[]
}

export interface SubmitReviewPayload {
  transactionId: string
  rating: number
  comment?: string 
}