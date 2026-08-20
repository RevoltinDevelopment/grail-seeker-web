import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({}) },
}))

import { apiClient } from './client'
import { issuesAPI } from './issues'

const SERIES_ID = '11111111-1111-1111-1111-111111111111'
const ALIAS_GROUP_ID = '22222222-2222-2222-2222-222222222222'

describe('issuesAPI', () => {
  it('list() calls GET /api/series/:seriesId/issues for a series source', () => {
    issuesAPI.list({ kind: 'series', id: SERIES_ID })
    expect(apiClient.get).toHaveBeenCalledWith(`/api/series/${SERIES_ID}/issues`)
  })

  it('list() calls GET /api/alias-groups/:aliasGroupId/issues for an aliasGroup source', () => {
    issuesAPI.list({ kind: 'aliasGroup', id: ALIAS_GROUP_ID })
    expect(apiClient.get).toHaveBeenCalledWith(`/api/alias-groups/${ALIAS_GROUP_ID}/issues`)
  })

  it('search() calls GET .../issues/search?q=... with the query encoded, for a series source', () => {
    issuesAPI.search({ kind: 'series', id: SERIES_ID }, '2 [26]')
    expect(apiClient.get).toHaveBeenCalledWith(
      `/api/series/${SERIES_ID}/issues/search?q=2%20%5B26%5D`
    )
  })

  it('search() calls GET .../issues/search?q=... with the query encoded, for an aliasGroup source', () => {
    issuesAPI.search({ kind: 'aliasGroup', id: ALIAS_GROUP_ID }, '476')
    expect(apiClient.get).toHaveBeenCalledWith(
      `/api/alias-groups/${ALIAS_GROUP_ID}/issues/search?q=476`
    )
  })
})
