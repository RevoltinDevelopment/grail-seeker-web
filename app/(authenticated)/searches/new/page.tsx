'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CriteriaHelperText } from '@/components/search/CriteriaHelperText'
import { GradeRangeSelector } from '@/components/search/GradeRangeSelector'
import { IssueSelector, type IssueSelectorValue } from '@/components/search/IssueSelector'
import { PlatformSelector } from '@/components/search/PlatformSelector'
import { SeriesAutocomplete } from '@/components/search/SeriesAutocomplete'
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

const PAGE_QUALITY_OPTIONS = [
  'Any',
  'White',
  'Off-White to White',
  'Off-White',
  'Cream to Off-White',
  'Cream',
  'Tan',
  'Brown',
]

const GRADING_AUTHORITY_OPTIONS = ['Any', 'CGC', 'CBCS', 'PGX']

export default function CreateSearchPage() {
  const router = useRouter()
  const { createSearch } = useSearches()

  const [selectedSeries, setSelectedSeries] = useState<ComicSeries | null>(null)
  const [issueValue, setIssueValue] = useState<IssueSelectorValue>(EMPTY_ISSUE_VALUE)
  const [gradeMin, setGradeMin] = useState<number | null>(null) // Default "Any" (null)
  const [gradeMax, setGradeMax] = useState<number | null>(null) // Default "Any" (null)
  const [pageQuality, setPageQuality] = useState('Any')
  const [gradingAuthority, setGradingAuthority] = useState('Any')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [maxPriceDisplay, setMaxPriceDisplay] = useState<string>('')
  const [platforms, setPlatforms] = useState(['ebay', 'heritage'])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Story 1.18: selectedSeries.type is now meaningfully 'series' |
  // 'aliasGroup' (Story 1.17's repurposed field) -- derive IssueSelector's
  // fetch source from it directly, no new state needed.
  const issueSource: IssueSource | null = selectedSeries
    ? { kind: selectedSeries.type === 'aliasGroup' ? 'aliasGroup' : 'series', id: selectedSeries.id }
    : null

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

    if (!validateForm()) {
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
        gradeMin: gradeMin === null ? 0.5 : gradeMin, // Convert "Any" to 0.5 on submit
        gradeMax: gradeMax === null ? 10.0 : gradeMax, // Convert "Any" to 10.0 on submit
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="container-custom">
          <Link href="/searches" className="text-sm text-collector-blue hover:underline">
            ← Back to Searches
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom max-w-2xl py-12">
        <h1 className="mb-2 text-3xl font-bold">Create New Search</h1>
        <p className="mb-8 text-slate-600">What book are you seeking?</p>

        {errors.submit && (
          <div className="mb-6 rounded-md border border-error-red bg-red-50 p-4 text-error-red">
            {errors.submit}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="space-y-6">
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
              <label
                htmlFor="issueNumber"
                className="mb-2 block text-sm font-medium text-slate-950"
              >
                Issue Number <span className="text-error-red">*</span>
              </label>
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
                  <p className="text-sm text-slate-500">Select a series first.</p>
                  {/* Code review finding: this duplicated IssueSelector's
                      own error rendering once a series is selected -- kept
                      only for the no-series-yet placeholder branch above,
                      the one case where IssueSelector doesn't render at
                      all to show it itself. */}
                  {errors.issueNumber && (
                    <p className="mt-1 text-xs text-error-red">{errors.issueNumber}</p>
                  )}
                </>
              )}
            </div>

            {/* Grade Range */}
            <GradeRangeSelector
              gradeMin={gradeMin}
              gradeMax={gradeMax}
              onChange={(min, max) => {
                setGradeMin(min)
                setGradeMax(max)
              }}
              error={errors.gradeRange}
            />

            {/* Page Quality */}
            <div>
              <label
                htmlFor="pageQuality"
                className="mb-2 block text-sm font-medium text-slate-950"
              >
                Page Quality
              </label>
              <select
                id="pageQuality"
                value={pageQuality}
                onChange={(e) => setPageQuality(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue"
              >
                {PAGE_QUALITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Grading Authority */}
            <div>
              <label
                htmlFor="gradingAuthority"
                className="mb-2 block text-sm font-medium text-slate-950"
              >
                Grading Authority
              </label>
              <select
                id="gradingAuthority"
                value={gradingAuthority}
                onChange={(e) => setGradingAuthority(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue"
              >
                {GRADING_AUTHORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Maximum Price */}
            <div>
              <label htmlFor="maxPrice" className="mb-2 block text-sm font-medium text-slate-950">
                Maximum Price
              </label>
              <input
                id="maxPrice"
                type="text"
                value={maxPriceDisplay || maxPrice}
                onChange={handleMaxPriceChange}
                onFocus={handleMaxPriceFocus}
                onBlur={handleMaxPriceBlur}
                placeholder="Any"
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-collector-blue"
              />
              <p className="mt-1 text-xs text-slate-600">
                Optional - leave blank to see all prices
              </p>
            </div>

            <CriteriaHelperText
              pageQuality={pageQuality}
              gradingAuthority={gradingAuthority}
              maxPrice={maxPrice}
            />

            {/* Divider */}
            <div className="border-t border-slate-200 pt-6">
              <PlatformSelector
                platforms={platforms}
                onChange={setPlatforms}
                error={errors.platforms}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 pt-6">
              {/* Action Buttons - Macintosh Style (Cancel left, CTA right) */}
              <div className="flex gap-4">
                <Link
                  href="/searches"
                  className="flex-1 rounded-md border-2 border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid()}
                  className="flex-1 rounded-md bg-collector-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Search ✓'}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">* Required fields</p>
        </form>
      </main>
    </div>
  )
}
