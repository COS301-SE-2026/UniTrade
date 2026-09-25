export type RiskLevel = 'low' | 'medium' | 'high'
export type SellerListingStatus = 'live' | 'under_review' | 'removed'
import type { SellerListingDetail } from "./listing"

export interface ListingReason {
  code: string
  detail?: string | null
  imageId?: number | null
}

export interface ListingStatusResponse 
{
  listingId: string
  status: SellerListingStatus
  riskLevel: RiskLevel
  message: string
  visibilityScore?: number | null
  resubmissionCount?: number
  maxResubmissions?: number
  reasons?: ListingReason[]
  canRescore?: boolean
}

export function mockStatusFromListing(
  listing: SellerListingDetail,
): ListingStatusResponse {
  const status: SellerListingStatus =
    listing.status === "live" ? "removed"
    : listing.status === "pending" ? "under_review"
    : "live";

  const riskLevel: RiskLevel =
    listing.aiLabel === "High Risk" ? "high"
    : listing.aiLabel === "Medium Risk" ? "medium"
    : "low";

  const message =
    status === "under_review" ? "Your listing is being reviewed by an admin."
    : status === "removed" ? "Your listing was removed."
    : "Your listing is live.";

  return { listingId: listing.id, status, riskLevel, message };
}