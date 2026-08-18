import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '@/test-utils/renderWithProviders'
import { APIError } from '@/lib/api/client'
import { useIssues } from './useIssues'

vi.mock('@/lib/api/issues', () => ({
  issuesAPI: { list: vi.fn() },
}))

import { issuesAPI } from '@/lib/api/issues'

describe('useIssues', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when seriesId is null', () => {
    renderHookWithProviders(() => useIssues(null))
    expect(issuesAPI.list).not.toHaveBeenCalled()
  })

  it('fetches issues once a seriesId is provided', async () => {
    vi.mocked(issuesAPI.list).mockResolvedValue({
      layoutMode: 'grid',
      hasMultipleVolumes: false,
      volumes: [],
    })

    const { result } = renderHookWithProviders(() =>
      useIssues('11111111-1111-1111-1111-111111111111')
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(issuesAPI.list).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })

  it('does not retry a 404 (no GCD data is an expected response, not a transient failure)', async () => {
    vi.mocked(issuesAPI.list).mockRejectedValue(new APIError(404, 'NOT_FOUND', 'No issues found'))

    const { result } = renderHookWithProviders(() =>
      useIssues('11111111-1111-1111-1111-111111111111')
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(issuesAPI.list).toHaveBeenCalledTimes(1)
  })
})
