export interface BookFound {
  alertId: string
  title: string
  createdAt: string
}

export interface BookSearched {
  seriesTitle: string
  issueNumber: string
}

export interface WeekReport {
  weekStart: string
  booksSearched: BookSearched[]
  ebaySearchesRun: number
  heritageSearchesRun: number
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
  ebaySearchesRun: number
  heritageSearchesRun: number
  alertsIssued: number
}

export interface ReportsResponse {
  trackingSince: string
  currentWeek: WeekReport
  allTime: Omit<WeekReport, 'activeSearches'>
  pastWeeks: PastWeekSummary[]
}
