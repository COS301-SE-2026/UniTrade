
import { describe, test, expect } from 'vitest'
import { getSimilarListings } from '../../utils/similarListings'
import type { BrowseListing, ListingDetail } from '../../types/listing'

function makeCurrent(overrides: Partial<ListingDetail> = {}): ListingDetail {
  return {
    id: '1',
    title: 'Current Item',
    description: 'desc',
    category: 'book',
    price: 200,
    condition: 'good',
    status: 'live',
    courseCode: 'WTW114',
    courseId: 1076,
    images: [],
    views: 0,
    listedAt: '2026-01-01T00:00:00Z',
    sellerId: 'seller-1',
    metadata: null,
    seller: null,
    ...overrides,
  }
}

function makeCandidate(overrides: Partial<BrowseListing> = {}): BrowseListing {
  return {
    id: '2',
    image: '',
    title: 'Candidate Item',
    module: '',
    courseId: 1076,
    category: 'book',
    price: 200,
    condition: 'Good',
    metadata: null,
    sellerId: 'seller-2',
    ...overrides,
  }
}

describe('getSimilarListings', () => {
  test('excludes the current listing itself even if it appears in candidates', () => {
    const current = makeCurrent({ id: '1' })
    const candidates = [makeCandidate({ id: '1' }), makeCandidate({ id: '2' })]

    const result = getSimilarListings(current, candidates)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  test('excludes candidates from a different category', () => {
    const current = makeCurrent({ category: 'book' })
    const candidates = [
      makeCandidate({ id: '2', category: 'electronics' }),
      makeCandidate({ id: '3', category: 'book' }),
    ]

    const result = getSimilarListings(current, candidates)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  test('category match is case-insensitive', () => {
    const current = makeCurrent({ category: 'Book' })
    const candidates = [makeCandidate({ id: '2', category: 'BOOK' })]

    const result = getSimilarListings(current, candidates)

    expect(result).toHaveLength(1)
  })

  test('book category: same courseId + same condition ranks above same courseId + different condition', () => {
    const current = makeCurrent({ category: 'book', courseId: 1076, condition: 'good', price: 200 })
    const sameCourseSameCondition = makeCandidate({ id: 'a', courseId: 1076, condition: 'Good', price: 200 })
    const sameCourseDiffCondition = makeCandidate({ id: 'b', courseId: 1076, condition: 'Fair', price: 200 })

    const result = getSimilarListings(current, [sameCourseDiffCondition, sameCourseSameCondition], 2)

    expect(result.map(r => r.id)).toEqual(['a', 'b'])
  })

  test('book category: candidates with a different courseId never get the key-match tier', () => {
    const current = makeCurrent({ category: 'book', courseId: 1076, price: 200, condition: 'good' })
    const differentCourse = makeCandidate({ id: 'a', courseId: 1077, price: 200, condition: 'Good' })

    const result = getSimilarListings(current, [differentCourse])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
  })

  test('book category: candidate with null courseId never key-matches', () => {
    const current = makeCurrent({ category: 'book', courseId: 1076 })
    const noCourse = makeCandidate({ id: 'a', courseId: null })

    const result = getSimilarListings(current, [noCourse])

    expect(result).toHaveLength(1)
  })

  test('electronics category: matches on brand, case-insensitive and whitespace-trimmed', () => {
    const current = makeCurrent({
      category: 'electronics',
      metadata: { brand: '  Sony ' },
      price: 500,
      condition: 'good',
    })
    const sameBrand = makeCandidate({
      id: 'a',
      category: 'electronics',
      metadata: { brand: 'sony' },
      price: 500,
      condition: 'Good',
    })
    const diffBrand = makeCandidate({
      id: 'b',
      category: 'electronics',
      metadata: { brand: 'Bose' },
      price: 500,
      condition: 'Good',
    })

    const result = getSimilarListings(current, [diffBrand, sameBrand], 2)

    expect(result[0].id).toBe('a')
  })

  test('electronics category: missing brand on either side never key-matches', () => {
    const current = makeCurrent({ category: 'electronics', metadata: null, price: 500, condition: 'good' })
    const candidate = makeCandidate({ id: 'a', category: 'electronics', metadata: null, price: 500, condition: 'Good' })

    const result = getSimilarListings(current, [candidate])

    expect(result).toHaveLength(1)
  })

  test('furniture category: matches on dimensions, case-insensitive and whitespace-trimmed', () => {
    const current = makeCurrent({
      category: 'furniture',
      metadata: { dimensions: ' 120x60 ' },
      price: 300,
      condition: 'good',
    })
    const sameDims = makeCandidate({
      id: 'a',
      category: 'furniture',
      metadata: { dimensions: '120X60' },
      price: 300,
      condition: 'Good',
    })
    const diffDims = makeCandidate({
      id: 'b',
      category: 'furniture',
      metadata: { dimensions: '90x40' },
      price: 300,
      condition: 'Good',
    })

    const result = getSimilarListings(current, [diffDims, sameDims], 2)

    expect(result[0].id).toBe('a')
  })

  test('unrecognized category never key-matches, falls back to price/condition tiers', () => {
    const current = makeCurrent({ category: 'clothing', price: 100, condition: 'good' })
    const closeInPrice = makeCandidate({ id: 'a', category: 'clothing', price: 120, condition: 'Good' })
    const farInPrice = makeCandidate({ id: 'b', category: 'clothing', price: 900, condition: 'Good' })

    const result = getSimilarListings(current, [farInPrice, closeInPrice], 2)

    expect(result[0].id).toBe('a')
  })

  test('price difference exactly at the 100 threshold still counts as within threshold', () => {
    const current = makeCurrent({ category: 'clothing', price: 200, condition: 'good' })
    const atThreshold = makeCandidate({ id: 'a', category: 'clothing', price: 300, condition: 'Good' })
    const beyondThreshold = makeCandidate({ id: 'b', category: 'clothing', price: 301, condition: 'Good' })

    const result = getSimilarListings(current, [beyondThreshold, atThreshold], 2)

    expect(result[0].id).toBe('a')
  })

  test('within the same tier, the closer price wins', () => {
    const current = makeCurrent({ category: 'clothing', price: 200, condition: 'good' })
    const closer = makeCandidate({ id: 'a', category: 'clothing', price: 210, condition: 'Good' })
    const further = makeCandidate({ id: 'b', category: 'clothing', price: 250, condition: 'Good' })

    const result = getSimilarListings(current, [further, closer], 2)

    expect(result.map(r => r.id)).toEqual(['a', 'b'])
  })

  test('"new" and "like_new" are treated as the same condition', () => {
    const current = makeCurrent({ category: 'clothing', price: 200, condition: 'new' })
    const likeNew = makeCandidate({ id: 'a', category: 'clothing', price: 200, condition: 'like_new' })
    const fair = makeCandidate({ id: 'b', category: 'clothing', price: 200, condition: 'Fair' })

    const result = getSimilarListings(current, [fair, likeNew], 2)

    expect(result[0].id).toBe('a')
  })

  test('respects a custom limit', () => {
    const current = makeCurrent({ category: 'clothing', price: 200, condition: 'good' })
    const candidates = Array.from({ length: 5 }, (_, i) =>
      makeCandidate({ id: `c${i}`, category: 'clothing', price: 200 + i, condition: 'Good' })
    )

    const result = getSimilarListings(current, candidates, 3)

    expect(result).toHaveLength(3)
  })

  test('defaults to a limit of 2 when none is provided', () => {
    const current = makeCurrent({ category: 'clothing', price: 200, condition: 'good' })
    const candidates = Array.from({ length: 5 }, (_, i) =>
      makeCandidate({ id: `c${i}`, category: 'clothing', price: 200 + i, condition: 'Good' })
    )

    const result = getSimilarListings(current, candidates)

    expect(result).toHaveLength(2)
  })

  test('returns an empty array when there are no candidates in the same category', () => {
    const current = makeCurrent({ category: 'book' })
    const candidates = [makeCandidate({ category: 'electronics' })]

    expect(getSimilarListings(current, candidates)).toEqual([])
  })

  test('maps output to the SimilarListing shape with normalized condition', () => {
    const current = makeCurrent({ category: 'book', courseId: 1076, price: 200, condition: 'good' })
    const candidate = makeCandidate({
      id: 'a',
      title: 'Some Book',
      price: 210,
      image: '/img/a.jpg',
      condition: 'like_new',
      courseId: 1076,
    })

    const [result] = getSimilarListings(current, [candidate])

    expect(result).toEqual({
      id: 'a',
      title: 'Some Book',
      price: 210,
      image: '/img/a.jpg',
      condition: 'new',
    })
  })
})