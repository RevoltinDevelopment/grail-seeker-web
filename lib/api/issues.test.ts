import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({}) },
}))

import { apiClient } from './client'
import { issuesAPI } from './issues'

describe('issuesAPI', () => {
  it('list() calls GET /api/series/:seriesId/issues', () => {
    issuesAPI.list('11111111-1111-1111-1111-111111111111')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/series/11111111-1111-1111-1111-111111111111/issues'
    )
  })

  it('search() calls GET .../issues/search?q=... with the query encoded', () => {
    issuesAPI.search('11111111-1111-1111-1111-111111111111', '2 [26]')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/series/11111111-1111-1111-1111-111111111111/issues/search?q=2%20%5B26%5D'
    )
  })
})
