import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('joins truthy class names', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('returns an empty string for no classes', () => {
    expect(cx()).toBe('')
  })
})
