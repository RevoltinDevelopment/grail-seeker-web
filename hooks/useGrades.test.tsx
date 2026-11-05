import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { onlineManager } from '@tanstack/react-query'
import { renderHookWithProviders } from '@/test-utils/renderWithProviders'

vi.mock('@/lib/api/grades', () => ({
  gradesAPI: { list: vi.fn() },
}))

import { gradesAPI } from '@/lib/api/grades'
import { useGrades } from './useGrades'

const GRADES = {
  grades: [
    { value: 9.6, label: '9.6 - NM+' },
    { value: 9.8, label: '9.8 - NM/M' },
  ],
}

describe('useGrades (Story 1.84)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    onlineManager.setOnline(true)
  })

  // The hook retries once (code review), about a second, before it reports a failure.
  const AFTER_ONE_RETRY = { timeout: 3000 }

  it('returns the server\'s grades in its order', async () => {
    vi.mocked(gradesAPI.list).mockResolvedValue(GRADES)
    const { result } = renderHookWithProviders(() => useGrades())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.failed).toBe(false)
    await waitFor(() => expect(result.current.grades).toEqual(GRADES.grades))
    expect(result.current.failed).toBe(false)
  })

  it('reports a failure, with no grades and no fallback list', async () => {
    vi.mocked(gradesAPI.list).mockRejectedValue(new Error('500'))
    const { result } = renderHookWithProviders(() => useGrades())
    await waitFor(() => expect(result.current.failed).toBe(true), AFTER_ONE_RETRY)
    expect(result.current.grades).toBeNull()
    expect(gradesAPI.list).toHaveBeenCalledTimes(2)
  })

  it('code review: offline, a paused first request is a failure to show, not an endless load', async () => {
    onlineManager.setOnline(false)
    vi.mocked(gradesAPI.list).mockResolvedValue(GRADES)
    const { result } = renderHookWithProviders(() => useGrades())
    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current.isLoading).toBe(false)
    expect(gradesAPI.list).not.toHaveBeenCalled()
  })

  it('treats an empty list as a failure', async () => {
    vi.mocked(gradesAPI.list).mockResolvedValue({ grades: [] })
    const { result } = renderHookWithProviders(() => useGrades())
    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current.grades).toBeNull()
  })

  it('retry() asks again, and a success clears the failure', async () => {
    vi.mocked(gradesAPI.list).mockRejectedValue(new Error('500'))
    const { result } = renderHookWithProviders(() => useGrades())
    await waitFor(() => expect(result.current.failed).toBe(true), AFTER_ONE_RETRY)
    vi.mocked(gradesAPI.list).mockResolvedValue(GRADES)
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.grades).toEqual(GRADES.grades))
    expect(result.current.failed).toBe(false)
    expect(gradesAPI.list).toHaveBeenCalledTimes(3)
  })
})
