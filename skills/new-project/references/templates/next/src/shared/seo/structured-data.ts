type JsonLdNode = Record<string, unknown>

export type JsonLdData = JsonLdNode | JsonLdNode[]

const SCHEMA_CONTEXT = 'https://schema.org'

export const serializeJsonLd = (data: JsonLdData) =>
  JSON.stringify(data)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll(' ', '\\u2028')
    .replaceAll(' ', '\\u2029')

export const organizationLd = (input: {
  name: string
  url: string
  logo: string
  sameAs?: string[]
}): JsonLdNode => ({ '@context': SCHEMA_CONTEXT, '@type': 'Organization', ...input })

export const websiteLd = (input: {
  name: string
  url: string
  inLanguage: string
}): JsonLdNode => ({
  '@context': SCHEMA_CONTEXT,
  '@type': 'WebSite',
  ...input,
})

export const breadcrumbLd = (items: Array<{ name: string; url: string }>): JsonLdNode => ({
  '@context': SCHEMA_CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

export const faqLd = (items: Array<{ question: string; answer: string }>): JsonLdNode => ({
  '@context': SCHEMA_CONTEXT,
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
})

export const softwareApplicationLd = (input: {
  name: string
  url: string
  applicationCategory: string
  operatingSystem: string
  offers?: { price: string; priceCurrency: string }
}): JsonLdNode => ({
  '@context': SCHEMA_CONTEXT,
  '@type': 'SoftwareApplication',
  ...input,
  ...(input.offers ? { offers: { '@type': 'Offer', ...input.offers } } : {}),
})

export const productLd = (input: {
  name: string
  description: string
  image: string
  url: string
  offers?: { price: string; priceCurrency: string; availability?: string }
}): JsonLdNode => ({
  '@context': SCHEMA_CONTEXT,
  '@type': 'Product',
  ...input,
  ...(input.offers ? { offers: { '@type': 'Offer', ...input.offers } } : {}),
})
