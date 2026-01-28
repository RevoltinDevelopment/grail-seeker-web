'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SECURITY: Keep staleTime short for user-specific data
            // Combined with cache clearing on logout, this minimizes
            // the window for cross-user data exposure
            staleTime: 10 * 1000, // 10 seconds (reduced from 60s)
            refetchOnWindowFocus: true, // Re-fetch when user returns to tab
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
