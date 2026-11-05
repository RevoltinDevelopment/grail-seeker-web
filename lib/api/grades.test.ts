import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({}) },
}))

import { apiClient } from './client'
import { gradesAPI } from './grades'

describe('gradesAPI', () => {
  it('list() calls GET /api/grades', () => {
    gradesAPI.list()
    expect(apiClient.get).toHaveBeenCalledWith('/api/grades')
  })
})
