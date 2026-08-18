import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
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

// Code review finding: calling createTestQueryClient() directly in the
// render body meant a re-render of Wrapper (not currently triggered inside
// this repo's own tests, but a real risk under RTL's rerender() or any
// future test that re-renders the wrapper) would construct a brand new
// QueryClient and silently discard the previous one's cache mid-test.
// useState(createTestQueryClient) constructs exactly one client per mount,
// same lazy-initializer pattern as the rest of this codebase already uses.
function Wrapper({ children }: { children: ReactNode }) {
  const [client] = useState(createTestQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Wrapper, ...options })
}

export function renderHookWithProviders<TResult, TProps>(
  callback: (props: TProps) => TResult
) {
  return renderHook(callback, { wrapper: Wrapper })
}
