export interface Alert {
  id: string
  searchId: string
  search: {
    series: {
      title: string
      volume: number
    }
    issueNumber: string
    issueVolumeText: string | null
    // Story 1.95 (need 58): the search's maximum as it is now; null when it has none
    maxPrice?: number | null
  }
  listing: {
    title: string
    price: number
    grade: number | null
    pageQuality: string | null
    gradingAuthority: string | null
    url: string | null
    platform: string
    ebayItemId: string | null
    // MyComicShop-only (Story 1.34, Migration 056): set when this listing is
    // a not-yet-started auction, so the UI can show an honest start date
    // alongside the placeholder $0 price rather than a bare, unexplained
    // one -- matches the backend's own SMS copy, which shows both together
    // too, not one in place of the other. Null/absent for every other case.
    auctionStartTime?: string | null
  }
  isDirectMatch: boolean
  // Story 1.95: a near miss, from the amounts stored when the alert was made (the maximum then and
  // how far over it the price was); null for a match within the price
  nearMiss?: { overBy: number; maxPrice: number } | null
  // Story 1.95 (need 70): the newer alert that replaced this one, and where it is now
  supersededBy?: { id: string; listingStatus: string } | null
  // Story 1.96 (Decision #103): when the app first showed it; null while not yet seen
  seenAt?: string | null
  notificationSent: boolean
  notificationSentAt: string | null
  createdAt: string
  // Archive system fields
  listingStatus?: string
  archivedAt?: string | null
  archiveReason?: string | null
}

export interface AlertListResponse {
  alerts: Alert[]
  // Story 1.95 (need 61): how far over the maximum a near miss may be (0.15)
  nearMissMargin?: number
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export interface ArchiveGroupSummary {
  searchId: string
  title: string
  count: number
}

export interface ArchiveGroupsResponse {
  groups: ArchiveGroupSummary[]
}
