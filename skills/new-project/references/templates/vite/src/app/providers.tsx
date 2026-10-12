import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import type { createAppRouter } from './router'

type ProvidersProps = {
  queryClient: QueryClient
  router: ReturnType<typeof createAppRouter>
}

export const Providers = ({ queryClient, router }: ProvidersProps) => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
)
