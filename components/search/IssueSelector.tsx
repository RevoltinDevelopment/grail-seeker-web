'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useIssues } from '@/hooks/useIssues'
import { APIError } from '@/lib/api/client'
import { issuesAPI } from '@/lib/api/issues'
import { cn } from '@/lib/utils'
import type { Issue, IssueVolume } from '@/types/issue.types'
import { IssuePickerModal } from './IssuePickerModal'
import { VariantSelect } from './VariantSelect'

export interface IssueSelectorValue {
  issueNumber: string
  issueId: string | null
  issueVolumeText: string | null
  issuePublicationYear: number | null
}

interface IssueSelectorProps {
  seriesId: string
  seriesTitle: string
  value: IssueSelectorValue
  onChange: (value: IssueSelectorValue) => void
  error?: string
}

// Matches the pre-existing regex both search forms have always validated
// against (app/(authenticated)/searches/new|[id]/edit/page.tsx). Re-used
// here, not redefined ad hoc, so the legacy path's own acceptance rule
// can never silently drift from what it always was.
const LEGACY_NUMBER_PATTERN = /^(\d+|nn)$/

function flattenIssues(volumes: IssueVolume[]): Issue[] {
  return volumes.flatMap((v) => v.buckets.flatMap((b) => b.issues))
}

/** Finds the group (and, if applicable, the specific variant) a resolved value points at. */
function findResolved(
  issues: Issue[],
  value: IssueSelectorValue
): { group: Issue; variant: { id: string; variantName: string } | null } | null {
  if (value.issueId) {
    for (const group of issues) {
      if (group.plainIssueId === value.issueId) return { group, variant: null }
      const variant = group.variants.find((v) => v.id === value.issueId)
      if (variant) return { group, variant }
    }
    return null
  }
  if (value.issueNumber) {
    const group = issues.find((i) => i.number === value.issueNumber)
    return group ? { group, variant: null } : null
  }
  return null
}

/** Builds the resolved-pick value from a chosen group (and optional variant), per the Data Contract. */
export function resolveValueFromIssue(
  group: Issue,
  variantId: string | null
): IssueSelectorValue {
  const issueVolumeText = group.displayVolumeWithNumber ? group.volume : null
  return {
    issueNumber: group.number,
    issueId: variantId,
    issueVolumeText,
    issuePublicationYear: group.publicationYear,
  }
}

