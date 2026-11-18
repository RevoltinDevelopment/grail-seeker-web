/**
 * Story 1.100 (U-14): what the Reports routes answer since Story 1.99 (backend 480e439).
 * Decision #110: a copy is one listing found for one book, counted once however many alerts it made.
 * The old per-alert `booksFound` lists are not read here (backend part B removes them).
 */

export interface Book {
  seriesTitle: string
  issueNumber: string
  issueVolumeText: string | null
}

export interface BookSearched extends Book {
  /** True only when every search for the book is deleted */
  searchDeleted?: boolean
}

/** One listing found for one book (backend `Copy`, src/domain/services/booksFound.ts). */
export interface Copy {
  /** The newest alert for this copy */
  alertId: string
  book: Book
  marketplace: string
  /** The tracked link to the listing */
  listingUrl: string | null
  grade: { gradingAuthority: string | null; grade: number | null; pageQuality: string | null }
  price: number
  /** A MyComicShop auction's stored price is a placeholder, never the book's price (Story 1.34) */
  priceIsPlaceholder: boolean
  nearMiss: boolean
  /** When the first alert for it was made */
  foundAt: string
  priceChange: { direction: 'dropped' | 'rose'; at: string } | null
  now: { listingStatus: string | null; archiveReason: string | null; archivedAt: string | null }
  /** How many alerts it made */
  alerts: number
}

export interface TallyBook extends Book {
  searchDeleted: boolean
  copies: number
  /** In the order found */
  grades: { gradingAuthority: string | null; grade: number | null }[]
}

export interface WeekReport {
  weekStart?: string
  booksSearched: BookSearched[]
  /** Keyed by marketplace: the core ones by provider name (eBay, Heritage, MyComicShop), shops by slug */
  searchesRunByMarketplace: Record<string, number>
  alertsIssued: number
  copiesFound: Copy[]
  activeSearches?: number // current week only
  searchesCreated: number
  searchesDeleted: number
  alertsArchived: number
  alertsDismissed: number
}

export interface AllTimeReport {
  booksSearched: BookSearched[]
  searchesRunByMarketplace: Record<string, number>
  alertsIssued: number
  copiesFound: number
  booksFoundTally: TallyBook[]
  searchesCreated: number
  searchesDeleted: number
  alertsArchived: number
  alertsDismissed: number
}

export interface PastWeekSummary {
  weekStart: string
  totalSearchesRun: number
  alertsIssued: number
}

export interface ReportsResponse {
  trackingSince: string
  /** When the account was made; null when it could not be read */
  joinedAt: string | null
  currentWeek: WeekReport
  allTime: AllTimeReport
  pastWeeks: PastWeekSummary[]
}

export interface BookFoundGroup extends Book {
  searchDeleted: boolean
  /** Newest find first */
  copies: Copy[]
}

export interface BooksFoundResponse {
  joinedAt: string | null
  /** The first find; null when nothing was found */
  since: string | null
  copiesFound: number
  /** Most copies first, then title */
  books: BookFoundGroup[]
}
