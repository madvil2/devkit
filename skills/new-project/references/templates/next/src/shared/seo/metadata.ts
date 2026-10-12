import type { Metadata, Viewport } from 'next'
import { siteEnv } from '@/shared/config/env.server'
import { localizedPath } from '@/shared/config/routes'
import { SITE_NAME } from '@/shared/config/site'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/shared/i18n'

export const OG_IMAGE = {
  path: '/og.png',
  width: 1200,
  height: 630,
} as const

export type BuildMetadataInput = {
  title: string
  description: string
  path: string
  locale?: Locale
  image?: string
  noindex?: boolean
}

const languageAlternates = (path: string) => ({
  ...Object.fromEntries(LOCALES.map((locale) => [locale, localizedPath(path, locale)])),
  'x-default': localizedPath(path, DEFAULT_LOCALE),
})

export const rootMetadata = (): Metadata => ({
  metadataBase: new URL(siteEnv().SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  formatDetection: { telephone: false, email: false, address: false },
})

export const rootViewport = (): Viewport => ({
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
})

export const buildMetadata = ({
  title,
  description,
  path,
  locale = DEFAULT_LOCALE,
  image = OG_IMAGE.path,
  noindex = false,
}: BuildMetadataInput): Metadata => {
  const canonical = localizedPath(path, locale)
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates(path) },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale,
      images: [{ url: image, width: OG_IMAGE.width, height: OG_IMAGE.height }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  }
}
