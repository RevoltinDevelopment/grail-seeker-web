'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIssues } from '@/hooks/useIssues'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { issuesAPI, type IssueSource } from '@/lib/api/issues'
import type { Issue } from '@/types/issue.types'
import { IssueGridButton } from './IssueGridButton'
import { IssueListRow } from './IssueListRow'
import { VolumeBucketNav } from './VolumeBucketNav'

interface IssuePickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: IssueSource
  seriesTitle: string
  /** Pre-scroll/orient toward this raw typed value on open (redirect case). */
  prefillQuery?: string
  onSelectIssue: (issue: Issue) => void
}

// Direction A — Search-Prominent, per ux-design-specification.md. Desktop:
// centered Dialog, everything visible at once. Mobile: bottom Sheet,
// inheriting the existing Confirmation Modal pattern's split -- except
// there was no existing pattern to inherit (Story 1.16's own research
// finding), so this is the first place that split exists in this repo.
export function IssuePickerModal({
  open,
  onOpenChange,
  source,
  seriesTitle,
  prefillQuery,
  onSelectIssue,
}: IssuePickerModalProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const { data, isLoading } = useIssues(source)

  const [searchQuery, setSearchQuery] = useState(prefillQuery ?? '')
  const [searchResults, setSearchResults] = useState<Issue[] | null>(null)
  const [selectedVolumeIndex, setSelectedVolumeIndex] = useState(0)
  const [selectedBucketIndex, setSelectedBucketIndex] = useState(0)

  // Reset to a fresh, pre-scrolled-toward-the-typed-value state every time
  // the modal opens -- never carry stale search/nav state from a previous
  // open (UX spec: redirection always orients toward the user's own intent).
  useEffect(() => {
    if (open) {
      setSearchQuery(prefillQuery ?? '')
      setSelectedVolumeIndex(0)
      setSelectedBucketIndex(0)
    }
  }, [open, prefillQuery])

  const hasAnyTitle = useMemo(
    () => (data ? data.volumes.some((v) => v.buckets.some((b) => b.issues.some((i) => i.title))) : false),
    [data]
  )

  // Debounced live search, mirroring SeriesAutocomplete's own manual
  // useEffect+setTimeout pattern exactly (300ms, no React Query -- this is
  // a throwaway-results, re-fires-per-keystroke access pattern, not the
  // fetch-once-on-open pattern the browse data above uses).
  //
  // Code review finding (CRITICAL): this used to run on searchQuery alone,
  // regardless of hasAnyTitle. The search <input> only renders when
  // hasAnyTitle is true, but a redirect from IssueSelector's handleBlur
  // still sets searchQuery (via prefillQuery) even for an untitled/
  // grid-mode series -- so searchResults got set (usually to an empty
  // array, since a non-match is exactly why it redirected), which hid the
  // VolumeBucketNav/browse view too (gated on searchResults === null),
  // leaving no visible search box to clear and no browse view either: a
  // genuine dead end. Gating this on hasAnyTitle, same as the input itself,
  // means searchResults simply never gets set for a grid-mode series, so
  // the browse view is always reachable regardless of a stale prefillQuery.
  useEffect(() => {
    if (!hasAnyTitle || !searchQuery) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const result = await issuesAPI.search(source, searchQuery)
        setSearchResults(result.issues)
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, source, hasAnyTitle])

  const selectedVolume = data?.volumes[selectedVolumeIndex]
  const selectedBucket = selectedVolume?.buckets[selectedBucketIndex]
  const browseIssues = selectedBucket?.issues ?? []
  const displayedIssues = searchResults !== null ? searchResults : browseIssues
  const layoutMode = data?.layoutMode ?? 'grid'

  const handleSelect = (issue: Issue) => {
    onSelectIssue(issue)
    onOpenChange(false)
  }

  const body = (
    <div className="flex flex-col gap-4">
      {hasAnyTitle && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${seriesTitle} by title or number...`}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-collector-blue sm:text-sm"
          autoFocus
        />
      )}

      {searchResults === null && data && (
        <VolumeBucketNav
          hasMultipleVolumes={data.hasMultipleVolumes}
          volumes={data.volumes}
          selectedVolumeIndex={selectedVolumeIndex}
          selectedBucketIndex={selectedBucketIndex}
          onSelectVolume={(i) => {
            setSelectedVolumeIndex(i)
            setSelectedBucketIndex(0)
          }}
          onSelectBucket={setSelectedBucketIndex}
        />
      )}

      {isLoading && <p className="text-sm text-slate-500">Loading issues…</p>}

      {!isLoading && displayedIssues.length === 0 && (
        <p className="text-sm text-slate-500">No issues found.</p>
      )}

      {layoutMode === 'list' ? (
        <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
          {displayedIssues.map((issue) => (
            <IssueListRow
              key={issue.plainIssueId ?? `${issue.number}-${issue.volume ?? ''}-${issue.sortCode}`}
              issue={issue}
              selected={false}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="grid max-h-96 grid-cols-5 gap-2 overflow-y-auto">
          {displayedIssues.map((issue) => (
            <IssueGridButton
              key={issue.plainIssueId ?? `${issue.number}-${issue.volume ?? ''}-${issue.sortCode}`}
              issue={issue}
              selected={false}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Issue — {seriesTitle}</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Select Issue — {seriesTitle}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">{body}</div>
      </SheetContent>
    </Sheet>
  )
}
