import { describe, expect, it } from 'vitest'
import { plural } from './plural'

describe('plural', () => {
  it('picks the English forms', () => {
    const forms = { one: 'item', other: 'items' }
    expect(plural(1, forms, 'en')).toBe('item')
    expect(plural(3, forms, 'en')).toBe('items')
  })

  it('falls back to other', () => {
    expect(plural(2, { other: 'x' }, 'ru')).toBe('x')
  })
})
