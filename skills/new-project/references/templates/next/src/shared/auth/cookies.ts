export const SESSION_COOKIE = {
  access: 'session_at',
  refresh: 'session_rt',
} as const

type CookieReader = {
  has: (name: string) => boolean
}

export const hasSessionCookie = (cookies: CookieReader) =>
  cookies.has(SESSION_COOKIE.access) || cookies.has(SESSION_COOKIE.refresh)
