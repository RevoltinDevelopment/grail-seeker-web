export interface ComicSeries {
  id: number
  title: string
  volume: number
  yearRange: string
  type: string // "" | "Annual" | "Giant-Size" | "King-Size Special"
  publisher: string
  displayName?: string
}

export interface GrailSearch {
  id: string
  userId: string
  series: ComicSeries
  issueNumber: string
  maxPrice: number | null
  gradeMin: number | null
  gradeMax: number | null
  pageQuality: string | null
  gradingAuthority: string | null
  platforms: string[]
  isActive: boolean
  notificationsEnabled: boolean
  alertCount?: number
  lastCheckedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateSearchRequest {
  seriesId: number
  issueNumber: string
  maxPrice?: number | null
  gradeMin?: number | null
  gradeMax?: number | null
  pageQuality?: string | null
  gradingAuthority?: string | null
  platforms: string[]
}

export interface UpdateSearchRequest extends Partial<CreateSearchRequest> {
  isActive?: boolean
}

export interface SearchListResponse {
  searches: GrailSearch[]
}
