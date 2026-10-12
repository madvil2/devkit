import type { NextRequest } from 'next/server'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const isSafeMethod = (method: string) => SAFE_METHODS.has(method)

const urlHost = (value: string) => {
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

export const isSameOriginRequest = (request: NextRequest) => {
  const host = request.headers.get('host')
  const source = request.headers.get('origin') ?? request.headers.get('referer')
  if (source) return host !== null && urlHost(source) === host
  return request.headers.get('sec-fetch-site') === 'same-origin'
}
