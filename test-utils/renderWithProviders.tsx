import type { ReactElement, ReactNode } from 'react'
import { render, renderHook, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Story 1.16: shared test wrapper for anything using React Query
// (useIssues, and every component that calls it downstream). A fresh
// QueryClient per call keeps tests isolated -- no shared cache leaking
// state between them. `retry: false` on the client's defaults avoids
// tests hanging on React Query's own retry/backoff for an intentionally
// mocked failure.
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Wrapper, ...options })
}

export function renderHookWithProviders<TResult, TProps>(
  callback: (props: TProps) => TResult
) {
  return renderHook(callback, { wrapper: Wrapper })
}
