import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { archiveDate, archiveReason, archiveSubtitle, archiveWhereLine } from './alertRows'
import { makeAlert } from './alertRows.fixture'

// Story 1.98 (U-12): the archive's words, against alerts-archive.html.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 17, 12, 0))
})
afterEach(() => vi.useRealTimers())

const archived = (archiveReason: string | null, over: Parameters<typeof makeAlert>[0] = {}) =>
  makeAlert({
    listingStatus: archiveReason === 'user_dismissed' || archiveReason === 'search_deleted' ? 'archived_dismissed' : 'archived_expired',
    archiveReason,
    archivedAt: new Date(2026, 9, 24, 15, 0).toISOString(),
    ...over,
  })

describe('dates', () => {
  it('"Oct 24" this year, with the year otherwise; nothing when unknown', () => {
    expect(archiveDate(new Date(2026, 9, 24).toISOString())).toBe('Oct 24')
    expect(archiveDate(new Date(2025, 11, 3).toISOString())).toBe('Dec 3, 2025')
    expect(archiveDate(null)).toBeNull()
    expect(archiveDate('not a date')).toBeNull()
  })

  it('where it was found and when: "eBay · alert Oct 20"; an auction says so', () => {
    const a = archived('listing_sold', { createdAt: new Date(2026, 9, 20, 9).toISOString() })
    expect(archiveWhereLine(a, 'eBay')).toBe('eBay · alert Oct 20')
    const auction = archived('listing_ended', {
      createdAt: new Date(2026, 9, 2, 9).toISOString(),
      listing: { auctionStartTime: new Date(2026, 9, 1).toISOString() },
    })
    expect(archiveWhereLine(auction, 'MyComicShop')).toBe('MyComicShop auction · alert Oct 2')
  })
})

