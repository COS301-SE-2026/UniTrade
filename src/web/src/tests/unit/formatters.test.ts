import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, formatCondition } from '../../utils/formatters'

describe('formatPrice', () => {
    it('formats a number as a Rand amount', () => {
        expect(formatPrice(280)).toBe('R280')
    })
})