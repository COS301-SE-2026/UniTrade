import type {
    FlaggedListing,
    ListingDecisionRequest,
    ListingDecisionResponse,
} from "../types/listingRisk"

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const Mock : FlaggedListing[] = [
    {
        listingId: "001",
        title: "COS 301 Teztbook",
        price: 450,
        sellerId: "S001",
        sellerInitials: "TM",
        riskScore: 82,
        riskLevel: "high",
        reasons: ["price_anomaly", "duplicate_image"],
        imageMatchScore: 0.31,
        createdAt: hoursAgo(2),

    },
    {
        listingId: "002",
        title: "MacBook Pro",
        price: 2500,
        sellerId: "S002",
        sellerInitials: "SK",
        riskScore: 42,
        riskLevel: "medium",
        reasons: ["duplicate_image"],
        imageMatchScore: null,
        createdAt: hoursAgo(4),

    },
    {
        listingId: "003",
        title: "Adidas Spezialls",
        price: 650,
        sellerId: "S003",
        sellerInitials: "MT",
        riskScore: 13,
        riskLevel: "medium",
        reasons: ["duplicate_image"],
        imageMatchScore: 0.74,
        createdAt: hoursAgo(4),

    },
]