describe('why it is archived, with the right link', () => {
  it('sold: the sold listing', () => {
    expect(archiveReason(archived('listing_sold'), 'eBay')).toEqual({
      icon: 'sold',
      text: 'Sold · Oct 24',
      action: { kind: 'listing', label: 'See the sold listing', href: 'https://example.test/item' },
    })
  })

  it('ended: the ended listing', () => {
    expect(archiveReason(archived('listing_ended'), 'MyComicShop')).toEqual({
      icon: 'ended',
      text: 'Listing ended · Oct 24',
      action: { kind: 'listing', label: 'See the ended listing', href: 'https://example.test/item' },
    })
  })

  it('removed by the seller: nothing to view, no button', () => {
    expect(archiveReason(archived('listing_removed'), 'eBay')).toEqual({
      icon: 'removed',
      text: 'Removed by the seller on Oct 24, so there is nothing to view',
      action: null,
    })
    expect(archiveReason(archived('listing_removed', { archivedAt: null }), 'eBay').text).toBe(
      'Removed by the seller, so there is nothing to view'
    )
  })

  it('dismissed: the listing, by the marketplace’s name', () => {
    expect(archiveReason(archived('user_dismissed'), 'Comic Book Addiction')).toEqual({
      icon: 'dismissed',
      text: 'Dismissed by you · Oct 24',
      action: { kind: 'listing', label: 'View on Comic Book Addiction', href: 'https://example.test/item' },
    })
  })

  it('archived when its search was deleted (not drawn; words for Mahan)', () => {
    expect(archiveReason(archived('search_deleted'), 'eBay')).toEqual({
      icon: 'dismissed',
      text: 'Archived when you deleted this search · Oct 24',
      action: { kind: 'listing', label: 'View on eBay', href: 'https://example.test/item' },
    })
  })

  it('replaced: says how the price changed and links to the newer alert where it is now', () => {
    const dropped = archived('superseded', {
      listing: { price: 3300 },
      supersededBy: { id: 'n1', listingStatus: 'active', price: 3100, searchId: 's 2' },
    })
    expect(archiveReason(dropped, 'eBay')).toEqual({
      icon: 'replaced',
      text: 'Replaced by a newer alert on Oct 24, when the price dropped to $3,100',
      action: { kind: 'page', label: 'See the newer alert', href: '/alerts?search=s%202' },
    })
    const rose = archived('superseded', {
      listing: { price: 3300 },
      supersededBy: { id: 'n1', listingStatus: 'archived_expired', price: 3450.5, searchId: 's2' },
    })
    expect(archiveReason(rose, 'eBay')).toMatchObject({
      text: 'Replaced by a newer alert on Oct 24, when the price rose to $3,450.50',
      action: { href: '/alerts/archive?search=s2' },
    })
  })

  it('replaced, against an older server or with the same price: no price clause; no newer alert, no button', () => {
    const older = archived('superseded', { supersededBy: { id: 'n1', listingStatus: 'active' } })
    expect(archiveReason(older, 'eBay')).toMatchObject({
      text: 'Replaced by a newer alert on Oct 24',
      action: { href: '/alerts' },
    })
    const same = archived('superseded', { supersededBy: { id: 'n1', listingStatus: 'active', price: 5400, searchId: 's1' } })
    expect(archiveReason(same, 'eBay').text).toBe('Replaced by a newer alert on Oct 24')
    const gone = archived('superseded', { supersededBy: null })
    expect(archiveReason(gone, 'eBay')).toMatchObject({ action: null })
  })

  it('a MyComicShop auction’s placeholder price is never compared (review)', () => {
    const oldAuction = archived('superseded', {
      listing: { price: 0, auctionStartTime: new Date(2026, 9, 1).toISOString() },
      supersededBy: { id: 'n1', listingStatus: 'active', price: 45, searchId: 's1' },
    })
    expect(archiveReason(oldAuction, 'MyComicShop').text).toBe('Replaced by a newer alert on Oct 24')
    const newerPlaceholder = archived('superseded', {
      listing: { price: 300 },
      supersededBy: { id: 'n1', listingStatus: 'active', price: 0, searchId: 's1' },
    })
    expect(archiveReason(newerPlaceholder, 'MyComicShop').text).toBe('Replaced by a newer alert on Oct 24')
  })

  it('a reason the page does not know still reads honestly; a listing with no link gets no button', () => {
    expect(archiveReason(archived('something_new'), 'eBay')).toMatchObject({ icon: 'ended', text: 'Archived · Oct 24' })
    expect(archiveReason(archived('listing_sold', { listing: { url: null } }), 'eBay').action).toBeNull()
  })
})

describe('the subtitle', () => {
  const base = { loading: false, context: false, filtered: false, allCount: 12 }
  it('as drawn', () => {
    expect(archiveSubtitle({ ...base, loading: true, shownCount: 0 })).toBe('Loading your archive')
    expect(archiveSubtitle({ ...base, shownCount: 12 })).toBe('12 archived alerts')
    expect(archiveSubtitle({ ...base, shownCount: 1, allCount: 1 })).toBe('1 archived alert')
    expect(archiveSubtitle({ ...base, shownCount: 0, allCount: 0 })).toBe('Alerts for listings that sold or ended, and ones you dismissed')
    expect(archiveSubtitle({ ...base, context: true, shownCount: 4 })).toBe('4 archived alerts for this search')
    expect(archiveSubtitle({ ...base, filtered: true, shownCount: 3 })).toBe('3 of your 12 archived alerts match the filters')
    expect(archiveSubtitle({ ...base, filtered: true, shownCount: 1 })).toBe('1 of your 12 archived alerts matches the filters')
    expect(archiveSubtitle({ ...base, filtered: true, shownCount: 0 })).toBe('None of your 12 archived alerts match the filters')
    expect(archiveSubtitle({ ...base, filtered: true, shownCount: 0, allCount: 1 })).toBe('Your one archived alert doesn’t match the filters')
    expect(archiveSubtitle({ ...base, filtered: true, shownCount: 2, allCount: null })).toBe('2 archived alerts match the filters')
    // two reads disagreeing for a moment never say "5 of your 3" (review)
    expect(archiveSubtitle({ ...base, filtered: true, shownCount: 5, allCount: 3 })).toBe('5 archived alerts match the filters')
  })
})
