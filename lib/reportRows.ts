/**
 * Story 1.100 (U-14): the words on Reports, the week page and Books found, as drawn in
 * reports-overview.html, reports-week.html and reports-books-found.html (UX plan section 17).
 * Pure, so every state is tested here; the pages only render what these return.
 *
 * Decision #110: a "book found" is a copy, one listing found for one book. Decision #109: nothing
 * here states a fact the server does not give. Weeks run Monday to Sunday in UTC, as the server keys
 * them, and the pages say so (the design drew Sunday to Saturday).
 */
import { archiveDate, money, slabText } from '@/lib/alertRows'
import { resolveMarketplaceNames, sortMarketplaceEntries } from '@/lib/constants/marketplaceDisplayOrder'
import { CORE_MARKETPLACES } from '@/lib/marketplaceNames'
import { formatGrade, formatIssueNumber } from '@/lib/utils/series-formatter'

import type { Book, BookSearched, Copy, PastWeekSummary, TallyBook } from '@/types/report.types'

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`

// ── Dates ────────────────────────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** A "YYYY-MM-DD" day as a UTC date; null when malformed or not a real day. */
function utcDay(day: string): Date | null {
  if (!DATE_ONLY.test(day)) return null
  const d = new Date(`${day}T00:00:00Z`)
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === day ? d : null
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions, utc: boolean) =>
  d.toLocaleDateString('en-US', { ...opts, ...(utc ? { timeZone: 'UTC' } : {}) })

/** "Monday, Nov 16 to Sunday, Nov 22, 2026" (the year left off when `withYear` is false). */
export function weekRange(weekStart: string, withYear = true): string {
  const start = utcDay(weekStart)
  if (!start) return ''
  const end = new Date(start.getTime() + 6 * DAY_MS)
  const day = (d: Date) => fmt(d, { weekday: 'long', month: 'short', day: 'numeric' }, true)
  return `${day(start)} to ${day(end)}${withYear ? `, ${end.getUTCFullYear()}` : ''}`
}

/** "Week of November 9, 2026" (the Monday). */
export function weekLabel(weekStart: string): string {
  const start = utcDay(weekStart)
  return start ? `Week of ${fmt(start, { month: 'long', day: 'numeric', year: 'numeric' }, true)}` : 'Week'
}

/** The Monday (UTC) of the week holding `at`, as "YYYY-MM-DD", the way the server keys weeks. */
export function mondayOf(at: Date): string {
  const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()))
  const back = (d.getUTCDay() + 6) % 7 // Monday 0 ... Sunday 6
  return new Date(d.getTime() - back * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Whether a week page can have a report, without asking the server: a real Monday, before the
 * current week, and not before the week the account was made (when that is known).
 */
export function weekHasReport(weekStart: string, joinedAt: string | null | undefined, now: Date = new Date()): boolean {
  const start = utcDay(weekStart)
  if (!start || start.getUTCDay() !== 1) return false
  if (weekStart >= mondayOf(now)) return false
  if (joinedAt) {
    const joined = new Date(joinedAt)
    if (Number.isFinite(joined.getTime()) && weekStart < mondayOf(joined)) return false
  }
  return true
}

/** A date the server gives: "YYYY-MM-DD" read as that day; a timestamp in the subscriber's own time. */
function dateOf(value: string): Date | null {
  const d = DATE_ONLY.test(value) ? utcDay(value) : new Date(value)
  return d && Number.isFinite(d.getTime()) ? d : null
}

/** "Aug 12, 2026"; null when unknown. */
function shortDate(value: string | null | undefined): string | null {
  if (!value) return null
  const d = dateOf(value)
  return d ? fmt(d, { month: 'short', day: 'numeric', year: 'numeric' }, DATE_ONLY.test(value)) : null
}

/** "From Aug 12, 2026" under "Since you joined"; null when the join date is unknown (left out). */
export function sinceRange(joinedAt: string | null | undefined): string | null {
  const d = shortDate(joinedAt)
  return d ? `From ${d}` : null
}

/** The foot: "Search counts are kept from August 12, 2026." (the later of the two dates). */
export function keptFromLine(trackingSince: string | null | undefined, joinedAt: string | null | undefined): string | null {
  const dates = [trackingSince, joinedAt].map((v) => (v ? { v, d: dateOf(v) } : null)).filter((x) => x && x.d) as {
    v: string
    d: Date
  }[]
  if (dates.length === 0) return null
  const later = dates.reduce((a, b) => (b.d.getTime() > a.d.getTime() ? b : a))
  return `Search counts are kept from ${fmt(later.d, { month: 'long', day: 'numeric', year: 'numeric' }, DATE_ONLY.test(later.v))}.`
}

// ── Books and marketplaces ───────────────────────────────────────────────────────────────────────

/** "The Amazing Spider-Man #129". */
export function bookName(book: Book): string {
  return `${book.seriesTitle} ${formatIssueNumber(book.issueNumber, book.issueVolumeText)}`
}

const collate = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })

/** Reading order, as the server's `compareBooks`: title, volume, issue, numbers as numbers. */
export function compareBooks(x: Book, y: Book): number {
  return (
    collate(x.seriesTitle, y.seriesTitle) ||
    collate(x.issueVolumeText ?? '', y.issueVolumeText ?? '') ||
    collate(x.issueNumber, y.issueNumber)
  )
}

/** Books searched, each once, in reading order; "(search deleted)" after one whose searches are all deleted. */
export function booksSearchedRows(books: readonly BookSearched[] | undefined): { t: string; note: string }[] {
  return [...(books ?? [])]
    .sort(compareBooks)
    .map((b) => ({ t: bookName(b), note: b.searchDeleted ? '(search deleted)' : '' }))
}

/** The name a subscriber reads for a marketplace: ours for a core one ("Heritage Auctions"), else the registry's. */
export function marketplaceName(raw: string, displayNameFor: (slug: string) => string): string {
  const core = CORE_MARKETPLACES.find((m) => m.slug === String(raw).toLowerCase())
  return core ? core.label : displayNameFor(raw)
}

/** Searches run: one row per marketplace with runs, in display order, as the subscriber names them. */
export function searchesRunRows(
  counts: Record<string, number> | undefined | null,
  displayNameFor: (slug: string) => string
): { k: string; v: string }[] {
  return sortMarketplaceEntries(resolveMarketplaceNames(counts, displayNameFor))
    .filter(([, n]) => n > 0)
    .map(([name, n]) => ({ k: marketplaceName(name, (s) => s), v: n.toLocaleString('en-US') }))
}

/** A copy's grade in a row: "CGC 9.6"; a copy with no company "Raw 9.0"; "" with no grade. */
export function copyGrade(grade: Copy['grade'], withPages = false): string {
  if (grade.grade == null || grade.grade === 0) return ''
  if (!grade.gradingAuthority) {
    const pages = withPages ? slabText({ grade: null, pageQuality: grade.pageQuality }) : ''
    return [`Raw ${formatGrade(grade.grade)}`, pages].filter(Boolean).join(' · ')
  }
  return slabText({
    grade: grade.grade,
    gradingAuthority: grade.gradingAuthority,
    pageQuality: withPages ? grade.pageQuality : null,
  })
}

// ── The cards ────────────────────────────────────────────────────────────────────────────────────

export interface Headline {
  headline: string
  quiet: string
}

/** This week's headline. `firstWeek`: the account was made this week (or that is unknown and it has no past weeks). */
export function thisWeekHeadline(args: { copies: number; searchesRun: number; firstWeek: boolean; alerts?: number }): Headline {
  const { copies, searchesRun, firstWeek, alerts = 0 } = args
  if (copies > 0) return { headline: `We found ${plural(copies, 'book', 'books')} for you this week.`, quiet: '' }
  // An alert this week on a copy first found earlier (a price change, say) is not "nothing" (review)
  if (searchesRun > 0) {
    return { headline: `We ran ${plural(searchesRun, 'search', 'searches')} for you this week.`, quiet: alerts > 0 ? '' : 'Nothing has matched yet.' }
  }
  return firstWeek
    ? { headline: 'Your first report fills in as your searches run.', quiet: 'Every search is checked twice a day.' }
    : { headline: 'This week’s report fills in as your searches run.', quiet: 'Every search is checked twice a day.' }
}

/** A past week's headline (the design's "Every search was paused or on hold" is left out: the server cannot say why). */
export function pastWeekHeadline(args: { copies: number; searchesRun: number; alerts?: number }): Headline {
  const { copies, searchesRun, alerts = 0 } = args
  if (copies > 0) return { headline: `We found ${plural(copies, 'book', 'books')} for you that week.`, quiet: '' }
  // Alerts on copies first found in an earlier week: searches ran and something matched (review)
  if (searchesRun > 0) return { headline: `We ran ${plural(searchesRun, 'search', 'searches')} for you that week.`, quiet: alerts > 0 ? '' : 'Nothing matched.' }
  // Alerts with no search counts: a week before counts were kept
  if (alerts > 0) return { headline: 'Search counts weren\u2019t kept that week.', quiet: '' }
  return { headline: 'No searches ran that week.', quiet: '' }
}

/** "Since you joined": copies found; nothing run yet; or searches ran and nothing matched. */
export function allTimeHeadline(args: { copies: number; searchesRun: number }): Headline {
  const { copies, searchesRun } = args
  if (copies > 0) return { headline: `We found ${plural(copies, 'book', 'books')} for you since you joined.`, quiet: '' }
  if (searchesRun > 0) return { headline: `We ran ${plural(searchesRun, 'search', 'searches')} for you since you joined.`, quiet: 'Nothing has matched yet.' }
  return { headline: 'Nothing has run yet.', quiet: 'Your first check is at the next round.' }
}

export interface FoundRow {
  key: string
  text: string
  go: string
  href: string
  /** The listing itself, opened in a new tab */
  external: boolean
}

/**
 * A copy under a week's "Books found": "Werewolf by Night #32 · CGC 9.6", with "View on eBay" while
 * the listing is active, "In Alerts" for an active copy with no link, "In the archive" otherwise.
 */
export function foundRow(copy: Copy, displayNameFor: (slug: string) => string): FoundRow {
  const text = [bookName(copy.book), copyGrade(copy.grade)].filter(Boolean).join(' · ')
  const active = copy.now.listingStatus === 'active'
  if (active && copy.listingUrl) {
    return { key: copy.alertId, text, go: `View on ${marketplaceName(copy.marketplace, displayNameFor)}`, href: copy.listingUrl, external: true }
  }
  if (active) return { key: copy.alertId, text, go: 'In Alerts', href: '/alerts', external: false }
  return { key: copy.alertId, text, go: 'In the archive', href: '/alerts/archive', external: false }
}

/** Copies under a week's "Books found", newest find first. */
export function foundRows(copies: readonly Copy[] | undefined, displayNameFor: (slug: string) => string): FoundRow[] {
  return [...(copies ?? [])]
    .sort((x, y) => Date.parse(y.foundAt) - Date.parse(x.foundAt))
    .map((c) => foundRow(c, displayNameFor))
}

/** "Your searches and alerts". Every row shown, zeros included; "Searches deleted" in a week only when above 0. */
export function lifecycleRows(
  r: {
    activeSearches?: number
    searchesCreated: number
    searchesDeleted: number
    alertsArchived: number
    alertsDismissed: number
  },
  scope: 'week' | 'allTime'
): { k: string; v: string }[] {
  const rows: { k: string; v: number }[] = []
  if (scope === 'week' && r.activeSearches !== undefined) rows.push({ k: 'Searches running', v: r.activeSearches })
  rows.push({ k: 'Searches created', v: r.searchesCreated })
  if (scope === 'allTime' || r.searchesDeleted > 0) rows.push({ k: 'Searches deleted', v: r.searchesDeleted })
  rows.push({ k: 'Alerts archived: sold, ended or replaced', v: r.alertsArchived })
  rows.push({ k: 'Alerts you dismissed', v: r.alertsDismissed })
  return rows.map((x) => ({ k: x.k, v: x.v.toLocaleString('en-US') }))
}

// ── The tally ────────────────────────────────────────────────────────────────────────────────────

export const TALLY_SHOWN = 8

export interface TallyRow {
  key: string
  t: string
  n: string
  /** "121 copies found" */
  nLabel: string
}

/**
 * The first eight books of the tally, each with how many copies were found, and "And 5 more copies
 * of 3 other books." when there are more. No grades: one book can have a hundred copies, and Books
 * found gives each one (Mahan, 2026-11-18).
 */
export function tallyRows(tally: readonly TallyBook[] | undefined): { rows: TallyRow[]; more: string | null } {
  const all = tally ?? []
  const rows = all.slice(0, TALLY_SHOWN).map((b, i) => ({
    key: `${i}|${b.seriesTitle}|${b.issueVolumeText ?? ''}|${b.issueNumber}`,
    t: bookName(b),
    n: b.copies.toLocaleString('en-US'),
    nLabel: plural(b.copies, 'copy found', 'copies found'),
  }))
  const rest = all.slice(TALLY_SHOWN)
  if (rest.length === 0) return { rows, more: null }
  const copies = rest.reduce((sum, b) => sum + b.copies, 0)
  return { rows, more: `And ${plural(copies, 'more copy', 'more copies')} of ${plural(rest.length, 'other book', 'other books')}.` }
}

/** The link to Books found. */
export function seeAllText(copies: number): string {
  return copies === 1
    ? 'See the book found, with its price and where it is now'
    : `See all ${copies.toLocaleString('en-US')} books found, with prices and where each is now`
}

// ── Past weeks ───────────────────────────────────────────────────────────────────────────────────

/** "294 searches · 2 alerts" / "· no alerts" / "· 1 alert" (alerts stay the unit here, Decision #110). */
export function pastWeekSummary(w: PastWeekSummary): string {
  const alerts = w.alertsIssued === 0 ? 'no alerts' : plural(w.alertsIssued, 'alert', 'alerts')
  return `${plural(w.totalSearchesRun, 'search', 'searches')} · ${alerts}`
}

// ── Books found ──────────────────────────────────────────────────────────────────────────────────

/** "41 copies of 11 books, since Mar 3, 2026"; without a join date, no "since". */
export function booksFoundSubtitle(copies: number, books: number, joinedAt: string | null | undefined): string {
  const since = shortDate(joinedAt)
  return `${plural(copies, 'copy', 'copies')} of ${plural(books, 'book', 'books')}${since ? `, since ${since}` : ''}`
}

/** A copy's grade and price: "CGC 9.2 · White pages" and "$3,950"; a placeholder price shows none. */
export function copyGradeAndPrice(copy: Copy): { grade: string; price: string | null } {
  const price = copy.priceIsPlaceholder ? null : money(copy.price)
  const grade = copyGrade(copy.grade, true)
  // Never an empty first line (review): a copy with neither a grade nor a price says so
  return { grade: grade || (price ? '' : 'Grade not listed'), price }
}

/** "eBay · found Oct 25, price dropped Oct 27 · near miss"; a MyComicShop auction "MyComicShop auction · found Oct 2". */
export function copyWhereLine(copy: Copy, displayNameFor: (slug: string) => string, now: Date = new Date()): string {
  const label = marketplaceName(copy.marketplace, displayNameFor)
  const where = copy.priceIsPlaceholder ? `${label} auction` : label
  const found = archiveDate(copy.foundAt, now)
  let line = found ? `${where} · found ${found}` : where
  if (copy.priceChange) {
    const at = archiveDate(copy.priceChange.at, now)
    line += `, price ${copy.priceChange.direction === 'dropped' ? 'dropped' : 'rose'}${at ? ` ${at}` : ''}`
  }
  if (copy.nearMiss) line += ' · near miss'
  return line
}

/** Where a copy is now, and the page it links to: "In Alerts", or why it is in the archive. */
export function copyNow(copy: Copy, now: Date = new Date()): { text: string; href: string } {
  if (copy.now.listingStatus === 'active') return { text: 'In Alerts', href: '/alerts' }
  const on = archiveDate(copy.now.archivedAt, now)
  const words: Record<string, string> = {
    listing_sold: 'Sold',
    listing_ended: 'Ended',
    listing_removed: 'Removed',
    user_dismissed: 'Dismissed',
    superseded: 'Replaced',
    search_deleted: 'Search deleted',
  }
  const word = words[copy.now.archiveReason ?? ''] ?? 'Archived'
  return { text: on ? `${word} ${on}` : word, href: '/alerts/archive' }
}

/** "9 copies" beside a book. */
export function copiesCount(n: number): string {
  return plural(n, 'copy', 'copies')
}
