'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { CriteriaHelperText } from '@/components/search/CriteriaHelperText'
import { GradeRangeSelector } from '@/components/search/GradeRangeSelector'
import { HeldSearchView } from '@/components/search/HeldSearchView'
import { IssueSelector, type IssueSelectorValue } from '@/components/search/IssueSelector'
import { PlatformSelector } from '@/components/search/PlatformSelector'
import {
  FORM_CARD,
  OtherCriteriaFields,
  RequiredLabel,
  SaveRow,
  SearchFormPage,
  SearchFormSkeleton,
  SubmitError,
} from '@/components/search/SearchFormLayout'
import { SeriesAutocomplete } from '@/components/search/SeriesAutocomplete'
import { FormNotice, NarrowOnlyLine, SlotBadge, SlotCount } from '@/components/search/SlotParts'
import { BUTTON_PRIMARY } from '@/components/search/formStyles'
import { gradeText } from '@/components/searches/SearchCard'
import { ACCOUNT_SUMMARY_KEY, useAccountSummary } from '@/hooks/useAccountSummary'
import { useGrades } from '@/hooks/useGrades'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useSearch, useSearches } from '@/hooks/useSearches'
import { aliasGroupsAPI } from '@/lib/api/alias-groups'
import type { IssueSource } from '@/lib/api/issues'
import { formSlots } from '@/lib/formSlots'
import { readRefusal, type SlotRefusal } from '@/lib/slotRefusal'
import { slotsForRange } from '@/lib/slots'
import type { ComicSeries } from '@/types/search.types'

const EMPTY_ISSUE_VALUE: IssueSelectorValue = {
  issueNumber: '',
  issueId: null,
  issueVolumeText: null,
  issuePublicationYear: null,
  resolvedSeriesId: null,
}

// Story 1.18: reconstructs a ComicSeries-shaped display object from an
// Alias Group's own metadata endpoint, for SeriesAutocomplete's `value`
// prop on edit-mode prefill. GrailSearch.series always reflects the REAL
// underlying series (never the Alias Group), so prefilling from it alone
// would silently show the wrong name for a search made through a group.
async function fetchAliasGroupDisplay(aliasGroupId: string): Promise<ComicSeries> {
  const group = await aliasGroupsAPI.get(aliasGroupId)
  return {
    id: group.id,
    title: group.displayName,
    volume: 0,
    yearRange:
      group.endYear && group.endYear !== group.startYear
        ? `${group.startYear}-${group.endYear}`
        : `${group.startYear ?? ''}`,
    type: 'aliasGroup',
    publisher: group.publisherName || 'Unknown',
    displayName: group.displayName,
    matchedAlias: null,
    aliasIssueRange: null,
  }
}

