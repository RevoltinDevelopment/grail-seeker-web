import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useReportSeen } from './useUnseenAlerts'

// Story 1.82 (Decision #103): how a page reports the alerts it showed.
const api = vi.hoisted(() => ({ markSeen: vi.fn(), getUnseenCount: vi.fn() }))
vi.mock('@/lib/api/alerts', () => ({ alertsAPI: api }))

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
let client: QueryClient
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>

beforeEach(() => {
  client = new QueryClient()
  api.markSeen.mockReset()
  api.markSeen.mockResolvedValue({ marked: 1 })
})

describe('useReportSeen', () => {
  it('reports what was shown, once, and refreshes the count when something was marked', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [id(2), id(1)] } })
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(1))
    expect(api.markSeen).toHaveBeenCalledWith([id(1), id(2)])
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['alerts', 'unseen-count'] }))
    rerender({ ids: [id(1), id(2)] })
    expect(api.markSeen).toHaveBeenCalledTimes(1)
  })

  it('a growing list reports only the new ids; nothing shown reports nothing', async () => {
    const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [] as string[] } })
    expect(api.markSeen).not.toHaveBeenCalled()
    rerender({ ids: [id(1)] })
    rerender({ ids: [id(1), id(2), id(3)] })
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(2))
    expect(api.markSeen).toHaveBeenLastCalledWith([id(2), id(3)])
  })

  it('sends more than 200 in batches the server accepts', async () => {
    renderHook(() => useReportSeen(Array.from({ length: 450 }, (_, i) => id(i))), { wrapper })
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(3))
    expect(api.markSeen.mock.calls.map((c) => c[0].length)).toEqual([200, 200, 50])
  })

  it('a page in a background tab reports nothing until it is visible again', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    renderHook(() => useReportSeen([id(1)]), { wrapper })
    await new Promise((r) => setTimeout(r, 0))
    expect(api.markSeen).not.toHaveBeenCalled()
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledWith([id(1)]))
    visibility.mockRestore()
  })

  it('a failed report is tried again when the page is next visible, with the same alerts on screen', async () => {
    api.markSeen.mockRejectedValueOnce(new Error('offline'))
    renderHook(() => useReportSeen([id(1)]), { wrapper })
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 0))
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(2))
    expect(api.markSeen).toHaveBeenLastCalledWith([id(1)])
  })

  it('a failed report changes nothing on the page and is tried again on the next change', async () => {
    api.markSeen.mockRejectedValueOnce(new Error('offline'))
    const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [id(1)] } })
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 0))
    rerender({ ids: [id(1), id(2)] })
    await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(2))
    expect(api.markSeen).toHaveBeenLastCalledWith([id(1), id(2)])
  })
})
