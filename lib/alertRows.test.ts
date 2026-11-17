import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  emptyWords,
  filterAlerts,
  gradeLine,
  marketplaceOptions,
  money,
  nearMissFlag,
  priceText,
  rowName,
  searchDetail,
  subtitle,
  undoRefusal,
  whereLine,
} from './alertRows'

import { makeAlert } from './alertRows.fixture'

// Story 1.96 (U-11): the words on Alerts, against alerts-list.html.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 16, 12, 0))
})
afterEach(() => vi.useRealTimers())

describe('a row', () => {
  it('names the grade with its company and page quality, sentence case', () => {
    expect(gradeLine(makeAlert({ listing: { grade: 9.2, pageQuality: 'White Pages' } }))).toBe('CGC 9.2 · White pages')
    expect(gradeLine(makeAlert({ listing: { grade: 9, gradingAuthority: null } }))).toBe('9.0')
    expect(gradeLine(makeAlert({ listing: { grade: null, gradingAuthority: null } }))).toBe('')
  })

  it('shows the price, with cents only when there are some', () => {
    expect(priceText(makeAlert())).toBe('$5,400')
    expect(money(12.5)).toBe('$12.50')
    expect(money('3950.00')).toBe('$3,950')
    expect(money(Number.NaN)).toBe('Price not listed')
  })

  it('shows when a MyComicShop auction opens in place of its placeholder price', () => {
    const a = makeAlert({ listing: { price: 0, platform: 'mycomicshop', auctionStartTime: new Date(2026, 10, 21, 19, 0).toISOString() } })
    expect(priceText(a)).toBe('Auction opens Sat, Nov 21, 7 PM')
    expect(whereLine(a, 'MyComicShop')).toBe('MyComicShop auction · 2 hours ago · Texted to you')
  })

  it('an auction already open shows its price (review)', () => {
    const a = makeAlert({ listing: { price: 310, platform: 'mycomicshop', auctionStartTime: new Date(2026, 10, 15, 19, 0).toISOString() } })
    expect(priceText(a)).toBe('$310')
  })

  it('says "Texted to you" only when a text was sent (decision 5)', () => {
    expect(whereLine(makeAlert(), 'eBay')).toBe('eBay · 2 hours ago · Texted to you')
    expect(whereLine(makeAlert({ notificationSent: false }), 'eBay')).toBe('eBay · 2 hours ago')
  })

  it('marks only a near miss, from its own stored amounts', () => {
    expect(nearMissFlag(makeAlert())).toBeNull()
    expect(nearMissFlag(makeAlert({ nearMiss: { overBy: 450, maxPrice: 6000 } }))).toBe(
      'Near miss: $450 over your $6,000 maximum'
    )
  })

  it('gives Dismiss a name a screen reader can tell apart', () => {
    expect(rowName(makeAlert())).toBe('Werewolf by Night #32, CGC 9.6, $5,400')
  })
})

describe('the marketplace filter (need 67)', () => {
  const registry = [
    { slug: 'mycomicshop', displayName: 'MyComicShop' },
    { slug: 'indie:comicbookaddiction', displayName: 'Comic Book Addiction' },
    { slug: 'ebay', displayName: 'eBay' },
    { slug: 'heritage', displayName: 'Heritage' },
  ]

  it('names every marketplace, core ones first in their order, then the shops', () => {
    expect(marketplaceOptions(registry, [])).toEqual([
      { slug: 'ebay', label: 'eBay' },
      { slug: 'heritage', label: 'Heritage Auctions' },
      { slug: 'mycomicshop', label: 'MyComicShop' },
      { slug: 'indie:comicbookaddiction', label: 'Comic Book Addiction' },
    ])
  })

  it('keeps a marketplace an alert is on even when the list no longer has it', () => {
    const opts = marketplaceOptions(registry.slice(2), [makeAlert({ listing: { platform: 'indie:brys' } })])
    expect(opts.map((o) => o.slug)).toEqual(['ebay', 'heritage', 'indie:brys'])
  })

  it('filters by marketplace slug and by near miss', () => {
    const list = [
      makeAlert({ id: '1' }),
      makeAlert({ id: '2', nearMiss: { overBy: 1, maxPrice: 2 } }),
      makeAlert({ id: '3', listing: { platform: 'indie:comicbookaddiction' } }),
    ]
    expect(filterAlerts(list, 'indie:comicbookaddiction', 'all').map((a) => a.id)).toEqual(['3'])
    expect(filterAlerts(list, 'all', 'near').map((a) => a.id)).toEqual(['2'])
    expect(filterAlerts(list, 'ebay', 'within').map((a) => a.id)).toEqual(['1'])
  })
})

