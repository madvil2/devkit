import type { MetadataRoute } from 'next'
import { siteEnv } from '@/shared/config/env.server'
import { privatePathPatterns } from '@/shared/config/routes'

const robots = (): MetadataRoute.Robots => {
  const { SITE_URL } = siteEnv()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', ...privatePathPatterns()] }],
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
    host: new URL(SITE_URL).origin,
  }
}

export default robots
