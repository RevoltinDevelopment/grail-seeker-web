import { describe, expect, it } from 'vitest'

import type { Copy, TallyBook } from '@/types/report.types'
import {
  allTimeHeadline,
  booksFoundSubtitle,
  booksSearchedRows,
  copyGrade,
  copyGradeAndPrice,
  copyNow,
  copyWhereLine,
  foundRow,
  foundRows,
  keptFromLine,
  lifecycleRows,
  marketplaceName,
  mondayOf,
  pastWeekHeadline,
  pastWeekSummary,
  searchesRunRows,
  seeAllText,
  sinceRange,
  tallyRows,
  thisWeekHeadline,
  weekHasReport,
  weekLabel,
  weekRange,
} from './reportRows'


// Story 1.100 (U-14): the words on Reports, the week page and Books found.
const names = (slug: string) => ({ 'indie:comicbookaddiction': 'Comic Book Addiction' })[slug] ?? slug
const book = (seriesTitle: string, issueNumber: string, issueVolumeText: string | null = null) => ({ seriesTitle, issueNumber, issueVolumeText })
const NOW = new Date('2026-11-18T17:00:00Z')

function copy(over: Partial<Copy> = {}): Copy {
  return {
    alertId: 'a1',
    book: book('Werewolf by Night', '32'),
    marketplace: 'eBay',
    listingUrl: 'https://track.example/1',
    grade: { gradingAuthority: 'CGC', grade: 9.6, pageQuality: null },
    price: 5400,
    priceIsPlaceholder: false,
    nearMiss: false,
    foundAt: '2026-11-17T14:05:00Z',
    priceChange: null,
    now: { listingStatus: 'active', archiveReason: null, archivedAt: null },
    alerts: 1,
    ...over,
  }
}

describe('weeks', () => {
  it('names the real days, Monday to Sunday, in UTC', () => {
    expect(weekRange('2026-11-16')).toBe('Monday, Nov 16 to Sunday, Nov 22, 2026')
    expect(weekRange('2026-11-09', false)).toBe('Monday, Nov 9 to Sunday, Nov 15')
    expect(weekRange('2026-12-28')).toBe('Monday, Dec 28 to Sunday, Jan 3, 2027')
    expect(weekLabel('2026-11-09')).toBe('Week of November 9, 2026')
  })

  it('finds the Monday the server keys a week by', () => {
    expect(mondayOf(new Date('2026-11-18T17:00:00Z'))).toBe('2026-11-16')
    expect(mondayOf(new Date('2026-11-22T23:59:00Z'))).toBe('2026-11-16') // Sunday
    expect(mondayOf(new Date('2026-11-23T00:00:00Z'))).toBe('2026-11-23')
  })

  it('a week page has a report only for a past Monday not before the account was made', () => {
    expect(weekHasReport('2026-11-09', null, NOW)).toBe(true)
    expect(weekHasReport('2026-11-16', null, NOW)).toBe(false) // this week
    expect(weekHasReport('2026-11-23', null, NOW)).toBe(false)
    expect(weekHasReport('2026-11-10', null, NOW)).toBe(false) // a Tuesday
    expect(weekHasReport('2026-13-01', null, NOW)).toBe(false)
    expect(weekHasReport('garbage', null, NOW)).toBe(false)
    expect(weekHasReport('2026-08-03', '2026-08-12T15:00:00Z', NOW)).toBe(false) // before joining
    expect(weekHasReport('2026-08-10', '2026-08-12T15:00:00Z', NOW)).toBe(true) // the week of joining
  })

  it('"From" and "kept from" dates; the later of the two; nothing when unknown', () => {
    expect(sinceRange('2026-08-12T15:00:00Z')).toBe('From Aug 12, 2026')
    expect(sinceRange(null)).toBeNull()
    expect(keptFromLine('2026-07-01', '2026-08-12T15:00:00Z')).toBe('Search counts are kept from August 12, 2026.')
    expect(keptFromLine('2026-09-01', '2026-08-12T15:00:00Z')).toBe('Search counts are kept from September 1, 2026.')
    expect(keptFromLine('2026-09-01', null)).toBe('Search counts are kept from September 1, 2026.')
    expect(keptFromLine(null, null)).toBeNull()
  })
})