export function IssueSelector({ seriesId, seriesTitle, value, onChange, error }: IssueSelectorProps) {
  const { data, isLoading, error: fetchError } = useIssues(seriesId)
  const [inputText, setInputText] = useState(value.issueNumber)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalPrefillQuery, setModalPrefillQuery] = useState<string | undefined>(undefined)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const noGcdData = !isLoading && fetchError instanceof APIError && fetchError.status === 404
  // A non-404 failure (network, 500) falls back to the same legacy text
  // field as "no GCD data" rather than blocking the user entirely --
  // conservative default, not an explicit AC, documented as a judgment call.
  const fetchFailed = !isLoading && fetchError !== null && !noGcdData

  const allIssues = useMemo(() => (data ? flattenIssues(data.volumes) : []), [data])
  // Code review finding: a series with exactly one issue NUMBER can still
  // have multiple print variants of that one issue (the ASM-2018 shape) --
  // that's not "nothing to pick," a real variant choice still exists. True
  // one-shot (fully read-only, matching the UX spec exactly) requires both
  // exactly one group AND that group having no variants to choose between.
  const isOneShot =
    !isLoading && !fetchError && allIssues.length === 1 && allIssues[0]?.variants.length === 0
  const resolved = useMemo(() => findResolved(allIssues, value), [allIssues, value])

  const isResolved = value.issueNumber !== ''

  // ---- One-shot: read-only, no field, nothing tappable ----
  if (isOneShot) {
    const only = allIssues[0]
    const label = only.title ? `${only.number} – ${only.title}` : `Issue #${only.number}`
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {label} <span className="text-slate-400">— one-shot, this title has only one issue.</span>
      </div>
    )
  }

  // ---- No GCD data / fetch failed: legacy plain-text field, unchanged from today ----
  if (noGcdData || fetchFailed) {
    return (
      <div>
        <input
          id="issueNumber"
          type="text"
          value={inputText}
          onChange={(e) => {
            const typed = e.target.value
            setInputText(typed)
            // value.issueNumber is only ever non-empty when genuinely valid,
            // for both this legacy path and the picker path below -- lets
            // the parent form's own validation simplify to a single
            // non-empty check instead of re-implementing this regex itself
            // (AC #10). The field still shows exactly what the user typed
            // via local inputText, even mid-invalid -- only the value
            // propagated upward is gated.
            const isValidLegacyNumber = typed === '' || LEGACY_NUMBER_PATTERN.test(typed)
            onChange({
              issueNumber: isValidLegacyNumber ? typed : '',
              issueId: null,
              issueVolumeText: null,
              issuePublicationYear: null,
            })
          }}
          placeholder='e.g., 1, 129, or "nn"'
          className={cn(
            'w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue',
            error ? 'border-error-red' : 'border-slate-300'
          )}
        />
        {error && <p className="mt-1 text-sm text-error-red">{error}</p>}
      </div>
    )
  }

  const handleBlur = async () => {
    if (!inputText || inputText === value.issueNumber) return
    if (isLoading) return // issue data not loaded yet -- nothing to validate against

    setIsValidating(true)
    try {
      const result = await issuesAPI.search(seriesId, inputText)
      if (result.issues.length === 1) {
        // Exactly one exact match -- silent collapse, no ceremony.
        const group = result.issues[0]
        const variantId = group.plainIssueId ?? null
        onChange(resolveValueFromIssue(group, variantId))
        setRedirectMessage(null)
      } else {
        // Zero matches, or more than one (a Judge-style series resetting
        // per volume) -- both redirect, never auto-pick when the match
        // isn't unique (Story 1.16 AC #6, code review finding).
        setRedirectMessage(`'${inputText}' isn't a match for ${seriesTitle} — browse or search below.`)
        setModalPrefillQuery(inputText)
        setIsModalOpen(true)
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleSelectIssue = (issue: Issue) => {
    const variantId = issue.plainIssueId ?? null
    onChange(resolveValueFromIssue(issue, variantId))
    setInputText(issue.number)
    setRedirectMessage(null)
  }

  const openPicker = () => {
    setModalPrefillQuery(undefined)
    setRedirectMessage(null)
    setIsModalOpen(true)
  }

  // ---- Loading, unresolved: neutral placeholder, not a guess ----
  // Code review finding: without this, the component fell through past the
  // one-shot/no-GCD-data checks (both gated on `!isLoading`) straight to
  // the multi-issue-unresolved branch below while still loading -- briefly
  // rendering the full picker UI (including "Select Issue") for a series
  // that might turn out to have no GCD data at all, before flipping to the
  // correct legacy field once the fetch settled. A resolved/prefilled value
  // still renders immediately below, regardless of loading state -- no
  // flicker for the edit-mode case, which doesn't need issue data loaded
  // to display its already-known issueNumber.
  if (isLoading && !isResolved) {
    return (
      <div className="h-10 animate-pulse rounded-md bg-slate-100" aria-label="Loading issue picker" />
    )
  }

  // ---- Resolved, collapsed: solid border, "Select to edit" ----
  if (isResolved) {
    const label = resolved
      ? resolved.variant
        ? `${resolved.group.number} · ${resolved.variant.variantName}`
        : resolved.group.title
          ? `${resolved.group.number} – ${resolved.group.title}`
          : `Issue #${resolved.group.number}`
      : `Issue #${value.issueNumber}`

    // Tier two, gated behind the rollout flag -- tier one (above) is
    // unconditional either way. Only shown when the resolved group
    // actually has variants; when the flag is off, resolved picks already
    // default to the plain printing (or null/"search all" when no plain
    // exists) via resolveValueFromIssue, so "off" needs no extra handling
    // here -- it's already indistinguishable from a user never opening the
    // dropdown.
    const showVariantSelect =
      process.env.NEXT_PUBLIC_ENABLE_VARIANT_PICKER === 'true' &&
      resolved !== null &&
      resolved.group.variants.length > 0

    return (
      <>
        <button
          type="button"
          onClick={openPicker}
          className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm hover:border-collector-blue"
        >
          <span className="text-slate-950">{label}</span>
          <span className="text-collector-blue">Select to edit</span>
        </button>
        {showVariantSelect && resolved && (
          <div className="mt-2">
            <VariantSelect
              group={resolved.group}
              value={value.issueId}
              onChange={(issueId) => onChange({ ...value, issueId })}
            />
          </div>
        )}
        <IssuePickerModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          seriesId={seriesId}
          seriesTitle={seriesTitle}
          prefillQuery={modalPrefillQuery}
          onSelectIssue={handleSelectIssue}
        />
      </>
    )
  }

  // ---- Multi-issue, unresolved: field + "or" + Select Issue, both visible ----
  return (
    <div>
      <div className="flex flex-col gap-2">
        <input
          id="issueNumber"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onBlur={handleBlur}
          placeholder="e.g., 1, 129"
          disabled={isValidating}
          className={cn(
            'w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue',
            error ? 'border-error-red' : 'border-slate-300'
          )}
        />
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button type="button" variant="outline" onClick={openPicker}>
          Select Issue
        </Button>
      </div>
      {redirectMessage && <p className="mt-1 text-sm text-slate-500">{redirectMessage}</p>}
      {error && !redirectMessage && <p className="mt-1 text-sm text-error-red">{error}</p>}
      <IssuePickerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        seriesId={seriesId}
        seriesTitle={seriesTitle}
        prefillQuery={modalPrefillQuery}
        onSelectIssue={handleSelectIssue}
      />
    </div>
  )
}
