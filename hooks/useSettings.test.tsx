/** Story 1.104: Settings' data hooks (review, 2026-11-18: saves keep to their own fields; stale previews dropped). */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  checkTimes: vi.fn(),
}))
vi.mock('@/lib/api/user', () => ({
  getUserPreferences: state.get,
  updateUserPreferences: state.patch,
}))
vi.mock('@/lib/api/account', () => ({ accountAPI: { checkTimes: state.checkTimes } }))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { PREFERENCES_KEY, usePreferences, useQuietPreview } from './useSettings'

const row = {
  smsNotificationsEnabled: true,
  quietHoursEnabled: false,
  nearMissEnabled: true,
  timezone: 'America/New_York',
}

function wrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  state.get.mockReset().mockResolvedValue(row)
  state.patch.mockReset()
  state.checkTimes.mockReset()
})

describe('usePreferences', () => {
  it("a save takes only its own fields from the server's answer, so a late answer can't undo another save", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => usePreferences(), { wrapper: wrapper(client) })
    await waitFor(() => expect(result.current.prefs).not.toBeNull())
    // Quiet hours were switched off by another save; this answer is a whole row from before that
    client.setQueryData(PREFERENCES_KEY, { ...row, quietHoursEnabled: false })
    state.patch.mockResolvedValue({
      success: true,
      preferences: { ...row, quietHoursEnabled: true, nearMissEnabled: false },
    })
    await act(async () => {
      await result.current.save({ nearMissEnabled: false })
    })
    expect(client.getQueryData(PREFERENCES_KEY)).toEqual({
      ...row,
      quietHoursEnabled: false,
      nearMissEnabled: false,
    })
  })
})

describe('useQuietPreview', () => {
  it('an answer still on its way when the hours are cleared is dropped', async () => {
    vi.useFakeTimers()
    let answer: (v: unknown) => void = () => {}
    state.checkTimes.mockImplementation(() => new Promise((r) => (answer = r)))
    const { result, rerender } = renderHook(
      ({ p }: { p: { quietStart: string } | null }) => useQuietPreview(p, 300),
      {
        initialProps: { p: { quietStart: '21:00' } as { quietStart: string } | null },
      }
    )
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    rerender({ p: null })
    await act(async () => {
      answer({ timezone: 'America/New_York', timezoneName: 'Eastern Time', times: [] })
    })
    expect(result.current).toBeUndefined()
    vi.useRealTimers()
  })
})
