import { getEnv, MOCK_API } from '@/shared/config'
import { NetworkError } from './errors'
import type { QueryValue, Transport, TransportRequest } from './types'

const buildUrl = (base: string, path: string, query: Record<string, QueryValue> = {}): string => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) search.append(key, String(value))
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : ''
  const root = base.endsWith('/') ? base.slice(0, -1) : base
  return `${root}${path}${suffix}`
}

const readBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null
  const type = response.headers.get('content-type') ?? ''
  return type.includes('json') ? response.json() : response.text()
}

export const fetchTransport: Transport = async (request: TransportRequest) => {
  const url = buildUrl(getEnv().API_URL, request.path, request.query)
  const hasBody = request.body !== undefined
  let response: Response
  try {
    response = await fetch(url, {
      method: request.method,
      credentials: 'include',
      headers: {
        accept: 'application/json',
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
        ...request.headers,
      },
      body: hasBody ? JSON.stringify(request.body) : undefined,
      signal: request.signal,
    })
  } catch (error) {
    if (request.signal?.aborted) throw error
    throw new NetworkError(error)
  }
  return { status: response.status, data: await readBody(response) }
}

let selected: Promise<Transport> | null = null

const selectTransport = async (): Promise<Transport> => {
  if (MOCK_API && getEnv().API_MODE === 'mock') {
    const { mockTransport } = await import('@/mocks')
    return mockTransport
  }
  return fetchTransport
}

export const getTransport = (): Promise<Transport> => {
  selected ??= selectTransport()
  return selected
}
