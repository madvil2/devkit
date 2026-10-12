import { API } from '@/shared/api/endpoints'
import type { TransportRequest, TransportResponse } from '@/shared/api/types'

export type MockHandler = (
  request: TransportRequest,
) => TransportResponse | Promise<TransportResponse>

export const handlers: Record<string, MockHandler> = {
  [`GET ${API.health}`]: () => ({ status: 200, data: { status: 'ok' } }),
}
