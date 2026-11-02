import { describe, expect, it } from 'vitest'
import { isSameOriginRequest } from './same-origin'

const request = (headers: Record<string, string>) => ({
  headers: { get: (name: string) => headers[name] ?? null },
})

const host = 'app.example'
const origin = 'https://app.example'

describe('isSameOriginRequest', () => {
  it.each([
    ['same-origin with a matching Origin', { host, 'sec-fetch-site': 'same-origin', origin }],
    ['same-origin without Origin or Referer', { host, 'sec-fetch-site': 'same-origin' }],
    ['no Sec-Fetch-Site with a matching Origin', { host, origin }],
    ['no Sec-Fetch-Site with a matching Referer', { host, referer: `${origin}/app/orders` }],
  ])('accepts %s', (_, headers) => {
    expect(isSameOriginRequest(request(headers))).toBe(true)
  })

  it.each([
    ['same-site with a matching Origin', { host, 'sec-fetch-site': 'same-site', origin }],
    ['cross-site with a matching Origin', { host, 'sec-fetch-site': 'cross-site', origin }],
    ['none with a matching Origin', { host, 'sec-fetch-site': 'none', origin }],
    ['no Sec-Fetch-Site with a foreign Origin', { host, origin: 'https://evil.example' }],
    ['an Origin of null', { host, origin: 'null' }],
    ['an Origin without a host header', { origin }],
    ['no signals at all', { host }],
  ])('rejects %s', (_, headers) => {
    expect(isSameOriginRequest(request(headers))).toBe(false)
  })
})
