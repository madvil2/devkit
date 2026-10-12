import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api'

const STALE_TIME_MS = 30_000
const MAX_RETRIES = 2

const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < MAX_RETRIES && !(error instanceof ApiError && error.status < 500)

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
