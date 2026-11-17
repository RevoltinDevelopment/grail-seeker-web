/**
 * Story 1.96 (U-11): the words on Alerts, as drawn in alerts-list.html (UX plan section 17).
 * Pure, so every state of the page is tested here; AlertsClient and AlertRow only render them.
 */
import { CORE_MARKETPLACES, marketplaceLabel } from '@/lib/marketplaceNames'
import { matchTime } from '@/lib/utils/match-time'
import { formatGrade, formatIssueNumber } from '@/lib/utils/series-formatter'

import type { Alert } from '@/types/alert.types'
import type { GrailSearch } from '@/types/search.types'

export type MatchFilter = 'all' | 'within' | 'near'

export interface MarketplaceOption {
  slug: string
  label: string
}

/** "$3,950"; cents only when there are some ("$12.50"). */
export function money(amount: number | string): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return 'Price not listed'
  const whole = Number.isInteger(n)
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`
}

/** "White Pages" from a shop's title reads "White pages" in the row. */
function sentenceCase(text: string): string {
  const t = text.trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t
}

/** The book: "The Amazing Spider-Man #129". */
export function bookTitle(alert: Alert): string {
  return `${alert.search.series.title} ${formatIssueNumber(alert.search.issueNumber, alert.search.issueVolumeText)}`
}

/** The slab: "CGC 9.2 · White pages"; "" when the listing names no grade. */
export function gradeLine(alert: Alert): string {
  const { grade, gradingAuthority, pageQuality } = alert.listing
  const slab = grade ? [gradingAuthority?.toUpperCase(), formatGrade(grade)].filter(Boolean).join(' ') : ''
  return [slab, pageQuality ? sentenceCase(pageQuality) : ''].filter(Boolean).join(' · ')
}

/** "Sat, Nov 7, 7 PM" (minutes only when not on the hour), in the subscriber's own time. */
function auctionOpens(iso: string): string {
  const at = new Date(iso)
  return at.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    ...(at.getMinutes() === 0 ? {} : { minute: '2-digit' }),
  })
}

/** A MyComicShop auction whose opening is still ahead (an opened one shows its price, review). */
function auctionNotOpen(alert: Alert, now: Date = new Date()): boolean {
  const at = alert.listing.auctionStartTime ? new Date(alert.listing.auctionStartTime) : null
  return at !== null && Number.isFinite(at.getTime()) && at > now
}

/**
 * The price, or, for a MyComicShop auction not yet open, when it opens: its stored price is a
 * placeholder and must never read as the book's price (Story 1.34).
 */
export function priceText(alert: Alert): string {
  if (auctionNotOpen(alert)) return `Auction opens ${auctionOpens(alert.listing.auctionStartTime!)}`
  return money(alert.listing.price)
}

/**
 * Where and when: "eBay · 2 hours ago · Texted to you". Only a sent text is a fact the server
 * records on the alert, so a match not texted says nothing more (decision 5; Decision #109).
 */
export function whereLine(alert: Alert, label: string, now: Date = new Date()): string {
  const where = alert.listing.auctionStartTime ? `${label} auction` : label // an auction, opened or not
  return [where, matchTime(alert.createdAt, now), alert.notificationSent ? 'Texted to you' : '']
    .filter(Boolean)
    .join(' · ')
}

/** Only a near miss is marked: "Near miss: $450 over your $6,000 maximum". */
export function nearMissFlag(alert: Alert): string | null {
  const nm = alert.nearMiss
  if (!nm) return null
  return `Near miss: ${money(nm.overBy)} over your ${money(nm.maxPrice)} maximum`
}

/** What a screen reader hears for the row's Dismiss: "Dismiss Werewolf by Night #32, CGC 9.6, $5,400". */
export function rowName(alert: Alert): string {
  const slab = gradeLine(alert).split(' · ')[0]
  return [bookTitle(alert), slab, priceText(alert)].filter(Boolean).join(', ')
}

/**
 * The marketplace filter: every active marketplace by name, core ones first in their display order,
 * then the shops in the registry's order (need 67); and any marketplace an alert is on that the list
 * no longer has (a shop switched off), so no alert is ever unreachable by the filter.
 */
export function marketplaceOptions(
  registry: readonly { slug: string; displayName: string }[],
  alerts: readonly Alert[]
): MarketplaceOption[] {
  const core = CORE_MARKETPLACES.filter((m) => registry.some((p) => p.slug === m.slug)).map((m) => ({
    slug: m.slug,
    label: m.label,
  }))
  const others = registry
    .filter((p) => !CORE_MARKETPLACES.some((m) => m.slug === p.slug))
    .map((p) => ({ slug: p.slug, label: marketplaceLabel(p.slug, p.displayName) }))
  const listed = [...core, ...others]
  const missing: MarketplaceOption[] = []
  for (const a of alerts) {
    const slug = a.listing.platform
    if (!listed.some((o) => o.slug === slug) && !missing.some((o) => o.slug === slug)) {
      missing.push({ slug, label: marketplaceLabel(slug, slug) })
    }
  }
  return [...listed, ...missing]
}

/** The filters, as the server applies them: marketplace by slug, near miss by the stored flag. */
export function filterAlerts(alerts: readonly Alert[], market: string, match: MatchFilter): Alert[] {
  return alerts.filter((a) => {
    if (market !== 'all' && a.listing.platform !== market) return false
    if (match === 'within' && a.nearMiss) return false
    if (match === 'near' && !a.nearMiss) return false
    return true
  })
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** The line under the page title. */
export function subtitle(args: {
  loading: boolean
  context: boolean
  baseCount: number
  shownCount: number
  searchCount: number
  filtered: boolean
}): string {
  const { loading, context, baseCount, shownCount, searchCount, filtered } = args
  if (loading) return 'Loading your alerts'
  if (context) return `${plural(shownCount, 'alert', 'alerts')} for this search`
  if (baseCount === 0) return 'Matches from your searches show here'
  if (filtered) {
    if (baseCount === 1) return shownCount === 1 ? 'Your one alert matches the filters' : 'Your one alert doesn\u2019t match the filters'
    if (shownCount === 0) return `None of your ${baseCount} alerts match the filters`
    return `${shownCount} of your ${baseCount} alerts ${shownCount === 1 ? 'matches' : 'match'} the filters`
  }
  return `${plural(shownCount, 'alert', 'alerts')} on ${plural(searchCount, 'search', 'searches')}`
}

/** The empty state: nothing at all, or nothing the filters let through. */
export function emptyWords(args: {
  baseCount: number
  context: boolean
  match: MatchFilter
  marketLabel: string | null
  textsIncluded: boolean
}): { heading: string; body: string; filteredOut: boolean } {
  const { baseCount, context, match, marketLabel, textsIncluded } = args
  if (baseCount === 0) {
    return {
      heading: context ? 'No alerts for this search right now' : 'No alerts right now',
      body: `When a listing matches one of your searches, it shows here${textsIncluded ? ', and we text you' : ''}. Alerts for listings that sold or ended are in the archive.`,
      filteredOut: false,
    }
  }
  const what = match === 'near' ? 'No near misses' : match === 'within' ? 'No matches within your price' : 'No alerts'
  return {
    heading: marketLabel ? `${what} on ${marketLabel}` : what,
    body: 'Your other alerts are hidden by the filters.',
    filteredOut: true,
  }
}

/** A search as the context panel and By book's subtitles name it: "9.0 to 9.4 · CGC · up to $4,500". */
export function searchDetail(search: Pick<GrailSearch, 'gradeMin' | 'gradeMax' | 'gradingAuthority' | 'maxPrice'>): string {
  const { gradeMin, gradeMax } = search
  let grade: string
  if (gradeMin == null && gradeMax == null) grade = 'Any grade'
  else if (gradeMin != null && gradeMax != null && Number(gradeMin) === Number(gradeMax)) grade = formatGrade(gradeMin)
  else grade = `${formatGrade(gradeMin ?? 0.5)} to ${formatGrade(gradeMax ?? 10)}`
  return [grade, search.gradingAuthority?.toUpperCase(), search.maxPrice ? `up to ${money(search.maxPrice)}` : '']
    .filter(Boolean)
    .join(' · ')
}

/** The search's name in the context panel: from the searches list, or its alerts when it has gone. */
export function searchName(search: {
  series: { title: string }
  issueNumber: string
  issueVolumeText: string | null
}): string {
  return `${search.series.title} ${formatIssueNumber(search.issueNumber, search.issueVolumeText)}`
}

/** Why Undo was refused, in plain words. */
export function undoRefusal(code: string | undefined): string {
  if (code === 'NEWER_ALERT') return 'A newer alert for this listing is already in Alerts.'
  return 'That alert couldn’t be brought back.'
}

// Story 1.98 (U-12): the archive's words, as drawn in alerts-archive.html (UX plan section 17)

/** "Oct 24", or "Oct 24, 2025" when not this year, in the subscriber's own time; null when unknown. */
export function archiveDate(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null
  const at = new Date(iso)
  if (!Number.isFinite(at.getTime())) return null
  return at.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(at.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}

/** Where and when it was found: "eBay · alert Oct 25". */
export function archiveWhereLine(alert: Alert, label: string, now: Date = new Date()): string {
  const where = alert.listing.auctionStartTime ? `${label} auction` : label
  const found = archiveDate(alert.createdAt, now)
  return found ? `${where} · alert ${found}` : where
}

export type ArchiveIcon = 'sold' | 'ended' | 'dismissed' | 'replaced' | 'removed'

export type ArchiveAction =
  | { kind: 'listing'; label: string; href: string }
  | { kind: 'page'; label: string; href: string }

export interface ArchiveReason {
  icon: ArchiveIcon
  text: string
  action: ArchiveAction | null
}

/**
 * Why an archived alert is in the archive, with the right link (U-12, need 70): the sold or ended
 * listing, the newer alert, the listing for a dismissed alert, nothing for a removed one. Every
 * reason the server records is covered; one it does not know yet still reads honestly.
 */
export function archiveReason(alert: Alert, label: string, now: Date = new Date()): ArchiveReason {
  const on = archiveDate(alert.archivedAt, now)
  const dated = (text: string) => (on ? `${text} · ${on}` : text)
  const url = alert.listing.url
  const listing = (text: string): ArchiveAction | null => (url ? { kind: 'listing', label: text, href: url } : null)
  const view = listing(`View on ${label}`)

  switch (alert.archiveReason) {
    case 'listing_sold':
      return { icon: 'sold', text: dated('Sold'), action: listing('See the sold listing') }
    case 'listing_ended':
      return { icon: 'ended', text: dated('Listing ended'), action: listing('See the ended listing') }
    case 'listing_removed':
      return {
        icon: 'removed',
        text: on ? `Removed by the seller on ${on}, so there is nothing to view` : 'Removed by the seller, so there is nothing to view',
        action: null,
      }
    case 'user_dismissed':
      return { icon: 'dismissed', text: dated('Dismissed by you'), action: view }
    case 'search_deleted':
      return { icon: 'dismissed', text: dated('Archived when you deleted this search'), action: view }
    case 'superseded': {
      const newer = alert.supersededBy
      const was = Number(alert.listing.price)
      const now$ = newer?.price
      let change = ''
      // A MyComicShop auction's stored price is a placeholder (Story 1.34): no comparison when this
      // alert is an auction or either price is not a real one (review)
      const comparable = !alert.listing.auctionStartTime && was > 0 && now$ != null && Number.isFinite(now$) && now$ > 0
      if (comparable && Number.isFinite(was) && now$ !== was) {
        change = `, when the price ${now$ < was ? 'dropped' : 'rose'} to ${money(now$)}`
      }
      const text = `Replaced by a newer alert${on ? ` on ${on}` : ''}${change}`
      if (!newer) return { icon: 'replaced', text, action: null }
      const base = newer.listingStatus === 'active' ? '/alerts' : '/alerts/archive'
      const href = newer.searchId ? `${base}?search=${encodeURIComponent(newer.searchId)}` : base
      return { icon: 'replaced', text, action: { kind: 'page', label: 'See the newer alert', href } }
    }
    default:
      return { icon: 'ended', text: dated('Archived'), action: view }
  }
}

/** The archive's subtitle (as drawn). */
export function archiveSubtitle(args: {
  loading: boolean
  context: boolean
  shownCount: number
  /** Every archived alert, unfiltered; null when not known */
  allCount: number | null
  filtered: boolean
}): string {
  const { loading, context, shownCount, filtered } = args
  // Two reads can disagree for a moment after a refresh: never "5 of your 3" (review)
  const allCount = args.allCount !== null && args.allCount >= shownCount ? args.allCount : null
  if (loading) return 'Loading your archive'
  if (context) return `${plural(shownCount, 'archived alert', 'archived alerts')} for this search`
  if (!filtered && shownCount === 0) return 'Alerts for listings that sold or ended, and ones you dismissed'
  if (filtered) {
    if (allCount === null) return `${plural(shownCount, 'archived alert matches', 'archived alerts match')} the filters`
    if (allCount === 1) return shownCount === 1 ? 'Your one archived alert matches the filters' : 'Your one archived alert doesn\u2019t match the filters'
    if (shownCount === 0) return `None of your ${plural(allCount, 'archived alert', 'archived alerts')} match the filters`
    return `${shownCount} of your ${plural(allCount, 'archived alert', 'archived alerts')} ${shownCount === 1 ? 'matches' : 'match'} the filters`
  }
  return plural(shownCount, 'archived alert', 'archived alerts')
}
