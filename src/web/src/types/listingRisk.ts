export type RiskLevel = "low" | "medium" | "high"

export type FlageedListingStatus = "under_review"

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