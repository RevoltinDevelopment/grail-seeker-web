/**
 * Story 1.49: platforms now come from the live registry (usePlatforms())
 * instead of hardcoded ACTIVE_PLATFORMS/PLATFORM_LABELS. This rewrite
 * replaces the Story 1.35 MyComicShop-specific suite -- MyComicShop is now
 * just another Core-group entry, covered by the generic Core tests below,
 * with a couple of its own regression assertions kept explicitly.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlatformSelector } from './PlatformSelector'

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: vi.fn(),
}))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import { usePlatforms } from '@/hooks/usePlatforms'

const CORE_PLATFORMS = [
  { slug: 'ebay', displayName: 'eBay', defaultEnabled: true },
  { slug: 'heritage', displayName: 'Heritage', defaultEnabled: true },
  { slug: 'mycomicshop', displayName: 'MyComicShop', defaultEnabled: true },
]

const INDIE_PLATFORMS = [
  { slug: 'indie:bryscomics', displayName: "Bry's Comics", defaultEnabled: true },
  { slug: 'indie:comicbookaddiction', displayName: 'Comic Book Addiction', defaultEnabled: false },
]

const FLAT_NAMES: Record<string, string> = {
  ebay: 'eBay',
  heritage: 'Heritage',
  mycomicshop: 'MyComicShop',
  'indie:bryscomics': "Bry's Comics",
  'indie:comicbookaddiction': 'Comic Book Addiction',
}

function mockGroups(groups: { label: string; platforms: typeof CORE_PLATFORMS }[]) {
  vi.mocked(usePlatforms).mockReturnValue({
    groups,
    isLoading: false,
    error: null,
    displayNameFor: (slug: string) => FLAT_NAMES[slug] ?? slug,
    defaultEnabledSlugs: [],
  })
}

const CORE_ONLY = [{ label: 'Core', platforms: CORE_PLATFORMS }]
const WITH_INDIE = [{ label: 'Core', platforms: CORE_PLATFORMS }, { label: 'Independent Shops', platforms: INDIE_PLATFORMS }]

describe('PlatformSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core platforms (regression)', () => {
    it('renders all three Core checkboxes from the registry, not a hardcoded list', () => {
      mockGroups(CORE_ONLY)
      render(<PlatformSelector platforms={['ebay', 'heritage']} onChange={vi.fn()} />)
      expect(screen.getByRole('checkbox', { name: /eBay \(Active\)/ })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /Heritage \(Active\)/ })).toBeInTheDocument()
      const mcs = screen.getByRole('checkbox', { name: /MyComicShop \(Active\)/ })
      expect(mcs).toBeEnabled()
      expect(mcs).not.toBeChecked()
    })

    it('checks the box when a platform is already in platforms', () => {
      mockGroups(CORE_ONLY)
      render(<PlatformSelector platforms={['ebay', 'heritage', 'mycomicshop']} onChange={vi.fn()} />)
      expect(screen.getByRole('checkbox', { name: /MyComicShop/ })).toBeChecked()
    })

    it('turning a Core platform on calls onChange immediately, no confirmation', async () => {
      mockGroups(CORE_ONLY)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<PlatformSelector platforms={['ebay', 'heritage']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: /MyComicShop/ }))
      expect(onChange).toHaveBeenCalledWith(['ebay', 'heritage', 'mycomicshop'])
    })

    it('turning a Core platform off requires confirmation (regression)', async () => {
      mockGroups(CORE_ONLY)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<PlatformSelector platforms={['ebay', 'heritage', 'mycomicshop']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: /MyComicShop/ }))
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText(/turn off MyComicShop/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Turn Off' }))
      expect(onChange).toHaveBeenCalledWith(['ebay', 'heritage'])
    })

    it('min-one-active rule blocks the last active Core platform when no other group exists', async () => {
      mockGroups(CORE_ONLY)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<PlatformSelector platforms={['mycomicshop']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: /MyComicShop/ }))
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText(/must leave at least one platform active/i)).toBeInTheDocument()
    })

    it('checking a platform clears a pending confirmation for a different platform (regression)', async () => {
      mockGroups(CORE_ONLY)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<PlatformSelector platforms={['ebay', 'heritage']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: /Heritage/ }))
      expect(screen.getByText(/turn off Heritage/i)).toBeInTheDocument()
      await user.click(screen.getByRole('checkbox', { name: /MyComicShop/ }))
      expect(screen.queryByText(/turn off Heritage/i)).not.toBeInTheDocument()
    })

    it('shows the "No extra cost" subtext exactly once, not duplicated at the bottom', () => {
      mockGroups(CORE_ONLY)
      render(<PlatformSelector platforms={['ebay', 'heritage', 'mycomicshop']} onChange={vi.fn()} />)
      expect(screen.getAllByText(/no extra cost/i)).toHaveLength(1)
      expect(screen.queryByText(/more platforms = more opportunities/i)).not.toBeInTheDocument()
    })
  })

  describe('Zero non-Core groups (placeholder)', () => {
    it('renders the generic coming-soon placeholder, not the old dated copy', () => {
      mockGroups(CORE_ONLY)
      render(<PlatformSelector platforms={['ebay']} onChange={vi.fn()} />)
      expect(screen.getByText('More marketplaces coming soon')).toBeInTheDocument()
      expect(screen.queryByText(/Coming Q4 2026/)).not.toBeInTheDocument()
    })

    it('code review fix: renders the placeholder, not a live "(0)" disclosure, when a non-Core group exists but has zero platforms', () => {
      mockGroups([{ label: 'Core', platforms: CORE_PLATFORMS }, { label: 'Independent Shops', platforms: [] }])
      render(<PlatformSelector platforms={['ebay']} onChange={vi.fn()} />)
      expect(screen.getByText('More marketplaces coming soon')).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: /Toggle all/ })).not.toBeInTheDocument()
    })
  })

  describe('Registry fetch failure (code review fix)', () => {
    it('shows a visible error instead of silently rendering an empty, permanently-blocked form', () => {
      vi.mocked(usePlatforms).mockReturnValue({
        groups: [],
        isLoading: false,
        error: new Error('network error'),
        displayNameFor: (slug: string) => slug,
        defaultEnabledSlugs: [],
      })
      render(<PlatformSelector platforms={[]} onChange={vi.fn()} />)
      expect(screen.getByText(/couldn.t load platforms/i)).toBeInTheDocument()
    })
  })

  describe('Independent Shops disclosure group', () => {
    it('renders collapsed by default with an accurate count', () => {
      mockGroups(WITH_INDIE)
      render(<PlatformSelector platforms={['ebay', 'heritage', 'mycomicshop']} onChange={vi.fn()} />)
      expect(screen.getByText('Independent Shops')).toBeInTheDocument()
      expect(screen.getByText('(2)')).toBeInTheDocument()
      expect(screen.queryByText("Bry's Comics")).not.toBeInTheDocument()
    })

    it('expands to show individual stores when the label is clicked', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      render(<PlatformSelector platforms={['ebay']} onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /Independent Shops/ }))
      expect(screen.getByText("Bry's Comics")).toBeInTheDocument()
      expect(screen.getByText('Comic Book Addiction')).toBeInTheDocument()
    })

    it('group checkbox is unchecked when zero stores are active', () => {
      mockGroups(WITH_INDIE)
      render(<PlatformSelector platforms={['ebay']} onChange={vi.fn()} />)
      const groupCheckbox = screen.getByRole('checkbox', { name: /Toggle all Independent Shops/ })
      expect(groupCheckbox).not.toBeChecked()
    })

    it('group checkbox is checked when every store is active', () => {
      mockGroups(WITH_INDIE)
      render(
        <PlatformSelector
          platforms={['ebay', 'indie:bryscomics', 'indie:comicbookaddiction']}
          onChange={vi.fn()}
        />
      )
      expect(screen.getByRole('checkbox', { name: /Toggle all Independent Shops/ })).toBeChecked()
    })

    it('group checkbox is indeterminate (mixed) when only some stores are active', () => {
      mockGroups(WITH_INDIE)
      render(<PlatformSelector platforms={['ebay', 'indie:bryscomics']} onChange={vi.fn()} />)
      const groupCheckbox = screen.getByRole('checkbox', { name: /Toggle all Independent Shops/ })
      expect((groupCheckbox as HTMLInputElement).indeterminate).toBe(true)
      expect(groupCheckbox).toHaveAttribute('aria-checked', 'mixed')
    })
  })

  describe('Individual independent-store toggle', () => {
    it('turning a store on requires no confirmation', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<PlatformSelector platforms={['ebay']} onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /Independent Shops/ }))
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      expect(onChange).toHaveBeenCalledWith(['ebay', 'indie:bryscomics'])
    })

    it('turning a store off requires confirmation, named by its own display name', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<PlatformSelector platforms={['ebay', 'indie:bryscomics']} onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: /Independent Shops/ }))
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText(/turn off Bry's Comics/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Turn Off' }))
      expect(onChange).toHaveBeenCalledWith(['ebay'])
    })

    it('shows the suppress checkbox only for an individual-store confirmation, unchecked by default', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      render(<PlatformSelector platforms={['ebay', 'indie:bryscomics']} onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: /Independent Shops/ }))
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      const suppress = screen.getByRole('checkbox', { name: /do not warn for independent stores/i })
      expect(suppress).not.toBeChecked()
    })

    it('checking suppress and confirming skips the confirmation on the next individual store', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { rerender } = render(
        <PlatformSelector
          platforms={['ebay', 'indie:bryscomics', 'indie:comicbookaddiction']}
          onChange={onChange}
        />
      )
      await user.click(screen.getByRole('button', { name: /Independent Shops/ }))
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      await user.click(screen.getByRole('checkbox', { name: /do not warn for independent stores/i }))
      await user.click(screen.getByRole('button', { name: 'Turn Off' }))
      expect(onChange).toHaveBeenCalledWith(['ebay', 'indie:comicbookaddiction'])

      // Simulate the parent applying onChange's result, then turn off the second store
      rerender(<PlatformSelector platforms={['ebay', 'indie:comicbookaddiction']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: 'Comic Book Addiction' }))
      // No confirmation card this time -- turns off immediately
      expect(onChange).toHaveBeenCalledWith(['ebay'])
      expect(screen.queryByText(/turn off Comic Book Addiction/i)).not.toBeInTheDocument()
    })

    it('suppression only resets once EVERY independent store is active again, not just the one re-checked', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { rerender } = render(
        <PlatformSelector
          platforms={['ebay', 'indie:bryscomics', 'indie:comicbookaddiction']}
          onChange={onChange}
        />
      )
      await user.click(screen.getByRole('button', { name: /Independent Shops/ }))

      // Turn off Bry's Comics, arming suppression
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      await user.click(screen.getByRole('checkbox', { name: /do not warn for independent stores/i }))
      await user.click(screen.getByRole('button', { name: 'Turn Off' }))
      rerender(<PlatformSelector platforms={['ebay', 'indie:comicbookaddiction']} onChange={onChange} />)

      // Turn off Comic Book Addiction too -- suppression already armed, skips confirmation
      await user.click(screen.getByRole('checkbox', { name: 'Comic Book Addiction' }))
      expect(onChange).toHaveBeenLastCalledWith(['ebay'])
      rerender(<PlatformSelector platforms={['ebay']} onChange={onChange} />)

      // Re-check only Bry's Comics -- NOT every independent store is active yet, suppression must stay armed
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      rerender(<PlatformSelector platforms={['ebay', 'indie:bryscomics']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      expect(screen.queryByText(/turn off Bry's Comics/i)).not.toBeInTheDocument()
      expect(onChange).toHaveBeenLastCalledWith(['ebay'])
      rerender(<PlatformSelector platforms={['ebay']} onChange={onChange} />)

      // Now bring BOTH stores back active -- this genuinely resets the suppression
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      rerender(<PlatformSelector platforms={['ebay', 'indie:bryscomics']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: 'Comic Book Addiction' }))
      rerender(
        <PlatformSelector
          platforms={['ebay', 'indie:bryscomics', 'indie:comicbookaddiction']}
          onChange={onChange}
        />
      )

      // Turning one off again should now require confirmation again
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      expect(screen.getByText(/turn off Bry's Comics/i)).toBeInTheDocument()
    })
  })

  describe('Group bulk toggle', () => {
    it('turning the whole group on requires no confirmation and activates every store', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<PlatformSelector platforms={['ebay']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: /Toggle all Independent Shops/ }))
      expect(onChange).toHaveBeenCalledWith(['ebay', 'indie:bryscomics', 'indie:comicbookaddiction'])
    })

    it('turning the whole group off requires confirmation with aggregate copy, no suppress checkbox', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <PlatformSelector
          platforms={['ebay', 'indie:bryscomics', 'indie:comicbookaddiction']}
          onChange={onChange}
        />
      )
      await user.click(screen.getByRole('checkbox', { name: /Toggle all Independent Shops/ }))
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText(/turn off all 2 Independent Shops/i)).toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: /do not warn/i })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Turn Off' }))
      expect(onChange).toHaveBeenCalledWith(['ebay'])
    })

    it('bulk-off is blocked by the global min-one rule when no Core platform is active', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <PlatformSelector platforms={['indie:bryscomics', 'indie:comicbookaddiction']} onChange={onChange} />
      )
      await user.click(screen.getByRole('checkbox', { name: /Toggle all Independent Shops/ }))
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText(/must leave at least one platform active/i)).toBeInTheDocument()
    })

    it('bulk-off always confirms even if individual-store suppression was previously armed', async () => {
      mockGroups(WITH_INDIE)
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { rerender } = render(
        <PlatformSelector
          platforms={['ebay', 'indie:bryscomics', 'indie:comicbookaddiction']}
          onChange={onChange}
        />
      )
      await user.click(screen.getByRole('button', { name: /Independent Shops/ }))
      await user.click(screen.getByRole('checkbox', { name: "Bry's Comics" }))
      await user.click(screen.getByRole('checkbox', { name: /do not warn for independent stores/i }))
      await user.click(screen.getByRole('button', { name: 'Turn Off' }))

      rerender(<PlatformSelector platforms={['ebay', 'indie:comicbookaddiction']} onChange={onChange} />)
      await user.click(screen.getByRole('checkbox', { name: /Toggle all Independent Shops/ }))
      expect(onChange).not.toHaveBeenCalledWith(['ebay'])
      expect(screen.getByText(/turn off all/i)).toBeInTheDocument()
    })
  })
})
