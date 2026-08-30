/**
 * Story 1.35: covers the two real bugs/gaps this story fixes —
 * (1) the "View on X" button label was a hardcoded eBay/Heritage binary
 * ternary that mislabeled every MyComicShop alert as "View on eBay", and
 * (2) auctionStartTime (shipped by the backend in Story 1.34) was never
 * read or displayed anywhere in this repo.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToastProvider } from '@/contexts/ToastContext'
import type { Alert } from '@/types/alert.types'
import { AlertCard } from './AlertCard'

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

  it('falls back to "View on eBay" for an unrecognized platform value', () => {
    renderWithProviders(makeAlert({ platform: 'somethingNew' }))
    expect(screen.getByRole('link')).toHaveTextContent('View on eBay')
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
