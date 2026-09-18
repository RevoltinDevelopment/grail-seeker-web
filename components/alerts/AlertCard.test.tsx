/**
 * Story 1.35: covers the two real bugs/gaps this story fixes —
 * (1) the "View on X" button label was a hardcoded eBay/Heritage binary
 * ternary that mislabeled every MyComicShop alert as "View on eBay", and
 * (2) auctionStartTime (shipped by the backend in Story 1.34) was never
 * read or displayed anywhere in this repo.
 *
 * Story 1.49: both platform-display call sites now resolve through the live
 * registry (usePlatforms().displayNameFor()) instead of the hardcoded
 * PLATFORM_LABELS map. A second, previously-undocumented and previously
 * UNTESTED bug is fixed here too: the platform badge rendered
 * `platform.toUpperCase()` with no lookup at all -- for an independent shop
 * this would have printed a raw slug like "INDIE:BRYSCOMICS" verbatim.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ToastProvider } from '@/contexts/ToastContext'
import type { Alert } from '@/types/alert.types'
import { AlertCard } from './AlertCard'

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: vi.fn(() => ({
    groups: [],
    isLoading: false,
    error: null,
    displayNameFor: (slug: string) =>
      ({ ebay: 'eBay', heritage: 'Heritage', mycomicshop: 'MyComicShop', 'indie:bryscomics': "Bry's Comics" })[
        slug
      ] ?? slug,
    defaultEnabledSlugs: [],
  })),
}))

function renderWithProviders(alert: Alert) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AlertCard alert={alert} />
      </ToastProvider>
    </QueryClientProvider>
  )
}

function makeAlert(overrides: Partial<Alert['listing']> = {}): Alert {
  return {
    id: 'alert-1',
    searchId: 'search-1',
    search: {
      series: { title: 'Airboy Comics', volume: 3 },
      issueNumber: '2',
      issueVolumeText: '3',
    },
    listing: {
      title: 'Airboy Comics Vol. 3 #2',
      price: 1499,
      grade: 9.2,
      pageQuality: null,
      gradingAuthority: 'CGC',
      url: 'https://www.mycomicshop.com/search?IID=63214346',
      platform: 'ebay',
      ebayItemId: null,
      ...overrides,
    },
    isDirectMatch: true,
    notificationSent: true,
    notificationSentAt: '2026-08-29T12:00:00Z',
    createdAt: '2026-08-29T12:00:00Z',
  }
}

describe('AlertCard — "View on X" label dispatch (Story 1.35)', () => {
  it('shows "View on eBay" for an eBay listing', () => {
    renderWithProviders(makeAlert({ platform: 'ebay' }))
    expect(screen.getByRole('link')).toHaveTextContent('View on eBay')
  })

  it('shows "View on Heritage" for a Heritage listing', () => {
    renderWithProviders(makeAlert({ platform: 'heritage' }))
    expect(screen.getByRole('link')).toHaveTextContent('View on Heritage')
  })

  it('shows "View on MyComicShop" for a MyComicShop listing (previously mislabeled "View on eBay")', () => {
    renderWithProviders(makeAlert({ platform: 'mycomicshop' }))
    expect(screen.getByRole('link')).toHaveTextContent('View on MyComicShop')
  })

  it('shows "View on Bry\'s Comics" for a real independent-shop listing', () => {
    renderWithProviders(makeAlert({ platform: 'indie:bryscomics' }))
    expect(screen.getByRole('link')).toHaveTextContent("View on Bry's Comics")
  })

  it('Story 1.49: falls back to the raw slug for an unrecognized platform, never silently claims eBay', () => {
    renderWithProviders(makeAlert({ platform: 'indie:somefutureshop' }))
    expect(screen.getByRole('link')).toHaveTextContent('View on indie:somefutureshop')
    expect(screen.getByRole('link')).not.toHaveTextContent('View on eBay')
  })
})

describe('AlertCard — platform badge (Story 1.49)', () => {
  it('shows the real display name for eBay, not a raw uppercased slug', () => {
    renderWithProviders(makeAlert({ platform: 'ebay' }))
    expect(screen.getByText('eBay')).toBeInTheDocument()
    expect(screen.queryByText('EBAY')).not.toBeInTheDocument()
  })

  it('shows the real display name for a real independent shop, correctly cased with its apostrophe', () => {
    renderWithProviders(makeAlert({ platform: 'indie:bryscomics' }))
    expect(screen.getByText("Bry's Comics")).toBeInTheDocument()
  })

  it('falls back to the raw slug for an unrecognized platform, not an uppercased garble', () => {
    renderWithProviders(makeAlert({ platform: 'indie:somefutureshop' }))
    expect(screen.getByText('indie:somefutureshop')).toBeInTheDocument()
    expect(screen.queryByText('INDIE:SOMEFUTURESHOP')).not.toBeInTheDocument()
  })
})

describe('AlertCard — auction-start-date display (Story 1.35)', () => {
  it('shows an "Auction Starts" line when auctionStartTime is present', () => {
    renderWithProviders(
      makeAlert({ platform: 'mycomicshop', auctionStartTime: '2026-09-15T18:00:00Z' })
    )
    expect(screen.getByText('Auction Starts:')).toBeInTheDocument()
  })

  it('does not show an "Auction Starts" line when auctionStartTime is absent (regression)', () => {
    renderWithProviders(makeAlert({ platform: 'ebay' }))
    expect(screen.queryByText('Auction Starts:')).not.toBeInTheDocument()
  })

  it('does not show an "Auction Starts" line when auctionStartTime is null', () => {
    renderWithProviders(makeAlert({ platform: 'mycomicshop', auctionStartTime: null }))
    expect(screen.queryByText('Auction Starts:')).not.toBeInTheDocument()
  })
})
