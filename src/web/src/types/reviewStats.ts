import type { Review, ReviewType, UserReviewsResponse } from "./listing";

export function computeAverageRating(reviews: Review[]): number{
    if(reviews.length === 0) return 0
    return Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)* 10) /10
}

export function computeReputationScore(reviews: Review[]): number {
    if(reviews.length === 0) return 0
    const average = computeAverageRating(reviews)

    return Math.round(Math.min(100, (average/5) * 80 + Math.min(20, reviews.length *2)))
}

export function reviewerRoleLabel(reviewType: ReviewType) : 'Buyer' | 'Seller' {
    return reviewType === 'buyer_to_seller' ? 'Buyer' : 'Seller'
}


export function ratingAsSeller(data: UserReviewsResponse) : number {
    return data.buyerScore
}

export function ratingAsBuyer(data: UserReviewsResponse): number {
    return data.sellerScore
}