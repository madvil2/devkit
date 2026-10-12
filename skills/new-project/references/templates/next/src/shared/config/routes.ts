import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/shared/i18n'

export const ROUTES = {
  home: () => '/',
  login: (next?: string) =>
    next ? `/login?${new URLSearchParams({ next }).toString()}` : '/login',
} as const

export const PUBLIC_PATHS: readonly string[] = [ROUTES.home()]

export const PRIVATE_PREFIXES: readonly string[] = ['/app']

export const localizedPath = (path: string, locale: Locale) => {
  if (locale === DEFAULT_LOCALE) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

const stripLocale = (pathname: string) => {
  const locale = LOCALES.find(
    (code) =>
      code !== DEFAULT_LOCALE && (pathname === `/${code}` || pathname.startsWith(`/${code}/`)),
  )
  if (!locale) return pathname
  return pathname.slice(locale.length + 1) || '/'
}

export const isPrivatePath = (pathname: string) => {
  const path = stripLocale(pathname)
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export const privatePathPatterns = () =>
  LOCALES.flatMap((locale) =>
    PRIVATE_PREFIXES.flatMap((prefix) => {
      const path = localizedPath(prefix, locale)
      return [`${path}$`, `${path}/`]
    }),
  )
