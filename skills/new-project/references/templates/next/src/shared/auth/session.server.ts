import 'server-only'
import type { NextResponse } from 'next/server'
import { z } from 'zod'
import { API } from '@/shared/api/endpoints'
import { fetchUpstream, upstreamUrl } from '@/shared/api/server'
import { serverEnv } from '@/shared/config/env.server'
import { SESSION_COOKIE } from './cookies'

// TODO(api): replace with the backend token response schema (docs/auth.md)
export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshExpiresIn: z.number().int().positive().optional(),
})

export type TokenPair = z.infer<typeof tokenPairSchema>

export type RefreshResult =
  | { kind: 'ok'; tokens: TokenPair }
  | { kind: 'invalid' }
  | { kind: 'unavailable' }

const REFRESH_MAX_AGE_S = 60 * 60 * 24 * 30
const REFRESH_GRACE_MS = 10_000
const INVALID_REFRESH_STATUSES = new Set([400, 401, 403])

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: serverEnv().NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
})

export const writeSession = (response: NextResponse, tokens: TokenPair) => {
  response.cookies.set(SESSION_COOKIE.access, tokens.accessToken, cookieOptions(tokens.expiresIn))
  response.cookies.set(
    SESSION_COOKIE.refresh,
    tokens.refreshToken,
    cookieOptions(tokens.refreshExpiresIn ?? REFRESH_MAX_AGE_S),
  )
}

export const clearSession = (response: NextResponse) => {
  response.cookies.set(SESSION_COOKIE.access, '', cookieOptions(0))
  response.cookies.set(SESSION_COOKIE.refresh, '', cookieOptions(0))
}

const readTokens = async (response: Response): Promise<RefreshResult> => {
  const parsed = tokenPairSchema.safeParse(await response.json().catch(() => null))
  return parsed.success ? { kind: 'ok', tokens: parsed.data } : { kind: 'unavailable' }
}

const requestRefresh = async (refreshToken: string): Promise<RefreshResult> => {
  const response = await fetchUpstream(upstreamUrl(API.auth.refresh), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response) return { kind: 'unavailable' }
  if (response.ok) return readTokens(response)
  return INVALID_REFRESH_STATUSES.has(response.status)
    ? { kind: 'invalid' }
    : { kind: 'unavailable' }
}

const pendingRefreshes = new Map<string, Promise<RefreshResult>>()

export const refreshSession = (refreshToken: string) => {
  const pending = pendingRefreshes.get(refreshToken)
  if (pending) return pending
  const result = requestRefresh(refreshToken).catch((): RefreshResult => ({ kind: 'unavailable' }))
  pendingRefreshes.set(refreshToken, result)
  result.then((outcome) => {
    const ttl = outcome.kind === 'ok' ? REFRESH_GRACE_MS : 0
    setTimeout(() => pendingRefreshes.delete(refreshToken), ttl)
  })
  return result
}
