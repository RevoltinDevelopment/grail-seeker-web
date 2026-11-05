import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { GrailSearch } from '@/types/search.types'

import { SearchCard, chipsFor, dayAndTime, gradeText } from './SearchCard'

// Story 1.83 (U-05): the search card as drawn (searches-home.html).
function search(over: Partial<GrailSearch> = {}): GrailSearch {
  return {
    id: 's1',
    userId: 'u',
    series: {
      id: 'x',
      title: 'The Amazing Spider-Man',
      volume: 1,
      yearRange: '1963-1998',
      type: 'series',
      publisher: 'Marvel',
    },
    issueNumber: '129',
    issueId: null,
    issueVolumeText: null,
    issuePublicationYear: null,
    aliasGroupId: null,
    isActive: true,
    notificationsEnabled: true,
    platforms: ['ebay', 'mycomicshop', 'indie:a', 'indie:b', 'indie:c'],
    maxPrice: 4500,
    gradeMin: 9.0,
    gradeMax: 9.4,
    pageQuality: null,
    gradingAuthority: 'cgc',
    slotsUsed: 3,
    currentAlertCount: 2,
    archivedAlertCount: 3,
    lastCheckedAt: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...over,
  }
}
const SHOPS = {
  label: 'Independent shops',
  slugs: ['indie:a', 'indie:b', 'indie:c', 'indie:d', 'indie:e'],
}
const handlers = {
  onToggle: vi.fn(),
  onAskDelete: vi.fn(),
  onCancelDelete: vi.fn(),
  onDelete: vi.fn(),
}
const card = (s: GrailSearch, extra: Partial<Parameters<typeof SearchCard>[0]> = {}) =>
  render(
    <SearchCard
      search={s}
      independentShops={SHOPS}
      toggling={false}
      refused={null}
      confirmingDelete={false}
      deleting={false}
      {...handlers}
      {...extra}
    />
  )

describe('SearchCard', () => {
  it('running: slots, facts, neutral chips, alerts as links, Edit / Pause / Delete, no status label', () => {
    card(search())
    expect(screen.getByRole('heading', { name: 'The Amazing Spider-Man #129' })).toBeInTheDocument()
    expect(screen.getByText('3').parentElement).toHaveTextContent('3slots')
    expect(screen.getByText('9.0 to 9.4')).toBeInTheDocument()
    expect(screen.getByText('CGC')).toBeInTheDocument()
    expect(screen.getByText('$4,500')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Where it looks' })).toHaveTextContent(
      'eBayMyComicShopIndependent shops (3 of 5)'
    )
    expect(screen.getByRole('link', { name: '2 alerts' })).toHaveAttribute(
      'href',
      '/alerts?search=s1'
    )
    expect(screen.getByRole('link', { name: '3 archived' })).toHaveAttribute(
      'href',
      '/alerts/archive?search=s1'
    )
    expect(
      screen.getByRole('button', { name: 'Pause The Amazing Spider-Man #129' })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Active|Running/)).toBeNull()
  })

  it('paused: recessed, "Paused by you on Oct 12.", Resume filled', () => {
    card(search({ isActive: false, pausedAt: '2026-10-12T15:00:00Z' }))
    expect(document.querySelector('article')).toHaveAttribute('data-state', 'paused')
    expect(screen.getByText('Paused by you on Oct 12.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Resume/ }).className).toContain('bg-primary')
  })

  it('paused before pause dates were kept: "Paused by you." with no date', () => {
    card(search({ isActive: false, pausedAt: null }))
    expect(screen.getByText('Paused by you.')).toBeInTheDocument()
  })

  it('on hold for a downgrade: the bar and its reason, "0 slots, needs 3", only View and Delete', () => {
    card(search({ held: true, heldReason: 'downgrade', heldAt: '2026-10-03T13:00:00Z' }))
    expect(screen.getByText('On hold').parentElement).toHaveTextContent(
      'Since Oct 3, when your plan moved to fewer slots.'
    )
    expect(screen.getByText('needs 3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pause|Resume/ })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull()
  })

  it('on hold for a lapse: the date alone until billing gives the cause', () => {
    card(search({ held: true, heldReason: 'lapse', heldAt: '2026-10-03T13:00:00Z' }))
    expect(screen.getByText('On hold').parentElement).toHaveTextContent(/^On holdSince Oct 3\.$/)
  })

  it('shows the refused line, and asks before deleting', () => {
    card(search(), { refused: 'Not paused.' })
    expect(screen.getByRole('status')).toHaveTextContent('Not paused.')
    fireEvent.click(screen.getByRole('button', { name: 'Delete The Amazing Spider-Man #129' }))
    expect(handlers.onAskDelete).toHaveBeenCalled()
  })

  it('keeps the page quality the old card showed, when the search has one', () => {
    card(search({ pageQuality: 'White' }))
    expect(screen.getByText('Pages').nextElementSibling).toHaveTextContent('White')
  })

  it('no alerts at all reads "0 alerts"', () => {
    card(search({ currentAlertCount: 0, archivedAlertCount: 0 }))
    expect(screen.getByText('0 alerts')).toBeInTheDocument()
  })
})

describe('card helpers', () => {
  it('grade words', () => {
    expect(gradeText(9.8, 9.8)).toBe('9.8')
    expect(gradeText(9, 9.4)).toBe('9.0 to 9.4')
    expect(gradeText(null, null)).toBe('Any')
  })

  it('chips: Heritage Auctions by its full name, every shop as "(5)"', () => {
    expect(
      chipsFor(
        { platforms: ['heritage', 'indie:a', 'indie:b', 'indie:c', 'indie:d', 'indie:e'] },
        SHOPS
      )
    ).toEqual(['Heritage Auctions', 'Independent shops (5)'])
    expect(chipsFor({ platforms: ['ebay'] }, SHOPS)).toEqual(['eBay'])
  })

  it('check times in words', () => {
    const now = new Date(2026, 10, 4, 15, 0)
    expect(dayAndTime(new Date(2026, 10, 4, 9, 4).toISOString(), now)).toBe('today at 9:04 AM')
    expect(dayAndTime(new Date(2026, 10, 3, 19, 2).toISOString(), now)).toBe('yesterday at 7:02 PM')
    expect(dayAndTime(new Date(2026, 10, 5, 9, 0).toISOString(), now)).toBe('tomorrow at 9:00 AM')
    expect(dayAndTime(new Date(2026, 9, 12, 9, 4).toISOString(), now)).toBe('Oct 12 at 9:04 AM')
  })
})
