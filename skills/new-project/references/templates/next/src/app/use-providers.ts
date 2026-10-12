import { QueryClient } from '@tanstack/react-query'
import { useLayoutEffect, useState } from 'react'
import { initTheme } from '@/shared/lib/theme'

const QUERY_STALE_TIME_MS = 30_000
const QUERY_RETRY_COUNT = 1

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: QUERY_RETRY_COUNT,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  })

export const useProviders = () => {
  const [queryClient] = useState(createQueryClient)
  useLayoutEffect(() => {
    initTheme()
  }, [])
  return { queryClient }
}