describe('headlines', () => {
  it('this week: copies, then searches, then the first week or a quiet Monday', () => {
    expect(thisWeekHeadline({ copies: 3, searchesRun: 294, firstWeek: false })).toEqual({ headline: 'We found 3 books for you this week.', quiet: '' })
    expect(thisWeekHeadline({ copies: 1, searchesRun: 2, firstWeek: false }).headline).toBe('We found 1 book for you this week.')
    expect(thisWeekHeadline({ copies: 0, searchesRun: 294, firstWeek: false })).toEqual({ headline: 'We ran 294 searches for you this week.', quiet: 'Nothing has matched yet.' })
    expect(thisWeekHeadline({ copies: 0, searchesRun: 0, firstWeek: true })).toEqual({ headline: 'Your first report fills in as your searches run.', quiet: 'Every search is checked twice a day.' })
    expect(thisWeekHeadline({ copies: 0, searchesRun: 0, firstWeek: false })).toEqual({ headline: 'This week’s report fills in as your searches run.', quiet: 'Every search is checked twice a day.' })
  })

  it('alerts on copies found in an earlier week are not "nothing" (review)', () => {
    expect(thisWeekHeadline({ copies: 0, searchesRun: 294, firstWeek: false, alerts: 1 }).quiet).toBe('')
    expect(pastWeekHeadline({ copies: 0, searchesRun: 294, alerts: 1 }).quiet).toBe('')
    expect(pastWeekHeadline({ copies: 0, searchesRun: 0, alerts: 3 }).headline).toBe('Search counts weren’t kept that week.')
  })

  it('a past week, and since you joined', () => {
    expect(pastWeekHeadline({ copies: 2, searchesRun: 294 }).headline).toBe('We found 2 books for you that week.')
    expect(pastWeekHeadline({ copies: 0, searchesRun: 294 })).toEqual({ headline: 'We ran 294 searches for you that week.', quiet: 'Nothing matched.' })
    expect(pastWeekHeadline({ copies: 0, searchesRun: 0 })).toEqual({ headline: 'No searches ran that week.', quiet: '' })
    expect(allTimeHeadline({ copies: 9, searchesRun: 3000 }).headline).toBe('We found 9 books for you since you joined.')
    expect(allTimeHeadline({ copies: 0, searchesRun: 0 })).toEqual({ headline: 'Nothing has run yet.', quiet: 'Your first check is at the next round.' })
    expect(allTimeHeadline({ copies: 0, searchesRun: 1200 })).toEqual({ headline: 'We ran 1,200 searches for you since you joined.', quiet: 'Nothing has matched yet.' })
  })
})