describe('the subtitle', () => {
  const base = { loading: false, context: false, baseCount: 5, shownCount: 5, searchCount: 3, filtered: false }
  it.each([
    [{ ...base, loading: true }, 'Loading your alerts'],
    [{ ...base, baseCount: 0, shownCount: 0 }, 'Matches from your searches show here'],
    [base, '5 alerts on 3 searches'],
    [{ ...base, shownCount: 1, baseCount: 1, searchCount: 1 }, '1 alert on 1 search'],
    [{ ...base, filtered: true, shownCount: 2 }, '2 of your 5 alerts match the filters'],
    [{ ...base, filtered: true, shownCount: 1 }, '1 of your 5 alerts matches the filters'],
    [{ ...base, filtered: true, shownCount: 0 }, 'None of your 5 alerts match the filters'],
    [{ ...base, filtered: true, baseCount: 1, shownCount: 0 }, 'Your one alert doesn\u2019t match the filters'],
    [{ ...base, filtered: true, baseCount: 1, shownCount: 1 }, 'Your one alert matches the filters'],
    [{ ...base, context: true, shownCount: 3, baseCount: 3 }, '3 alerts for this search'],
    [{ ...base, context: true, filtered: true, shownCount: 0, baseCount: 3 }, '0 alerts for this search'],
  ])('%o reads "%s"', (args, words) => {
    expect(subtitle(args)).toBe(words)
  })
})

describe('the empty state', () => {
  it('nothing at all: promises a text only on a plan with texts (Decision #109)', () => {
    const withTexts = emptyWords({ baseCount: 0, context: false, match: 'all', marketLabel: null, textsIncluded: true })
    expect(withTexts.heading).toBe('No alerts right now')
    expect(withTexts.body).toContain('it shows here, and we text you.')
    expect(withTexts.filteredOut).toBe(false)
    const appOnly = emptyWords({ baseCount: 0, context: true, match: 'all', marketLabel: null, textsIncluded: false })
    expect(appOnly.heading).toBe('No alerts for this search right now')
    expect(appOnly.body).toContain('it shows here. Alerts for listings')
  })

  it('nothing the filters let through: says which, and offers to clear them', () => {
    const w = emptyWords({ baseCount: 4, context: false, match: 'near', marketLabel: 'MyComicShop', textsIncluded: true })
    expect(w).toEqual({
      heading: 'No near misses on MyComicShop',
      body: 'Your other alerts are hidden by the filters.',
      filteredOut: true,
    })
    expect(emptyWords({ baseCount: 4, context: false, match: 'within', marketLabel: null, textsIncluded: true }).heading).toBe(
      'No matches within your price'
    )
  })
})

describe('a search, named', () => {
  it.each([
    [{ gradeMin: 9, gradeMax: 9.4, gradingAuthority: 'cgc', maxPrice: 4500 }, '9.0 to 9.4 · CGC · up to $4,500'],
    [{ gradeMin: 9.8, gradeMax: 9.8, gradingAuthority: 'CGC', maxPrice: 75 }, '9.8 · CGC · up to $75'],
    [{ gradeMin: null, gradeMax: null, gradingAuthority: null, maxPrice: null }, 'Any grade'],
  ])('%o reads "%s"', (search, words) => {
    expect(searchDetail(search)).toBe(words)
  })
})

it('says why Undo was refused', () => {
  expect(undoRefusal('NEWER_ALERT')).toBe('A newer alert for this listing is already in Alerts.')
  expect(undoRefusal('NOT_RESTORABLE')).toBe('That alert couldn’t be brought back.')
})
