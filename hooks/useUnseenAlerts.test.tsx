import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PRESENCE_WINDOW_MS, useReportSeen } from './useUnseenAlerts'

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
// A failed assertion must not leave a frozen clock or a hidden page for the next test (review)
afterEach(() => vi.restoreAllMocks())

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

  // Story 1.97 (Decision #103, amended 2026-11-17): seen only once the person is there
  describe('an alert arriving while the page sits open', () => {
    const later = () => vi.spyOn(Date, 'now').mockReturnValue(Date.now() + PRESENCE_WINDOW_MS + 1)
    const settle = () => new Promise((r) => setTimeout(r, 0))

    it('is held, still new, until the person interacts; then every id on screen is reported once', async () => {
      const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [id(1)] } })
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledWith([id(1)]))
      const now = later()
      rerender({ ids: [id(1), id(2)] }) // a realtime refetch into a window left open
      rerender({ ids: [id(1), id(2), id(3)] })
      await settle()
      expect(api.markSeen).toHaveBeenCalledTimes(1)
      document.dispatchEvent(new Event('pointerdown'))
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(2))
      expect(api.markSeen).toHaveBeenLastCalledWith([id(2), id(3)])
      document.dispatchEvent(new Event('keydown'))
      await settle()
      expect(api.markSeen).toHaveBeenCalledTimes(2)
      now.mockRestore()
    })

    it('a scroll by hand, a key, the window gaining focus or the page coming into view each count', async () => {
      for (const sign of [
        () => document.dispatchEvent(new Event('wheel')),
        () => document.dispatchEvent(new Event('touchmove')),
        () => document.dispatchEvent(new Event('keydown')),
        () => window.dispatchEvent(new Event('focus')),
        () => document.dispatchEvent(new Event('visibilitychange')),
      ]) {
        api.markSeen.mockClear()
        const { rerender, unmount } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [] as string[] } })
        const now = later()
        rerender({ ids: [id(7)] })
        await settle()
        expect(api.markSeen).not.toHaveBeenCalled()
        sign()
        await waitFor(() => expect(api.markSeen).toHaveBeenCalledWith([id(7)]))
        now.mockRestore()
        unmount()
      }
    })

    it('the page moving by itself (a scroll event alone) is not a sign', async () => {
      const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [] as string[] } })
      const now = later()
      rerender({ ids: [id(1)] })
      document.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      await settle()
      expect(api.markSeen).not.toHaveBeenCalled()
      document.dispatchEvent(new Event('wheel')) // the same page does report on a real sign
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledWith([id(1)]))
      now.mockRestore()
    })

    it('rows the person asked for, arriving soon after a click, are reported without another gesture', async () => {
      const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [id(1)] } })
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(1))
      const start = Date.now() + PRESENCE_WINDOW_MS * 5
      const now = vi.spyOn(Date, 'now').mockReturnValue(start)
      document.dispatchEvent(new Event('pointerdown')) // "Show 20 more"
      now.mockReturnValue(start + PRESENCE_WINDOW_MS - 1) // the next page over a slow network
      rerender({ ids: [id(1), id(2)] })
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(2))
      expect(api.markSeen).toHaveBeenLastCalledWith([id(2)])
      now.mockRestore()
    })

    it('a page opened in a background tab and first seen later reports what is on screen then', async () => {
      const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      renderHook(() => useReportSeen([id(1)]), { wrapper })
      const now = later()
      await settle()
      expect(api.markSeen).not.toHaveBeenCalled()
      visibility.mockReturnValue('visible')
      document.dispatchEvent(new Event('visibilitychange'))
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledWith([id(1)]))
      now.mockRestore()
      visibility.mockRestore()
    })

    it('a failed report waits for the next sign once nobody is there', async () => {
      api.markSeen.mockRejectedValueOnce(new Error('offline'))
      renderHook(() => useReportSeen([id(1)]), { wrapper })
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(1))
      await settle()
      const now = later()
      await settle()
      expect(api.markSeen).toHaveBeenCalledTimes(1) // nothing retried before the sign
      document.dispatchEvent(new Event('pointerdown'))
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(2))
      expect(api.markSeen).toHaveBeenLastCalledWith([id(1)])
      now.mockRestore()
    })

    it('ten seconds after the last sign, nobody counts as there', async () => {
      const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [id(1)] } })
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledTimes(1))
      const start = Date.now() + PRESENCE_WINDOW_MS * 5
      const now = vi.spyOn(Date, 'now').mockReturnValue(start)
      document.dispatchEvent(new Event('pointerdown'))
      now.mockReturnValue(start + PRESENCE_WINDOW_MS)
      rerender({ ids: [id(1), id(2)] })
      await settle()
      expect(api.markSeen).toHaveBeenCalledTimes(1)
    })

    it('a slow first read is still the opening: null while loading, reported when the list arrives', async () => {
      const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: null as string[] | null } })
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + PRESENCE_WINDOW_MS * 3) // the read took 30 seconds
      rerender({ ids: [id(1), id(2)] })
      await waitFor(() => expect(api.markSeen).toHaveBeenCalledWith([id(1), id(2)]))
    })

    it('a page that opens with nothing on it does not count a later arrival as the opening', async () => {
      const { rerender } = renderHook(({ ids }) => useReportSeen(ids), { wrapper, initialProps: { ids: [] as string[] } })
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + PRESENCE_WINDOW_MS + 1)
      rerender({ ids: [id(1)] })
      await settle()
      expect(api.markSeen).not.toHaveBeenCalled()
    })
  })
})
