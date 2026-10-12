import type { MetadataRoute } from 'next'
import { siteEnv } from '@/shared/config/env.server'
import { localizedPath, PUBLIC_PATHS } from '@/shared/config/routes'
import { DEFAULT_LOCALE, LOCALES } from '@/shared/i18n'

const absolute = (path: string) => new URL(path, siteEnv().SITE_URL).toString()

const sitemap = (): MetadataRoute.Sitemap =>
  PUBLIC_PATHS.map((path) => ({
    url: absolute(localizedPath(path, DEFAULT_LOCALE)),
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, absolute(localizedPath(path, locale))]),
      ),
    },
  }))

export default sitemap
