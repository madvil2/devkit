import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next-path'

describe('safeNextPath', () => {
  it('keeps a same-origin relative path with query and hash', () => {
    expect(safeNextPath('/app/orders?page=2#top')).toBe('/app/orders?page=2#top')
  })

  it.each([
    null,
    undefined,
    '',
    'app',
    'https://evil.example/',
    '//evil.example/',
    '/\\evil.example/',
    '/\t/evil.example/',
    '/.//evil.example/',
    'javascript:alert(1)',
  ])('falls back for %s', (value) => {
    expect(safeNextPath(value, '/home')).toBe('/home')
  })
})
