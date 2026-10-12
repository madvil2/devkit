export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryValue = string | number | boolean | null | undefined

export type TransportRequest = {
  method: HttpMethod
  path: string
  query?: Record<string, QueryValue>
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export type TransportResponse = {
  status: number
  data: unknown
}

export type Transport = (request: TransportRequest) => Promise<TransportResponse>
