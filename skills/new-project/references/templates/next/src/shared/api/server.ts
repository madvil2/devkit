import 'server-only'
import { cookies } from 'next/headers'
import type { z } from 'zod'
import { SESSION_COOKIE } from '@/shared/auth/cookies'
import { serverEnv } from '@/shared/config/env.server'
import { ApiError, SchemaError } from './errors'
import type { QueryValue } from './types'

export type ServerRequestOptions<Schema extends z.ZodType> = {
  schema: Schema
  query?: Record<string, QueryValue>
  auth?: boolean
  revalidate?: number | false
}

const trimTrailingSlash = (value: string) => (value.endsWith('/') ? value.slice(0, -1) : value)

const trimLeadingSlash = (value: string) => (value.startsWith('/') ? value.slice(1) : value)

export const upstreamUrl = (path: string, search = '') =>
  `${trimTrailingSlash(serverEnv().API_UPSTREAM_URL)}/${trimLeadingSlash(path)}${search}`

export const fetchUpstream = async (url: string, init: RequestInit) => {
  try {
    return await fetch(url, {
      ...(init.next ? {} : { cache: 'no-store' as const }),
      ...init,
      redirect: 'manual',
    })
  } catch {
    return null
  }
}

const searchOf = (query: Record<string, QueryValue> = {}) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value))
  }
  return params.size > 0 ? `?${params.toString()}` : ''
}

const errorCode = (data: unknown) =>
  typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
    ? data.code
    : 'http_error'

const authHeader = async (): Promise<Record<string, string>> => {
  const token = (await cookies()).get(SESSION_COOKIE.access)?.value
  return token ? { authorization: `Bearer ${token}` } : {}
}

export const serverRequest = async <Schema extends z.ZodType>(
  path: string,
  { schema, query, auth = false, revalidate = false }: ServerRequestOptions<Schema>,
): Promise<z.infer<Schema>> => {
  const response = await fetchUpstream(upstreamUrl(path, searchOf(query)), {
    headers: { accept: 'application/json', ...(auth ? await authHeader() : {}) },
    ...(auth || revalidate === false ? {} : { next: { revalidate } }),
  })
  if (!response) throw new ApiError(503, 'upstream_unavailable', {})
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, errorCode(data), {})
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new SchemaError(path, parsed.error)
  return parsed.data
}
