import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({}) },
}))

import { apiClient } from './client'
import { platformsAPI } from './platforms'

describe('platformsAPI', () => {
  it('list() calls GET /api/platforms', () => {
    platformsAPI.list()
    expect(apiClient.get).toHaveBeenCalledWith('/api/platforms')
  })
})
