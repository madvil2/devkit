import type { Dict } from '@/shared/i18n'

export type ErrorKey = keyof Dict['errors']

export type ApiErrorDetails = {
  fields?: Record<string, string>
  [key: string]: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetails

  constructor(status: number, code: string, details: ApiErrorDetails = {}) {
    super(`API error ${status} ${code}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('Network error', { cause })
    this.name = 'NetworkError'
  }
}

export class SchemaError extends Error {
  constructor(path: string, cause?: unknown) {
    super(`Unexpected response shape for ${path}`, { cause })
    this.name = 'SchemaError'
  }
}

const STATUS_KEYS: Record<number, ErrorKey> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'notFound',
  422: 'validation',
}

export const errorKey = (error: unknown): ErrorKey => {
  if (error instanceof NetworkError) return 'network'
  if (error instanceof ApiError) return STATUS_KEYS[error.status] ?? 'generic'
  return 'generic'
}

export const fieldErrors = (error: unknown): Record<string, string> =>
  error instanceof ApiError && error.details.fields ? error.details.fields : {}
