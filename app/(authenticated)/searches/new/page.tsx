'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CriteriaHelperText } from '@/components/search/CriteriaHelperText'
import { GradeRangeSelector } from '@/components/search/GradeRangeSelector'
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
import { useGrades } from '@/hooks/useGrades'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useSearches } from '@/hooks/useSearches'
import type { IssueSource } from '@/lib/api/issues'
import type { ComicSeries } from '@/types/search.types'

const EMPTY_ISSUE_VALUE: IssueSelectorValue = {
  issueNumber: '',
  issueId: null,
  issueVolumeText: null,
  issuePublicationYear: null,
  resolvedSeriesId: null,
}

export default function CreateSearchPage() {
  const router = useRouter()
  const { createSearch } = useSearches()
  // Story 1.49: platforms now default from the live registry's real
  // defaultEnabledSlugs, not the hardcoded ACTIVE_PLATFORMS array.
  const { defaultEnabledSlugs, isLoading: isLoadingPlatforms } = usePlatforms()
  // Story 1.84 (S-04): the grades come from the server; there is no list of our own to fall back to
  const grades = useGrades()

  const [selectedSeries, setSelectedSeries] = useState<ComicSeries | null>(null)
  const [issueValue, setIssueValue] = useState<IssueSelectorValue>(EMPTY_ISSUE_VALUE)
  const [gradeMin, setGradeMin] = useState<number | null>(null) // Default "Any" (null)
  const [gradeMax, setGradeMax] = useState<number | null>(null) // Default "Any" (null)
  const [pageQuality, setPageQuality] = useState('Any')
  const [gradingAuthority, setGradingAuthority] = useState('Any')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [maxPriceDisplay, setMaxPriceDisplay] = useState<string>('')
  const [platforms, setPlatforms] = useState<string[]>([])

  // defaultEnabledSlugs resolves asynchronously (React Query) -- prefill
  // exactly once, the moment it's ready, mirroring the edit page's own
  // isInitialized-gated prefill pattern. Guarded so a later refetch never
  // clobbers a subscriber's in-progress selection.
  useEffect(() => {
    if (!isLoadingPlatforms && platforms.length === 0 && defaultEnabledSlugs.length > 0) {
      setPlatforms(defaultEnabledSlugs)
    }
  }, [isLoadingPlatforms, defaultEnabledSlugs, platforms.length])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        ? { kind: selectedSeries.type === 'aliasGroup' ? 'aliasGroup' : 'series', id: selectedSeries.id }
        : null,
    [selectedSeries]
  )

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
  // Story 1.16: IssueSelector guarantees issueValue.issueNumber is only
  // ever non-empty when genuinely valid -- for the legacy (no GCD data)
  // path, it already checks the same number-or-"nn" pattern internally
  // before propagating a value up; for the picker path, a resolved value
  // only ever comes from a confirmed real issue match. A single non-empty
  // check here is enough for both, so the page doesn't re-implement or
  // duplicate that validation logic.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !grades.grades) {
      return
    }

    setIsSubmitting(true)

    try {
      await createSearch.mutateAsync({
        // Story 1.18: the REAL series id, whether picked directly or
        // resolved via an Alias Group -- resolvedSeriesId is set the
        // moment a pick resolves (mirroring issueId's null-until-resolved
        // shape); falling back to selectedSeries!.id covers the
        // one-shot/loading window before a pick has ever resolved for a
        // plain series (where the two values are the same anyway).
        seriesId: issueValue.resolvedSeriesId ?? selectedSeries!.id,
        aliasGroupId: selectedSeries!.type === 'aliasGroup' ? selectedSeries!.id : null,
        issueNumber: issueValue.issueNumber,
        issueId: issueValue.issueId,
        issueVolumeText: issueValue.issueVolumeText,
        issuePublicationYear: issueValue.issuePublicationYear,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        // Story 1.84: "Any" is sent as null; the server fills it with its lowest or highest grade
        gradeMin,
        gradeMax,
        pageQuality: pageQuality === 'Any' ? null : pageQuality,
        gradingAuthority: gradingAuthority === 'Any' ? null : gradingAuthority,
        platforms,
      })

      router.push('/searches')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create search'
      setErrors({ submit: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (grades.isLoading) {
    return (
      <SearchFormPage>
        <SearchFormSkeleton label="Loading the search form" />
      </SearchFormPage>
    )
  }

  return (
    <SearchFormPage title="Create New Search" lede="What book are you seeking?">
      <SubmitError message={errors.submit} />

      <form onSubmit={handleSubmit} aria-label="Create New Search" className={FORM_CARD}>
        {/* Series Autocomplete */}
        <SeriesAutocomplete
          value={selectedSeries}
          onSelect={(series) => {
            // Story 1.16: reset the resolved issue pick on series
            // change -- issueId is now a real FK into comic_issues, so
            // carrying a stale pick from the previous series forward
            // would submit a search whose issueId belongs to a
            // different series than its own seriesId.
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
              {errors.issueNumber && <p className="mt-1.5 text-[13px] text-danger">{errors.issueNumber}</p>}
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
          gradeMin={gradeMin}
          gradeMax={gradeMax}
          onChange={(min, max) => {
            setGradeMin(min)
            setGradeMax(max)
          }}
          error={errors.gradeRange}
        />

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

        <CriteriaHelperText pageQuality={pageQuality} gradingAuthority={gradingAuthority} maxPrice={maxPrice} />

        <div className="border-t border-line pt-6">
          <PlatformSelector platforms={platforms} onChange={setPlatforms} error={errors.platforms} />
        </div>

        <SaveRow
          saveLabel="Save Search"
          savingLabel="Saving..."
          isSubmitting={isSubmitting}
          disabled={!isFormValid()}
          // Story 1.84: a search can be saved once the grades have loaded (S-04 AC 2); handleSubmit checks too
          why={grades.grades ? undefined : 'A search can be saved once the grades have loaded.'}
        />
      </form>
    </SearchFormPage>
  )
}
