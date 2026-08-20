// Story 1.16: mirrors Story 1.15's real, live GET /api/series/:seriesId/issues
// and .../issues/search response shapes exactly (grail-seeker repo,
// docs/bmad-output/implementation-artifacts/1-15-issue-level-query-api.md).
// Nested-response-type convention follows types/report.types.ts's existing
// pattern -- one named interface per nesting level, no inline anonymous
// object types.

export interface IssueVariant {
  id: string
  variantName: string
}

export interface Issue {
  number: string
  title: string | null
  sortCode: number
  plainIssueId: string | null
  variants: IssueVariant[]
  volume: string | null
  noVolume: boolean
  displayVolumeWithNumber: boolean
  publicationYear: number | null
  // Story 1.18: the real comic_series this issue belongs to. Always equal
  // to the seriesId you fetched with for a plain series; for an Alias
  // Group source, this is the real member series (never the alias_groups
  // id) -- the only correct value to submit as CreateSearchRequest.seriesId.
  seriesId: string
}

export interface IssueBucket {
  issues: Issue[]
}

export interface IssueVolume {
  volume: string | null
  hasBuckets: boolean
  buckets: IssueBucket[]
}

export interface SeriesIssuesResponse {
  layoutMode: 'grid' | 'list'
  hasMultipleVolumes: boolean
  volumes: IssueVolume[]
}

export interface IssueSearchResponse {
  issues: Issue[]
}
