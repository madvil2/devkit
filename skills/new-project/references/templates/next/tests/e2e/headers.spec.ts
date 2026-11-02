import { expect, test } from '@playwright/test'

const DEPLOYED_URL = process.env.E2E_BASE_URL

test.describe('served headers (TST-7)', () => {
  test.skip(!DEPLOYED_URL, 'headers are set by the host: run with E2E_BASE_URL')

  test('the document and static assets carry the security and cache headers', async ({ page }) => {
    const asset = page.waitForResponse((response) =>
      new URL(response.url()).pathname.startsWith('/_next/static/'),
    )
    const document = await page.goto('/')
    if (!document) throw new Error('no response for /')
    const headers = document.headers()
    const csp = headers['content-security-policy'] ?? ''
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'frame-ancestors',
    ]) {
      expect(csp).toContain(directive)
    }
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    if (DEPLOYED_URL?.startsWith('https://')) {
      expect(headers['strict-transport-security']).toContain('max-age=')
    }
    expect(headers['cache-control'] ?? '').not.toContain('immutable')
    expect((await asset).headers()['cache-control'] ?? '').toContain('immutable')
  })
})
