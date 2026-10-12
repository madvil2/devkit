import { type NextRequest, NextResponse } from 'next/server'
import { hasSessionCookie } from '@/shared/auth/cookies'
import { isPrivatePath, ROUTES } from '@/shared/config/routes'

export const proxy = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl
  if (!isPrivatePath(pathname) || hasSessionCookie(request.cookies)) return NextResponse.next()
  return NextResponse.redirect(new URL(ROUTES.login(`${pathname}${search}`), request.url))
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico|robots.txt|sitemap.xml|og.png).*)'],
}
