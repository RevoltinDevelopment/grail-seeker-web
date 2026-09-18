import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderHookWithProviders } from '@/test-utils/renderWithProviders'

vi.mock('@/lib/api/platforms', () => ({
  platformsAPI: { list: vi.fn() },
}))

import { platformsAPI } from '@/lib/api/platforms'
import { usePlatforms } from './usePlatforms'

const CORE_ONLY = {
  groups: [
    {
      label: 'Core',
      platforms: [
        { slug: 'ebay', displayName: 'eBay', defaultEnabled: true },
        { slug: 'heritage', displayName: 'Heritage', defaultEnabled: true },
        { slug: 'mycomicshop', displayName: 'MyComicShop', defaultEnabled: true },
      ],
    },
  ],
}

const WITH_INDEPENDENT_SHOPS = {
  groups: [
    ...CORE_ONLY.groups,
    {
      label: 'Independent Shops',
      platforms: [
        { slug: 'indie:bryscomics', displayName: "Bry's Comics", defaultEnabled: true },
        { slug: 'indie:comicbookaddiction', displayName: 'Comic Book Addiction', defaultEnabled: false },
      ],
    },
  ],
}

describe('usePlatforms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty groups and empty derived values while loading', () => {
    vi.mocked(platformsAPI.list).mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHookWithProviders(() => usePlatforms())
    expect(result.current.groups).toEqual([])
    expect(result.current.defaultEnabledSlugs).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('exposes the real groups once loaded', async () => {
    vi.mocked(platformsAPI.list).mockResolvedValue(CORE_ONLY)
    const { result } = renderHookWithProviders(() => usePlatforms())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.groups).toEqual(CORE_ONLY.groups)
  })

  it('defaultEnabledSlugs flattens every defaultEnabled platform across every group', async () => {
    vi.mocked(platformsAPI.list).mockResolvedValue(WITH_INDEPENDENT_SHOPS)
    const { result } = renderHookWithProviders(() => usePlatforms())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.defaultEnabledSlugs).toEqual(['ebay', 'heritage', 'mycomicshop', 'indie:bryscomics'])
  })

  it('displayNameFor resolves a known slug to its real display name', async () => {
    vi.mocked(platformsAPI.list).mockResolvedValue(WITH_INDEPENDENT_SHOPS)
    const { result } = renderHookWithProviders(() => usePlatforms())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.displayNameFor('indie:bryscomics')).toBe("Bry's Comics")
  })

  it('displayNameFor falls back to the raw slug for an unrecognized platform, never crashes', async () => {
    vi.mocked(platformsAPI.list).mockResolvedValue(CORE_ONLY)
    const { result } = renderHookWithProviders(() => usePlatforms())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.displayNameFor('indie:somefutureshop')).toBe('indie:somefutureshop')
  })
})
