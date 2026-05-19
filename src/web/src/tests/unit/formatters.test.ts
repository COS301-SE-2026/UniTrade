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

