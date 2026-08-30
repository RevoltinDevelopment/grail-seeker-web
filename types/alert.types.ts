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