export default function EditSearchPage() {
  const router = useRouter()
  const params = useParams()
  const searchId = params.id as string

  const { data: search, isLoading: isLoadingSearch } = useSearch(searchId)
  const { updateSearch } = useSearches()
  // Story 1.49: the no-recorded-platforms fallback now uses the registry's
  // real defaultEnabledSlugs, not the hardcoded ACTIVE_PLATFORMS array.
  const { defaultEnabledSlugs, isLoading: isLoadingPlatforms } = usePlatforms()
  // Story 1.84 (S-04): the grades come from the server. If they cannot be loaded, the saved grade
  // stays as it is and everything else on the search can still be changed.
  const grades = useGrades()
  // Story 1.85 (S-10): the account's slots, for the badge, the hint and the slots alert
  const { account, isLoading: isLoadingAccount, error: accountError } = useAccountSummary()
  const queryClient = useQueryClient()

  const [selectedSeries, setSelectedSeries] = useState<ComicSeries | null>(null)
  const [issueValue, setIssueValue] = useState<IssueSelectorValue>(EMPTY_ISSUE_VALUE)
  const [gradeMin, setGradeMin] = useState<number | null>(null)
  const [gradeMax, setGradeMax] = useState<number | null>(null)
  const [pageQuality, setPageQuality] = useState('Any')
  const [gradingAuthority, setGradingAuthority] = useState('Any')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [maxPriceDisplay, setMaxPriceDisplay] = useState<string>('')

  // Story 1.18: selectedSeries.type is now meaningfully 'series' |
  // 'aliasGroup' (Story 1.17's repurposed field) -- derive IssueSelector's
  // fetch source from it directly, no new state needed.
  // Code review finding: memoized -- an unmemoized object literal here was
  // recreated on every render (e.g. typing in an unrelated field), and
  // IssuePickerModal's debounced-search effect depends on this value by
  // reference, resetting/restarting on every unrelated parent re-render.
  const issueSource: IssueSource | null = useMemo(
    () =>
      selectedSeries
        ? {
            kind: selectedSeries.type === 'aliasGroup' ? 'aliasGroup' : 'series',
            id: selectedSeries.id,
          }
        : null,
    [selectedSeries]
  )
  const [platforms, setPlatforms] = useState<string[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  // Story 1.85: Save was pressed on a change that does not fit; a slot refusal the server sent; the
  // search went on hold while this form was open (Update Search met SEARCH_HELD)
  const [attempted, setAttempted] = useState(false)
  const [refusal, setRefusal] = useState<SlotRefusal | null>(null)
  // Code review: each Save draws its notice afresh, so the same refusal twice is announced twice
  const [saveCount, setSaveCount] = useState(0)
  const [heldOnSave, setHeldOnSave] = useState<{ reason: 'lapse' | 'downgrade' | null } | null>(
    null
  )

  // Code review finding: guards the async Alias Group display fetch below
  // against a setState-after-unmount warning if the user navigates away
  // before it resolves.
  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Pre-fill form when search data loads. Also waits on usePlatforms() so
  // the no-recorded-platforms fallback below never fires with an empty
  // defaultEnabledSlugs before the registry has actually resolved.
  useEffect(() => {
    if (search && !isInitialized && !isLoadingPlatforms) {
      // Story 1.18: GrailSearch.series always reflects the REAL underlying
      // series (never the Alias Group), so prefilling selectedSeries from
      // it alone would silently show the wrong name in SeriesAutocomplete
      // for a search made through a group. resolvedSeriesId is always the
      // real series id regardless -- known immediately, no extra fetch.
      if (search.aliasGroupId) {
        // Code review finding (AC #5, "no flicker"): set the real series
        // synchronously first -- otherwise selectedSeries stays null until
        // the async fetch below resolves, and the page's own `selectedSeries
        // ? <IssueSelector /> : <p>Select a series first.</p>` gate would
        // visibly flash the "no series selected" placeholder before the
        // Alias Group's name loads. Upgraded to the group's own display
        // once fetched, same UX as before, just without the intermediate flash.
        setSelectedSeries(search.series)
        fetchAliasGroupDisplay(search.aliasGroupId)
          .then((display) => {
            if (isMountedRef.current) setSelectedSeries(display)
          })
          .catch((err) => {
            // Fall back to the real series (already showing) rather than
            // leaving the field in an inconsistent state -- log so a
            // genuine Alias Group lookup failure isn't silently invisible,
            // distinct from "no Alias Group was involved at all."
            console.warn(
              'Failed to load Alias Group display info, falling back to the real series:',
              err
            )
          })
      } else {
        setSelectedSeries(search.series)
      }
      setIssueValue({
        issueNumber: search.issueNumber,
        issueId: search.issueId,
        issueVolumeText: search.issueVolumeText,
        issuePublicationYear: search.issuePublicationYear,
        resolvedSeriesId: search.series.id,
      })
      setGradeMin(search.gradeMin)
      setGradeMax(search.gradeMax)
      setPageQuality(search.pageQuality || 'Any')
      setGradingAuthority(search.gradingAuthority || 'Any')

      if (search.maxPrice) {
        setMaxPrice(search.maxPrice.toString())
        const formatted =
          '$' +
          search.maxPrice.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })
        setMaxPriceDisplay(formatted)
      }

      // API returns real values as of Migration 038; all-on fallback matches the backfill
      setPlatforms(search.platforms || defaultEnabledSlugs)
      setIsInitialized(true)
    }
  }, [search, isInitialized, isLoadingPlatforms, defaultEnabledSlugs])

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setMaxPrice(raw)
    setMaxPriceDisplay(raw)
  }

  const handleMaxPriceFocus = () => {
    // Remove formatting when user clicks to edit
    if (maxPrice) {
      setMaxPriceDisplay(maxPrice)
    }
  }

  const handleMaxPriceBlur = () => {
    // Add dollar sign and commas when user leaves field
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      const numValue = parseFloat(maxPrice)
      const formatted =
        '$' +
        numValue.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      setMaxPriceDisplay(formatted)
    }
  }

  // Check if form is valid (for real-time button state)
  // Story 1.16: see new/page.tsx's identical comment -- IssueSelector
  // guarantees issueValue.issueNumber is only ever non-empty when
  // genuinely valid, for both the legacy and picker paths.
  const isFormValid = () => {
    if (!selectedSeries) return false
    if (!issueValue.issueNumber) return false
    if (platforms.length === 0) return false
    return true
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedSeries) {
      newErrors.series = 'Please select a comic series'
    }

    if (!issueValue.issueNumber) {
      newErrors.issueNumber = 'Issue number is required'
    }

    if (platforms.length === 0) {
      newErrors.platforms = 'Select at least one platform'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Story 1.85: the slots the saved search uses (the server's), and its saved grades
  const savedSlots =
    search?.slotsUsed ??
    (search && grades.grades ? slotsForRange(grades.grades, search.gradeMin, search.gradeMax) : 0)
  const lowest = grades.grades?.[0]?.value ?? 0.5
  const highest = grades.grades?.[grades.grades.length - 1]?.value ?? 10
  const slots = formSlots({
    mode: 'edit',
    grades: grades.grades,
    account,
    // Code review: a failed refresh with an account still in hand is not a failure to read it
    accountFailed: !!accountError && !account,
    savedSlots,
    savedRange: search ? { min: search.gradeMin ?? lowest, max: search.gradeMax ?? highest } : null,
    gradeMin,
    gradeMax,
    attempted,
    refusal,
  })

  // Code review: while the grades can only narrow, the choice is kept inside the saved range, so the
  // lists (which then have no "Any") show what is held and what is sent. A side saved as "Any" is
  // the lowest or highest grade, which is what the server stored for it.
  const narrowMin = slots.narrowTo?.min ?? null
  const narrowMax = slots.narrowTo?.max ?? null
  useEffect(() => {
    if (narrowMin === null || narrowMax === null || !isInitialized) return
    const clamp = (g: number | null, fallback: number) =>
      Math.min(narrowMax, Math.max(narrowMin, g ?? fallback))
    const min = clamp(gradeMin, narrowMin)
    const max = clamp(gradeMax, narrowMax)
    if (min !== gradeMin) setGradeMin(min)
    if (max !== gradeMax) setGradeMax(max)
  }, [narrowMin, narrowMax, gradeMin, gradeMax, isInitialized])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Code review: a refusal from an earlier Save is not this Save's
    setRefusal(null)
    setSaveCount((n) => n + 1)

    if (!validateForm()) {
      return
    }

    // Story 1.85: a change the form already knows does not fit is not sent (as on a new search)
    if (slots.shortNow) {
      setAttempted(true)
      return
    }

    setIsSubmitting(true)

    try {
      await updateSearch.mutateAsync({
        id: searchId,
        data: {
          // Story 1.18: same reasoning as new/page.tsx -- the REAL series
          // id, whether picked directly or resolved via an Alias Group.
          seriesId: issueValue.resolvedSeriesId ?? selectedSeries!.id,
          aliasGroupId: selectedSeries!.type === 'aliasGroup' ? selectedSeries!.id : null,
          issueNumber: issueValue.issueNumber,
          issueId: issueValue.issueId,
          issueVolumeText: issueValue.issueVolumeText,
          issuePublicationYear: issueValue.issuePublicationYear,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          // Story 1.84: "Any" is sent as null; the server fills it with its lowest or highest grade.
          // Without the grade list the grade is not sent at all, so the server keeps the saved one
          // exactly as it is, whatever happened on screen before the list went (code review).
          ...(grades.grades ? { gradeMin, gradeMax } : {}),
          pageQuality: pageQuality === 'Any' ? null : pageQuality,
          gradingAuthority: gradingAuthority === 'Any' ? null : gradingAuthority,
          platforms,
        },
      })

      router.push('/searches')
    } catch (error) {
      const refused = readRefusal(error)
      // Story 1.85: the search went on hold while the form was open: the held page follows, saying
      // the changes were not saved (mockup 8); the search and the account are read again
      if (refused?.kind === 'held') {
        setHeldOnSave({ reason: refused.heldReason })
        queryClient.invalidateQueries({ queryKey: ['searches'] })
        queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
        return
      }
      // Story 1.85: a slot refusal is shown as drawn, with its details (need 21)
      if (refused?.kind === 'slot_limit') {
        setRefusal(refused)
        queryClient.invalidateQueries({ queryKey: ACCOUNT_SUMMARY_KEY })
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to update search'
      setErrors({ submit: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Code review fix: also waits on the platform registry -- otherwise a
  // search that loads faster than the registry (a plausible, uncorrelated
  // race) briefly shows a fully-populated form with an empty, disabled
  // Platforms section and no indication it's still loading.
  if (isLoadingSearch || isLoadingPlatforms || grades.isLoading || isLoadingAccount) {
    return (
      <SearchFormPage>
        <SearchFormSkeleton label="Loading search" />
      </SearchFormPage>
    )
  }

  if (!search) {
    return (
      <SearchFormPage>
        <div className="py-12 text-center">
          <h1 className="mb-4 text-page-title-sm font-bold text-ink">Search Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The search you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/searches" className={BUTTON_PRIMARY}>
            Back to Searches
          </Link>
        </div>
      </SearchFormPage>
    )
  }

  // Story 1.85: a held search cannot be changed: its page shows it read-only, with Delete (mockup 8)
  if (heldOnSave || search.held) {
    return (
      <HeldSearchView
        search={search}
        reason={heldOnSave?.reason ?? search.heldReason ?? null}
        notSaved={!!heldOnSave}
      />
    )
  }

  return (
    <SearchFormPage
      title="Edit Search"
      lede="Update your grail search criteria"
      aside={slots.badge !== null && <SlotBadge available={slots.badge} edit />}
    >
      {slots.notice && (
        <FormNotice key={`${saveCount}-${slots.notice.heading}`} notice={slots.notice} />
      )}
      <SubmitError message={errors.submit} />

      <form onSubmit={handleSubmit} aria-label="Edit Search" className={FORM_CARD}>
        {/* Series Autocomplete */}
        <SeriesAutocomplete
          value={selectedSeries}
          onSelect={(series) => {
            // Story 1.16: reset the resolved issue pick when the user
            // actively changes the series (not on the initial prefill
            // above, which sets both together from the loaded search)
            // -- issueId is a real FK into comic_issues, so carrying a
            // stale pick forward would submit a mismatched pair.
            setSelectedSeries(series)
            setIssueValue(EMPTY_ISSUE_VALUE)
          }}
          error={errors.series}
          required
        />

        {/* Issue Number */}
        <div>
          <RequiredLabel htmlFor="issueNumber">Issue Number</RequiredLabel>
          {selectedSeries ? (
            <IssueSelector
              source={issueSource!}
              seriesTitle={selectedSeries.title}
              value={issueValue}
              onChange={setIssueValue}
              error={errors.issueNumber}
            />
          ) : (
            <>
              <p className="text-[15px] text-muted-foreground">Select a series first.</p>
              {/* Code review finding: this duplicated IssueSelector's
                  own error rendering once a series is selected -- kept
                  only for the no-series-yet placeholder branch above,
                  the one case where IssueSelector doesn't render at
                  all to show it itself. */}
              {errors.issueNumber && (
                <p className="mt-1.5 text-[13px] text-danger">{errors.issueNumber}</p>
              )}
            </>
          )}
        </div>

        {/* Grade, from the server (Story 1.84) */}
        <GradeRangeSelector
          grades={grades.grades}
          failed={grades.failed}
          retrying={grades.isRetrying}
          failedAt={grades.failedAt}
          onRetry={grades.retry}
          mode="edit"
          savedGradeText={gradeText(search.gradeMin, search.gradeMax)}
          savedSlots={search.slotsUsed}
          gradeMin={gradeMin}
          gradeMax={gradeMax}
          onChange={(min, max) => {
            setGradeMin(min)
            setGradeMax(max)
            setAttempted(false)
            setRefusal(null)
          }}
          error={errors.gradeRange}
          narrowTo={slots.narrowTo}
          describedBy="slot-count"
        >
          {slots.narrowTo && !grades.failed && <NarrowOnlyLine />}
          {!grades.failed && (
            <SlotCount
              id="slot-count"
              hint={slots.hint}
              alert={slots.alert}
              final={slots.hintFinal}
            />
          )}
        </GradeRangeSelector>

        <OtherCriteriaFields
          pageQuality={pageQuality}
          onPageQualityChange={setPageQuality}
          gradingAuthority={gradingAuthority}
          onGradingAuthorityChange={setGradingAuthority}
          maxPriceValue={maxPriceDisplay || maxPrice}
          onMaxPriceChange={handleMaxPriceChange}
          onMaxPriceFocus={handleMaxPriceFocus}
          onMaxPriceBlur={handleMaxPriceBlur}
        />

        <CriteriaHelperText
          pageQuality={pageQuality}
          gradingAuthority={gradingAuthority}
          maxPrice={maxPrice}
        />

        <div className="border-t border-line pt-6">
          <PlatformSelector
            platforms={platforms}
            onChange={setPlatforms}
            error={errors.platforms}
          />
        </div>

        <SaveRow
          saveLabel="Update Search"
          savingLabel="Saving..."
          isSubmitting={isSubmitting}
          disabled={!isFormValid()}
          why={slots.why}
        />
      </form>
    </SearchFormPage>
  )
}
