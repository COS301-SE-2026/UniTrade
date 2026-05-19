import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, formatCondition } from '../../utils/formatters'

describe('formatPrice', () => {
    it('formats a number as a Rand amount', () => {
        expect(formatPrice(280)).toBe('R280')
    })

    it('formats large numbers with thousand separators', () => {
        expect(formatPrice(4500)).toBe('R 4500')
    })
    it('formats zero correctly', () => {
        expect(formatPrice(0)).toBe('R0')
    })
})

describe('formatDate', () => {
    it('formats an ISO string to be a readable date', () => {
        expect(formatDate('2026-05-07T09:14:00Z')).toBe('7 May 2026')
    })
})

