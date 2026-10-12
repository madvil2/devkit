import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/shared/auth/cookies'
import { isSafeMethod, isSameOriginRequest } from '@/shared/auth/same-origin'
import { clearSession, refreshSession, writeSession } from '@/shared/auth/session.server'
import { fetchUpstream, upstreamUrl } from './server'

// TODO(api): replace with the backend path prefixes the browser may reach (docs/api.md)
const FORWARDED_PREFIXES: ReadonlySet<string> = new Set(['v1'])

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'if-match',
  'if-none-match',
  'if-modified-since',
  'x-request-id',
] as const

const FORWARDED_RESPONSE_HEADERS = [
  'cache-control',
  'content-disposition',
  'content-language',
  'content-type',
  'etag',
  'last-modified',
  'retry-after',
  'x-request-id',
] as const

type UpstreamCall = {
  request: NextRequest
  target: string
  body: ArrayBuffer | undefined
}

const isSafeSegment = (segment: string) =>
  segment !== '' &&
  segment !== '.' &&
  segment !== '..' &&
  !segment.includes('/') &&
  !segment.includes('\\')

const requestHeaders = (request: NextRequest, accessToken: string | undefined) => {
  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`)
  return headers
}

const callUpstream = ({ request, target, body }: UpstreamCall, accessToken: string | undefined) =>
  fetchUpstream(target, {
    method: request.method,
    headers: requestHeaders(request, accessToken),
    body,
  })

const toResponse = (upstream: Response | null) => {
  if (!upstream) return NextResponse.json({ code: 'upstream_unavailable' }, { status: 502 })
  const headers = new Headers()
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers })
}

const withRefresh = async (call: UpstreamCall, refreshToken: string) => {
  const refreshed = await refreshSession(refreshToken)
  if (refreshed.kind === 'invalid') {
    const response = toResponse(await callUpstream(call, undefined))
    clearSession(response)
    return response
  }
  if (refreshed.kind === 'unavailable') return null
  const response = toResponse(await callUpstream(call, refreshed.tokens.accessToken))
  writeSession(response, refreshed.tokens)
  return response
}

export const proxyToUpstream = async (request: NextRequest, segments: string[]) => {
  const [prefix] = segments
  if (!prefix || !FORWARDED_PREFIXES.has(prefix)) {
    return NextResponse.json({ code: 'not_found' }, { status: 404 })
  }
  if (!segments.every(isSafeSegment)) {
    return NextResponse.json({ code: 'bad_path' }, { status: 400 })
  }
  if (!isSafeMethod(request.method) && !isSameOriginRequest(request)) {
    return NextResponse.json({ code: 'forbidden_origin' }, { status: 403 })
  }
  const call: UpstreamCall = {
    request,
    target: upstreamUrl(segments.map(encodeURIComponent).join('/'), request.nextUrl.search),
    body: isSafeMethod(request.method) ? undefined : await request.arrayBuffer(),
  }
  const accessToken = request.cookies.get(SESSION_COOKIE.access)?.value
  const refreshToken = request.cookies.get(SESSION_COOKIE.refresh)?.value
  if (!accessToken && refreshToken) {
    const refreshed = await withRefresh(call, refreshToken)
    if (refreshed) return refreshed
  }
  const upstream = await callUpstream(call, accessToken)
  if (upstream?.status !== 401 || !accessToken || !refreshToken) return toResponse(upstream)
  await upstream.arrayBuffer().catch(() => null)
  return (
    (await withRefresh(call, refreshToken)) ??
    NextResponse.json({ code: 'unauthorized' }, { status: 401 })
  )
}
