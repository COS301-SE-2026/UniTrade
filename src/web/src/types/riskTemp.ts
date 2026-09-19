export type RiskLevel = 'low' | 'medium' | 'high'
export type SellerListingStatus = 'live' | 'under_review' | 'removed'

export interface ListingStatusResponse 
{
  listingId: string
  status: SellerListingStatus
  riskLevel: RiskLevel
  message: string
}