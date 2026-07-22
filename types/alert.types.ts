export interface Alert {
  id: string
  searchId: string
  search: {
    series: {
      title: string
      volume: number
    }
    issueNumber: string
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
