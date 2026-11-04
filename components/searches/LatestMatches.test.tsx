import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LatestMatches } from './LatestMatches'

// Story 1.82 (U-04): Latest matches, as drawn in searches-home.html.
const state = vi.hoisted(() => ({ alerts: [] as unknown[], isLoading: false, error: null as unknown, reported: [] as string[][], useAlertsArgs: [] as unknown[] }))
vi.mock('@/hooks/useAlerts', () => ({
  useAlerts: (...args: unknown[]) => {
    state.useAlertsArgs = args
    return { alerts: state.alerts, isLoading: state.isLoading, error: state.error }
  },
}))
vi.mock('@/hooks/usePlatforms', () => ({ usePlatforms: () => ({ displayNameFor: (slug: string) => ({ ebay: 'eBay', mycomicshop: 'MyComicShop' })[slug] ?? slug }) }))
vi.mock('@/hooks/useUnseenAlerts', () => ({ useReportSeen: (ids: string[]) => state.reported.push(ids) }))

const alert = (id: string, title: string, issue: string, grade: number | null, authority: string | null, price: number, platform: string) => ({
  id,
  search: { series: { title, volume: 1 }, issueNumber: issue, issueVolumeText: null },
  listing: { title: 'x', price, grade, gradingAuthority: authority, pageQuality: null, url: null, platform, ebayItemId: null },
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
})

beforeEach(() => {
  state.alerts = []
  state.isLoading = false
  state.error = null
  state.reported = []
  // Midday, so "2 hours ago" is today whenever the tests run (review, 2026-11-04)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 4, 12, 0))
})
afterEach(() => vi.useRealTimers())

describe('LatestMatches', () => {
  it('shows the three latest active alerts, as drawn, and reports them as seen', () => {
    state.alerts = [
      alert('a1', 'Werewolf by Night', '32', 9.6, 'cgc', 5400, 'ebay'),
      alert('a2', 'The Amazing Spider-Man', '129', 9.0, 'CGC', 3100, 'mycomicshop'),
      alert('a3', 'X-Men', '94', null, null, 250, 'ebay'),
    ]
    render(<LatestMatches />)
    expect(state.useAlertsArgs).toEqual([{ limit: 3, status: 'active' }, { enableToasts: true }])
    expect(screen.getByText('Werewolf by Night #32')).toBeInTheDocument()
    expect(screen.getByText('CGC 9.6 · $5,400')).toBeInTheDocument()
    expect(screen.getAllByText('eBay · 2 hours ago')).toHaveLength(2)
    expect(screen.getByText('$250')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All alerts' })).toHaveAttribute('href', '/alerts')
    expect(state.reported.at(-1)).toEqual(['a1', 'a2', 'a3'])
  })

  it('an auction not yet started shows when it starts beside its placeholder price', () => {
    state.alerts = [{ ...alert('m1', 'X-Men', '1', 9.0, 'CGC', 0, 'mycomicshop'), listing: { ...alert('m1', 'X-Men', '1', 9.0, 'CGC', 0, 'mycomicshop').listing, auctionStartTime: '2026-11-06T17:00:00Z' } }]
    render(<LatestMatches />)
    expect(screen.getByText('CGC 9.0 · $0, auction starts Nov 6')).toBeInTheDocument()
  })

  it('a failed load says so, never "No matches yet"', () => {
    state.error = new Error('down')
    render(<LatestMatches />)
    expect(screen.getByText("Your latest matches couldn't be loaded right now. Refresh the page to try again.")).toBeInTheDocument()
    expect(screen.queryByText(/No matches yet/)).toBeNull()
  })

  it('with no matches: today\'s words, and nothing reported', () => {
    render(<LatestMatches />)
    expect(screen.getByText(/No matches yet/)).toBeInTheDocument()
    expect(state.reported.at(-1)).toEqual([])
  })
})
