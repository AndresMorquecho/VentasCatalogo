import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // GC time: Unused data stays in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry failed requests 2 times
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // CRITICAL: Disable all automatic refetches to prevent loops
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true, // Allow first fetch on mount

      // Only fetch if data is stale
      refetchInterval: false,
      refetchIntervalInBackground: false
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
})

export const AppQueryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
