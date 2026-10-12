'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useProviders } from './use-providers'

type ProvidersProps = {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  const { queryClient } = useProviders()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
