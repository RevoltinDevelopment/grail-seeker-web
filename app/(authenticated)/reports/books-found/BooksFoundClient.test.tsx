/**
 * Story 1.100 (U-14): Books found, as drawn in reports-books-found.html.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BooksFoundResponse, Copy } from '@/types/report.types'

const state = vi.hoisted(() => ({
  report: undefined as unknown,
  isLoading: false,
  error: null as unknown,
  refetch: vi.fn(),
}))
vi.mock('@/hooks/useReports', () => ({
  useBooksFound: () => ({ report: state.report, isLoading: state.isLoading, error: state.error, refetch: state.refetch }),
}))
vi.mock('@/hooks/usePlatforms', () => ({ usePlatforms: () => ({ displayNameFor: (s: string) => s }) }))

// eslint-disable-next-line import/order -- must follow vi.mock() above
import BooksFoundClient from './BooksFoundClient'

const book = (seriesTitle: string, issueNumber: string) => ({ seriesTitle, issueNumber, issueVolumeText: null })
const copy = (over: Partial<Copy> = {}): Copy => ({
  alertId: 'c1',
  book: book('The Amazing Spider-Man', '129'),
  marketplace: 'MyComicShop',
  listingUrl: 'https://track.example/1',
  grade: { gradingAuthority: 'CGC', grade: 9.2, pageQuality: 'White Pages' },
  price: 3950,
  priceIsPlaceholder: false,
  nearMiss: false,
  foundAt: '2026-10-27T14:00:00Z',
  priceChange: null,
  now: { listingStatus: 'active', archiveReason: null, archivedAt: null },
  alerts: 1,
  ...over,
})

const report = (over: Partial<BooksFoundResponse> = {}): BooksFoundResponse => ({
  joinedAt: '2026-08-12T15:00:00Z',
  since: '2026-08-30T14:00:00Z',
  copiesFound: 3,
  books: [
    {
      ...book('The Amazing Spider-Man', '129'),
      searchDeleted: false,
      copies: [
        copy(),
        copy({
          alertId: 'c2',
          marketplace: 'eBay',
          grade: { gradingAuthority: 'CGC', grade: 9.4, pageQuality: null },
          price: 4850,
          nearMiss: true,
          foundAt: '2026-10-20T14:00:00Z',
          now: { listingStatus: 'archived_expired', archiveReason: 'listing_sold', archivedAt: '2026-10-24T14:00:00Z' },
        }),
      ],
    },
    {
      ...book('Daredevil', '158'),
      searchDeleted: true,
      copies: [copy({ alertId: 'c3', marketplace: 'eBay', now: { listingStatus: 'archived_dismissed', archiveReason: 'search_deleted', archivedAt: '2026-09-20T14:00:00Z' } })],
    },
  ],
  ...over,
})

beforeEach(() => {
  state.report = report()
  state.isLoading = false
  state.error = null
  state.refetch.mockReset()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-18T17:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('BooksFoundClient', () => {
  it('every copy, grouped by book, with its grade, price, where and when, and where it is now', () => {
    render(<BooksFoundClient />)
    expect(screen.getByText('3 copies of 2 books, since Aug 12, 2026')).toBeInTheDocument()
    const asm = screen.getByRole('group', { name: 'The Amazing Spider-Man #129' })
    expect(within(asm).getByText('2 copies')).toBeInTheDocument()
    const first = within(asm).getByRole('link', { name: /CGC 9\.2 · White pages · \$3,950/ })
    expect(first).toHaveAttribute('href', '/alerts')
    expect(within(first).getByText('MyComicShop · found Oct 27')).toBeInTheDocument()
    expect(within(first).getByText('In Alerts')).toBeInTheDocument()
    const sold = within(asm).getByRole('link', { name: /CGC 9\.4 · \$4,850/ })
    expect(sold).toHaveAttribute('href', '/alerts/archive')
    expect(within(sold).getByText('eBay · found Oct 20 · near miss')).toBeInTheDocument()
    expect(within(sold).getByText('Sold Oct 24')).toBeInTheDocument()
    const dd = screen.getByRole('group', { name: 'Daredevil #158' })
    expect(within(dd).getByText('1 copy')).toBeInTheDocument()
    expect(within(dd).getByText('Search deleted Sep 20')).toBeInTheDocument()
    expect(screen.getByText(/A copy whose price changed counts once\./)).toBeInTheDocument()
  })

  it('a MyComicShop auction shows no price', () => {
    state.report = report({
      copiesFound: 1,
      books: [{ ...book('X-Men', '1'), searchDeleted: false, copies: [copy({ priceIsPlaceholder: true, price: 0 })] }],
    })
    render(<BooksFoundClient />)
    expect(screen.getByText('CGC 9.2 · White pages')).toBeInTheDocument()
    expect(screen.queryByText(/\$0/)).toBeNull()
    expect(screen.getByText('MyComicShop auction · found Oct 27')).toBeInTheDocument()
  })

  it('nothing found yet', () => {
    state.report = report({ copiesFound: 0, books: [], since: null })
    render(<BooksFoundClient />)
    expect(screen.getByRole('heading', { name: 'No books found yet' })).toBeInTheDocument()
    expect(screen.getByText('Every copy we find for you will be listed here.')).toBeInTheDocument()
  })

  it('a failed read offers Try again, never the error text', () => {
    state.report = undefined
    state.error = new Error('ECONNRESET')
    render(<BooksFoundClient />)
    expect(screen.getByRole('heading', { name: 'We couldn’t load your books found' })).toBeInTheDocument()
    expect(screen.queryByText(/ECONNRESET/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.refetch).toHaveBeenCalled()
  })
})
