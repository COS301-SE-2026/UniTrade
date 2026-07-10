import type {
    BrowseListing,
    ListingDetail,
    ListingCondition,
    BrowseCondition,
    SimilarListing,
} from '../types/listing'

const PRICE_THRESHOLD = 100

function normalizeCondition(condition: ListingCondition | BrowseCondition): ListingCondition {
    const c = condition.toLowerCase()
    return c === 'like_new' ? 'new' : (c as ListingCondition)
}

function hasKeyAttributeMatch(current: ListingDetail, candidate: BrowseListing): boolean {
    switch (current.category.toLowerCase()) {
        case 'book':
            return current.courseId != null && candidate.courseId != null && current.courseId === candidate.courseId

        case 'electronics': {
            const a = current.metadata?.brand.trim().toLowerCase()
            const b = candidate.metadata?.brand?.trim().toLowerCase()
            return !!a && !!b && a === b
        }
        case 'furniture': {
            const a = current.metadata?.dimensions?.trim().toLowerCase()
            const b = candidate.metadata?.dimensions?.trim().toLowerCase()
            return !!a && !!b && a === b
        }

        default:
            return false
    }
}

function scoreCandidate(current: ListingDetail, candidate: BrowseListing): number {
    const sameCondition = normalizeCondition(current.condition) === normalizeCondition(candidate.condition)
    const keyMatch = hasKeyAttributeMatch(current, candidate)
    const priceDiff = Math.abs(current.price - candidate.price)
    const withinThreshold = priceDiff <= PRICE_THRESHOLD
    
    let tier: number 
    if (keyMatch && sameCondition) tier = 5
    else if (keyMatch) tier = 4
    else if (withinThreshold && sameCondition) tier = 3
    else if (withinThreshold) tier =2
    else tier =1

    return tier * 10_000 - priceDiff
}

export function getSimilarListings(
  current: ListingDetail,
  candidates: BrowseListing[],
  limit = 2,
): SimilarListing[] {
  return candidates
    .filter(c => c.id !== current.id && c.category.toLowerCase() === current.category.toLowerCase())
    .map(c => ({ candidate: c, score: scoreCandidate(current, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => ({
      id: candidate.id,
      title: candidate.title,
      price: candidate.price,
      image: candidate.image,
      condition: normalizeCondition(candidate.condition),
    }))
}
