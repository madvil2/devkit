import type { Transport } from '@/shared/api/types'
import { handlers } from './handlers'

export const MOCK_TRANSPORT_ID = 'mock-transport:{{name}}'

const LATENCY_MS = 250

const wait = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })

export const mockTransport: Transport = async (request) => {
  await wait(LATENCY_MS, request.signal)
  const handler = handlers[`${request.method} ${request.path}`]
  if (!handler) {
    return { status: 501, data: { code: 'not_mocked', source: MOCK_TRANSPORT_ID } }
  }
  return handler(request)
}
