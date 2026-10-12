import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { API } from '@/shared/api/endpoints'
import { fetchUpstream, upstreamUrl } from '@/shared/api/server'
import { SESSION_COOKIE } from './cookies'
import { isSameOriginRequest } from './same-origin'
import { clearSession, tokenPairSchema, writeSession } from './session.server'

const forbidden = () => NextResponse.json({ code: 'forbidden_origin' }, { status: 403 })

const unavailable = () => NextResponse.json({ code: 'upstream_unavailable' }, { status: 502 })

const passThroughError = async (upstream: Response) =>
  NextResponse.json(await upstream.json().catch(() => ({ code: 'upstream_error' })), {
    status: upstream.status,
  })

export const signIn = async (request: NextRequest) => {
  if (!isSameOriginRequest(request)) return forbidden()
  const upstream = await fetchUpstream(upstreamUrl(API.auth.login), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: await request.text(),
  })
  if (!upstream) return unavailable()
  if (!upstream.ok) return passThroughError(upstream)
  const parsed = tokenPairSchema.safeParse(await upstream.json().catch(() => null))
  if (!parsed.success) return unavailable()
  const response = new NextResponse(null, { status: 204 })
  writeSession(response, parsed.data)
  return response
}

export const signOut = async (request: NextRequest) => {
  if (!isSameOriginRequest(request)) return forbidden()
  const accessToken = request.cookies.get(SESSION_COOKIE.access)?.value
  const refreshToken = request.cookies.get(SESSION_COOKIE.refresh)?.value
  if (accessToken || refreshToken) {
    await fetchUpstream(upstreamUrl(API.auth.logout), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    })
  }
  const response = new NextResponse(null, { status: 204 })
  clearSession(response)
  return response
}
