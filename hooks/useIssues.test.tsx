import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHookWithProviders } from '@/test-utils/renderWithProviders'
import { APIError } from '@/lib/api/client'
import { useIssues } from './useIssues'

vi.mock('@/lib/api/issues', () => ({
  issuesAPI: { list: vi.fn() },
}))

import { issuesAPI } from '@/lib/api/issues'

const SERIES_SOURCE = { kind: 'series' as const, id: '11111111-1111-1111-1111-111111111111' }
const ALIAS_GROUP_SOURCE = { kind: 'aliasGroup' as const, id: '22222222-2222-2222-2222-222222222222' }

describe('useIssues', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when source is null', () => {
    renderHookWithProviders(() => useIssues(null))
    expect(issuesAPI.list).not.toHaveBeenCalled()
  })

  it('fetches issues once a series source is provided', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue({
      layoutMode: 'grid',
      hasMultipleVolumes: false,
      volumes: [],
    })

    const { result } = renderHookWithProviders(() => useIssues(SERIES_SOURCE))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(issuesAPI.list).toHaveBeenCalledWith(SERIES_SOURCE)
  })

  it('fetches issues once an aliasGroup source is provided', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue({
      layoutMode: 'grid',
      hasMultipleVolumes: false,
      volumes: [],
    })

    const { result } = renderHookWithProviders(() => useIssues(ALIAS_GROUP_SOURCE))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(issuesAPI.list).toHaveBeenCalledWith(ALIAS_GROUP_SOURCE)
  })

  it('does not retry a 404 (no GCD data is an expected response, not a transient failure)', async () => {
    vi.mocked(issuesAPI.list).mockRejectedValue(new APIError(404, 'NOT_FOUND', 'No issues found'))

    const { result } = renderHookWithProviders(() => useIssues(SERIES_SOURCE))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(issuesAPI.list).toHaveBeenCalledTimes(1)
  })

  it('uses a cache key that distinguishes series and aliasGroup sources with the same id', async () => {
    // Code review finding: the original version of this test asserted
    // `issuesAPI.list` was called twice, but React Query's default
    // `staleTime: 0` means a fresh mount refetches on every subscription
    // regardless of whether the key resolves to an existing cache entry --
    // that assertion would pass identically even if `source.kind` were
    // dropped from the queryKey entirely. Assert against the cache itself
    // instead: two distinct entries must exist, each holding the response
    // for its own source.
    const seriesResponse = { layoutMode: 'grid' as const, hasMultipleVolumes: false, volumes: [], marker: 'series' }
    const aliasResponse = { layoutMode: 'list' as const, hasMultipleVolumes: false, volumes: [], marker: 'aliasGroup' }
    vi.mocked(issuesAPI.list).mockImplementation((source) =>
      Promise.resolve(source.kind === 'series' ? (seriesResponse as any) : (aliasResponse as any))
    )
    const sameId = '33333333-3333-3333-3333-333333333333'

    // Deliberately share ONE QueryClient across both hook instances (unlike
    // renderHookWithProviders, which gives each call its own fresh client)
    // -- a broken key that ignored source.kind would collapse both onto
    // one cache entry on this shared client.
    const sharedClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={sharedClient}>{children}</QueryClientProvider>
    )

    const { result: seriesResult } = renderHook(() => useIssues({ kind: 'series', id: sameId }), { wrapper })
    await waitFor(() => expect(seriesResult.current.isSuccess).toBe(true))

    const { result: aliasResult } = renderHook(() => useIssues({ kind: 'aliasGroup', id: sameId }), { wrapper })
    await waitFor(() => expect(aliasResult.current.isSuccess).toBe(true))

    // Two distinct cache entries, each holding its own source's response --
    // a broken key (ignoring source.kind) would either collapse these into
    // one entry or let the second overwrite the first.
    expect(sharedClient.getQueryData(['issues', 'series', sameId])).toEqual(seriesResponse)
    expect(sharedClient.getQueryData(['issues', 'aliasGroup', sameId])).toEqual(aliasResponse)
    expect(sharedClient.getQueryCache().getAll()).toHaveLength(2)
  })
})
