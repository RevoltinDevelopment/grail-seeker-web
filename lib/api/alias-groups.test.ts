import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({}) },
}))

import { apiClient } from './client'
// eslint-disable-next-line import/order -- must follow vi.mock() above, not alphabetical order
import { aliasGroupsAPI } from './alias-groups'

describe('aliasGroupsAPI', () => {
  it('get() calls GET /api/alias-groups/:id', () => {
    aliasGroupsAPI.get('11111111-1111-1111-1111-111111111111')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/alias-groups/11111111-1111-1111-1111-111111111111'
    )
  })
})
