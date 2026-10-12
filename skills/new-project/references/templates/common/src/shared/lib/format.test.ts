import { describe, expect, it } from 'vitest'
import { formatDate, formatNumber } from './format'

describe('formatNumber', () => {
  it('uses the locale grouping', () => {
    expect(formatNumber(1234.5, 'en')).toBe('1,234.5')
  })
})

describe('formatDate', () => {
  it('formats ISO strings', () => {
    expect(formatDate('2026-01-02T00:00:00Z', 'en', { timeZone: 'UTC', dateStyle: 'short' })).toBe(
      '1/2/26',
    )
  })
})
