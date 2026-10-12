import { describe, expect, it } from 'vitest'
import { breadcrumbLd, serializeJsonLd } from './structured-data'

describe('serializeJsonLd', () => {
  it('escapes characters that could close the script element', () => {
    const html = serializeJsonLd({ name: '</script><script>alert(1)</script>&' })
    expect(html).not.toContain('<')
    expect(html).not.toContain('>')
    expect(JSON.parse(html)).toEqual({ name: '</script><script>alert(1)</script>&' })
  })
})

describe('breadcrumbLd', () => {
  it('numbers items from one', () => {
    const data = breadcrumbLd([
      { name: 'Home', url: 'https://example.com/' },
      { name: 'Docs', url: 'https://example.com/docs' },
    ])
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
      { '@type': 'ListItem', position: 2, name: 'Docs', item: 'https://example.com/docs' },
    ])
  })
})
