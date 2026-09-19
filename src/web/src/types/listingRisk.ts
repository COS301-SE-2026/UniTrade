export type RiskLevel = "low" | "medium" | "high"

export type FlaggedListingStatus = "under_review"
export type ListingDecisionAction  = "approve" | "remove";
export type SellerListingStatus = "live" | "under_review" | "removed";

export type KnownRiskReason = 
| "price_anomaly"
| "duplicate_image"
| "weak_description"
| "seller_history"
| "image_mismatch";

export interface FlaggedListing {
    listingId: string;
    title: string;
    price : number;
    selllerId: string;
    sellerInitials: string;
    riskScore: number;
    riskLevel: RiskLevel;
    reasons: string[];
    imageMatchScore: number  | null;
    createdAt: string;

}

export interface ListingDecisionRequest {
    action: ListingDecisionAction;
    reason? : string;
}

export interface ListingDecisionResponse {
    listingId?: string;
    id?: string;
    status?: string;
    listingStatus?: string;
}