describe('rows', () => {
  it('books searched in reading order, numbers as numbers, deleted marked', () => {
    expect(
      booksSearchedRows([
        { ...book('X-Men', '94') },
        { ...book('Daredevil', '158'), searchDeleted: true },
        { ...book('X-Men', '101') },
        { ...book('The Amazing Spider-Man', '129') },
      ])
    ).toEqual([
      { t: 'Daredevil #158', note: '(search deleted)' },
      { t: 'The Amazing Spider-Man #129', note: '' },
      { t: 'X-Men #94', note: '' },
      { t: 'X-Men #101', note: '' },
    ])
  })

  it('searches run: display order, Heritage as the subscriber reads it, shops by name, none at zero', () => {
    expect(
      searchesRunRows({ MyComicShop: 84, 'indie:comicbookaddiction': 42, Heritage: 84, eBay: 1200, 'indie:other': 0 }, names)
    ).toEqual([
      { k: 'eBay', v: '1,200' },
      { k: 'Heritage Auctions', v: '84' },
      { k: 'MyComicShop', v: '84' },
      { k: 'Comic Book Addiction', v: '42' },
    ])
    expect(marketplaceName('heritage', names)).toBe('Heritage Auctions')
    expect(marketplaceName('Heritage', names)).toBe('Heritage Auctions')
  })

  it('a copy found links straight to its listing, whatever its state (Story 1.103)', () => {
    expect(foundRow(copy(), names, NOW)).toEqual({ key: 'a1', text: 'Werewolf by Night #32 · CGC 9.6', go: 'View on eBay', href: 'https://track.example/1' })
    expect(foundRow(copy({ now: { listingStatus: 'archived_expired', archiveReason: 'listing_sold', archivedAt: '2026-11-12T14:00:00Z' } }), names, NOW)).toMatchObject({
      go: 'Sold Nov 12',
      href: 'https://track.example/1',
    })
    // Nothing to open: removed by the seller, or no link
    expect(foundRow(copy({ now: { listingStatus: 'archived_expired', archiveReason: 'listing_removed', archivedAt: '2026-11-13T14:00:00Z' } }), names, NOW)).toMatchObject({
      go: 'Removed Nov 13',
      href: null,
    })
    expect(foundRow(copy({ listingUrl: null }), names, NOW)).toMatchObject({ go: 'Active', href: null })
    expect(foundRow(copy({ listingUrl: 'javascript:alert(1)' }), names, NOW).href).toBeNull() // only web addresses (review)
    expect(foundRow(copy({ listingUrl: '' }), names, NOW).href).toBeNull()
    expect(foundRow(copy({ marketplace: 'heritage' }), names).go).toBe('View on Heritage Auctions')
    expect(foundRow(copy({ grade: { gradingAuthority: null, grade: 9, pageQuality: null } }), names).text).toBe('Werewolf by Night #32 · Raw 9.0')
  })

  it('copies found, newest first', () => {
    const rows = foundRows([copy({ alertId: 'old', foundAt: '2026-11-16T14:00:00Z' }), copy({ alertId: 'new', foundAt: '2026-11-17T09:00:00.000+00:00' })], names)
    expect(rows.map((r) => r.key)).toEqual(['new', 'old'])
  })

  it('your searches and alerts: every row with zeros; a week shows "Searches deleted" only above 0', () => {
    const r = { activeSearches: 6, searchesCreated: 1, searchesDeleted: 0, alertsArchived: 1, alertsDismissed: 0 }
    expect(lifecycleRows(r, 'week')).toEqual([
      { k: 'Searches running', v: '6' },
      { k: 'Searches created', v: '1' },
      { k: 'Alerts archived: sold, ended or replaced', v: '1' },
      { k: 'Alerts you dismissed', v: '0' },
    ])
    expect(lifecycleRows({ ...r, searchesDeleted: 2 }, 'week').map((x) => x.k)).toContain('Searches deleted')
    expect(lifecycleRows({ ...r, activeSearches: undefined }, 'allTime').map((x) => x.k)).toEqual([
      'Searches created',
      'Searches deleted',
      'Alerts archived: sold, ended or replaced',
      'Alerts you dismissed',
    ])
  })

  it('past weeks: searches and alerts, singular and none', () => {
    expect(pastWeekSummary({ weekStart: '2026-11-09', totalSearchesRun: 294, alertsIssued: 2 })).toBe('294 searches · 2 alerts')
    expect(pastWeekSummary({ weekStart: '2026-11-09', totalSearchesRun: 280, alertsIssued: 0 })).toBe('280 searches · no alerts')
    expect(pastWeekSummary({ weekStart: '2026-11-09', totalSearchesRun: 1, alertsIssued: 1 })).toBe('1 search · 1 alert')
  })
})

describe('the tally', () => {
  it('the first eight books, then the rest counted', () => {
    const tb = (i: number, copies: number): TallyBook => ({ ...book(`Book ${i}`, '1'), searchDeleted: false, copies })
    const eight = Array.from({ length: 8 }, (_, i) => tb(i, 2))
    expect(tallyRows(eight).more).toBeNull()
    const long = [...eight, tb(8, 3), tb(9, 1), tb(10, 1)]
    const { rows, more } = tallyRows(long)
    expect(rows).toHaveLength(8)
    expect(rows[0]).toMatchObject({ t: 'Book 0 #1', n: '2', nLabel: '2 copies found' })
    expect(more).toBe('And 5 more copies of 3 other books.')
    expect(tallyRows([...eight, tb(8, 1)]).more).toBe('And 1 more copy of 1 other book.')
    expect(tallyRows([tb(0, 1)]).rows[0].nLabel).toBe('1 copy found')
    expect(tallyRows([tb(0, 121)]).rows[0]).not.toHaveProperty('gr') // no grades (Mahan, 2026-11-18)
  })

  it('the link to Books found', () => {
    expect(seeAllText(9)).toBe('See all 9 books found, with prices and where each is now')
    expect(seeAllText(1)).toBe('See the book found, with its price and where it is now')
  })
})

