import type { z } from 'zod'
import { ApiError, SchemaError } from './errors'
import { getTransport } from './transport'
import type { HttpMethod, QueryValue } from './types'

export type RequestOptions<Schema extends z.ZodType> = {
  method?: HttpMethod
  query?: Record<string, QueryValue>
  body?: unknown
  schema: Schema
  signal?: AbortSignal
  headers?: Record<string, string>
}

const errorCode = (data: unknown): string =>
  typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
    ? data.code
    : 'http_error'

const errorDetails = (data: unknown): Record<string, unknown> =>
  typeof data === 'object' && data !== null ? { ...data } : {}

export const request = async <Schema extends z.ZodType>(
  path: string,
  { method = 'GET', query, body, schema, signal, headers }: RequestOptions<Schema>,
): Promise<z.infer<Schema>> => {
  const transport = await getTransport()
  const response = await transport({ method, path, query, body, signal, headers })
  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(response.status, errorCode(response.data), errorDetails(response.data))
  }
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw new SchemaError(path, parsed.error)
  return parsed.data
}
