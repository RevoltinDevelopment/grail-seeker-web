export interface ComicSeries {
  // Story 1.16: corrected from `number` -- the backend's comic_series.id is
  // a UUID string (confirmed against the live schema, not assumed). Stayed
  // silent until now because nothing did numeric operations on it, only
  // opaque pass-through.
  id: string
  title: string
  volume: number
  yearRange: string
  // Story 1.18: corrected -- this was previously documented as "" |
  // "Annual" | "Giant-Size" | "King-Size Special", but the backend never
  // actually sent those values (always ""). Story 1.17 repurposed this
  // same wire field as a real discriminator: 'series' for an ordinary
  // comic_series match, 'aliasGroup' for an Alias Group match (a
  // collector-facing identity spanning multiple real series -- see
  // IssueSelector's `source` prop). Determines which backend endpoint
  // IssueSelector fetches issues from.
  type: 'series' | 'aliasGroup'
  publisher: string
  // Alias-aware search fields (from backend)
  displayName?: string // Pre-formatted canonical name, e.g., "Amazing Spider-Man (1st Series 1963-1998)"
  matchedAlias?: string | null // The alias that matched the search, or null for direct title matches
  aliasIssueRange?: string | null // Human-readable issue range, e.g., "issues #1-141"
}

export interface GrailSearch {
  id: string
  userId: string
  series: ComicSeries
  issueNumber: string
  // Story 1.16: the resolved issue-picker pick, when one exists. `null`
  // (never `undefined`) is the explicit "no pick" / "search all variants"
  // state -- the backend's PATCH handler is provided-keys-only, so an
  // omitted key means "leave unchanged," not "clear" (see IssueSelector's
  // Component Contract in the story for the full reasoning).
  issueId: string | null
  issueVolumeText: string | null
  issuePublicationYear: number | null
  // Story 1.18: which Alias Group (if any) this search was made through --
  // purely cosmetic, same `| null` (never `undefined`) reasoning as
  // issueId above. seriesId/issueId remain the real matching keys
  // regardless of whether this is set.
  aliasGroupId: string | null
  maxPrice: number | null
  gradeMin: number | null
  gradeMax: number | null
  pageQuality: string | null
  gradingAuthority: string | null
  platforms: string[]
  isActive: boolean
  notificationsEnabled: boolean
  alertCount?: number
  currentAlertCount?: number
  archivedAlertCount?: number
  lastCheckedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateSearchRequest {
  seriesId: string
  issueNumber: string
  // Story 1.16 code review finding: these were typed optional (`?:`),
  // contradicting the Component Contract's own rule -- omitting a key on
  // the wire is indistinguishable from `undefined`, and JSON.stringify
  // drops undefined-valued keys entirely, so an accidental omission here
  // would silently mean "leave unchanged" server-side (PATCH's
  // provided-keys-only handler) rather than the intended "no pick" (`null`).
  // Non-optional forces every call site to make that choice explicitly.
  issueId: string | null
  issueVolumeText: string | null
  issuePublicationYear: number | null
  aliasGroupId: string | null
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

// Story 1.18: GET /api/alias-groups/:id's response shape -- bare group
// metadata, used to reconstruct SeriesAutocomplete's display state on
// edit-mode prefill (GrailSearch.aliasGroupId is a bare id with no
// display-name text alongside it).
export interface AliasGroupResponse {
  id: string
  displayName: string
  startYear: number | null
  endYear: number | null
  publisherName: string | null
}
