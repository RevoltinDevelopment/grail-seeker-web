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
  }
  isDirectMatch: boolean
  notificationSent: boolean
  notificationSentAt: string | null
  createdAt: string
}

export interface AlertListResponse {
  alerts: Alert[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}