describe('Books found', () => {
  it('the subtitle', () => {
    expect(booksFoundSubtitle(41, 11, '2026-03-03T15:00:00Z')).toBe('41 copies of 11 books, since Mar 3, 2026')
    expect(booksFoundSubtitle(1, 1, null)).toBe('1 copy of 1 book')
  })

  it('grade with page quality, and the price unless it is a placeholder', () => {
    expect(copyGradeAndPrice(copy({ grade: { gradingAuthority: 'cgc', grade: 9.2, pageQuality: 'White Pages' }, price: 3950 }))).toEqual({
      grade: 'CGC 9.2 · White pages',
      price: '$3,950',
    })
    expect(copyGradeAndPrice(copy({ priceIsPlaceholder: true })).price).toBeNull()
    expect(copyGradeAndPrice(copy({ priceIsPlaceholder: true, grade: { gradingAuthority: null, grade: null, pageQuality: null } })).grade).toBe('Grade not listed')
    expect(copyGrade({ gradingAuthority: null, grade: 8, pageQuality: 'Off-white' }, true)).toBe('Raw 8.0 · Off-white')
    expect(copyGrade({ gradingAuthority: 'CGC', grade: null, pageQuality: null })).toBe('')
  })

  it('where and when: found, a price change, a near miss, an auction', () => {
    expect(copyWhereLine(copy({ foundAt: '2026-10-25T14:00:00Z' }), names, NOW)).toBe('eBay · found Oct 25')
    expect(
      copyWhereLine(copy({ foundAt: '2026-10-25T14:00:00Z', priceChange: { direction: 'dropped', at: '2026-10-27T14:00:00Z' } }), names, NOW)
    ).toBe('eBay · found Oct 25, price dropped Oct 27')
    expect(copyWhereLine(copy({ foundAt: '2026-10-20T14:00:00Z', nearMiss: true, priceChange: { direction: 'rose', at: '2026-10-21T14:00:00Z' } }), names, NOW)).toBe(
      'eBay · found Oct 20, price rose Oct 21 · near miss'
    )
    expect(copyWhereLine(copy({ marketplace: 'MyComicShop', priceIsPlaceholder: true, foundAt: '2026-10-02T14:00:00Z' }), names, NOW)).toBe(
      'MyComicShop auction · found Oct 2'
    )
    expect(copyWhereLine(copy({ foundAt: '2025-12-02T14:00:00Z' }), names, NOW)).toBe('eBay · found Dec 2, 2025')
  })

  it('where each copy is now, for every reason the server records', () => {
    const at = (archiveReason: string | null, archivedAt: string | null = '2026-10-24T14:00:00Z') =>
      copyNow(copy({ now: { listingStatus: 'archived_expired', archiveReason, archivedAt } }), names, NOW)
    expect(copyNow(copy(), names, NOW)).toEqual({ text: 'View on eBay', href: 'https://track.example/1' })
    expect(at('listing_sold')).toEqual({ text: 'Sold Oct 24', href: 'https://track.example/1' })
    expect(at('search_deleted').href).toBe('https://track.example/1')
    expect(at('listing_removed').href).toBeNull()
    expect(at('listing_ended').text).toBe('Ended Oct 24')
    expect(at('listing_removed').text).toBe('Removed Oct 24')
    expect(at('user_dismissed').text).toBe('Dismissed Oct 24')
    expect(at('superseded').text).toBe('Replaced Oct 24')
    expect(at('search_deleted').text).toBe('Search deleted Oct 24')
    expect(at('something_new').text).toBe('Archived Oct 24')
    expect(at('listing_sold', null).text).toBe('Sold')
  })
})
