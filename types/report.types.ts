export interface BookFound {
  alertId: string
  title: string
  createdAt: string
  listingUrl?: string | null
  listingStatus?: string | null
}

export interface BookSearched {
  seriesTitle: string
  issueNumber: string
  issueVolumeText: string | null
}

export interface WeekReport {
  weekStart: string
  booksSearched: BookSearched[]
  // Story 1.44: replaces ebaySearchesRun/heritageSearchesRun. Keyed by
  // marketplace name (e.g. eBay, Heritage, MyComicShop) -- no precomputed
  // total on this type; sum via totalSearchesRun() from
  // lib/constants/marketplaceDisplayOrder.ts.
  searchesRunByMarketplace: Record<string, number>
  alertsIssued: number
  booksFound: BookFound[]
  activeSearches?: number // current week only
  searchesCreated: number
  searchesDeleted: number
  alertsArchived: number
  alertsDismissed: number
}

export interface PastWeekSummary {
  weekStart: string
  // Story 1.44: replaces ebaySearchesRun/heritageSearchesRun -- the backend
  // already precomputes this sum for past-weeks rows (unlike WeekReport above).
  totalSearchesRun: number
  alertsIssued: number
}

export interface ReportsResponse {
  trackingSince: string
  currentWeek: WeekReport
  allTime: Omit<WeekReport, 'activeSearches'>
  pastWeeks: PastWeekSummary[]
}
