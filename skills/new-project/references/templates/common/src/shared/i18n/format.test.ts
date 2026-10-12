import { describe, expect, it } from 'vitest'
import { format } from './format'

describe('format', () => {
  it('fills every placeholder', () => {
    expect(format('{count} of {total}', { count: 2, total: 5 })).toBe('2 of 5')
  })

  it('keeps unknown placeholders', () => {
    expect(format('Hi {name}', {})).toBe('Hi {name}')
  })
})
