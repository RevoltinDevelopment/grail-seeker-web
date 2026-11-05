'use client'

import type { GradeOption } from '@/lib/api/grades'

import { BUTTON_OUTLINE, FIELD_ERROR, FIELD_HINT, FIELD_LABEL, SELECT, SelectWrap } from './formStyles'

interface GradeRangeSelectorProps {
  /** The grades from GET /api/grades (Story 1.84); null while loading or when they could not be loaded */
  grades: GradeOption[] | null
  /** The grades could not be loaded: the form says so and keeps no list of its own (S-04 AC 2) */
  failed?: boolean
  /** A Try again is in flight */
  retrying?: boolean
  /** Changes with each failed attempt, so the failure is announced again (code review) */
  failedAt?: number
  onRetry?: () => void
  /** On an edit, a failed list keeps the saved grade, which stays as it is */
  mode?: 'new' | 'edit'
  /** The saved grade in numbers ("9.0 to 9.4"), shown on an edit when the list could not be loaded */
  savedGradeText?: string
  /** The slots the saved search uses, from the search itself */
  savedSlots?: number
  gradeMin: number | null
  gradeMax: number | null
  onChange: (gradeMin: number | null, gradeMax: number | null) => void
  error?: string
}

/**
 * Grade, on the search form (Story 1.84, S-04): Minimum "to" Maximum, each listing "Any" and then the
 * server's grades with their labels. Drawn from the approved design (search-form-start.html; the
 * failure from search-form-could-not-load.html).
 */
export function GradeRangeSelector({
  grades,
  failed = false,
  retrying = false,
  failedAt,
  onRetry,
  mode = 'new',
  savedGradeText,
  savedSlots,
  gradeMin,
  gradeMax,
  onChange,
  error,
}: GradeRangeSelectorProps) {
  // Auto-correction per Product Owner requirements: a Minimum above the Maximum moves the Maximum up
  // to it, and the reverse. "Any" (null) on either side is never corrected.
  const handleGradeMinChange = (newMin: number | null) => {
    const adjustedMax = newMin !== null && gradeMax !== null && newMin > gradeMax ? newMin : gradeMax
    onChange(newMin, adjustedMax)
  }

  const handleGradeMaxChange = (newMax: number | null) => {
    const adjustedMin = newMax !== null && gradeMin !== null && newMax < gradeMin ? newMax : gradeMin
    onChange(adjustedMin, newMax)
  }

  // A select's value must match an option's value exactly, so both are written with one decimal.
  const valueOf = (grade: number | null) => (grade === null ? '' : Number(grade).toFixed(1))

  // Code review: a saved grade the server's list does not have would otherwise show as "Any"
  // while the form still held it. It is shown for what it is; the server refuses it on save.
  const offList = (grade: number | null) =>
    grade !== null && !(grades ?? []).some((g) => g.value.toFixed(1) === valueOf(grade))

  const options = (side: 'min' | 'max', current: number | null) => (
    <>
      <option value="">Any</option>
      {offList(current) && (
        <option value={valueOf(current)}>{valueOf(current)} - not a standard grade</option>
      )}
      {(grades ?? []).map((g) => (
        <option key={`${side}-${g.value}`} value={g.value.toFixed(1)}>
          {g.label}
        </option>
      ))}
    </>
  )
  const parse = (v: string) => (v === '' ? null : parseFloat(v))
  const selectClass = `${SELECT} ${error ? 'border-danger' : ''}`

  return (
    <div role="group" aria-labelledby="grade-label">
      <span id="grade-label" className={FIELD_LABEL}>
        Grade
      </span>

      {grades && !failed && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-3">
          <div>
            <SelectWrap>
              <select
                aria-label="Minimum grade"
                aria-invalid={error ? true : undefined}
                value={valueOf(gradeMin)}
                onChange={(e) => handleGradeMinChange(parse(e.target.value))}
                className={selectClass}
              >
                {options('min', gradeMin)}
              </select>
            </SelectWrap>
            <p className={FIELD_HINT}>Minimum</p>
          </div>

          <span className="pt-3 text-[15px] text-muted-foreground">to</span>

          <div>
            <SelectWrap>
              <select
                aria-label="Maximum grade"
                aria-invalid={error ? true : undefined}
                value={valueOf(gradeMax)}
                onChange={(e) => handleGradeMaxChange(parse(e.target.value))}
                className={selectClass}
              >
                {options('max', gradeMax)}
              </select>
            </SelectWrap>
            <p className={FIELD_HINT}>Maximum</p>
          </div>
        </div>
      )}

      {failed && (
        <>
          {mode === 'edit' && savedGradeText && (
            <p className="mb-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-[10px] border border-line bg-background px-3.5 py-2.5 text-[15px]">
              <strong className="font-semibold text-ink">{savedGradeText}</strong>
              <span className="text-muted-foreground">
                saved grade
                {savedSlots !== undefined ? `, ${savedSlots} ${savedSlots === 1 ? 'slot' : 'slots'}` : ''}
              </span>
            </p>
          )}
          <div
            key={failedAt}
            role="alert"
            className="flex flex-col gap-2 rounded-[10px] border border-attention-line bg-attention px-3.5 py-3 text-sm text-attention-ink"
          >
            <strong className="text-[15px]">The list of grades could not be loaded</strong>
            <span>
              {mode === 'edit'
                ? 'The grade cannot be changed right now. Everything else on this search can, and its grade stays as it is.'
                : 'This search cannot be saved until they load. Nothing you entered is lost.'}
            </span>
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className={`${BUTTON_OUTLINE} self-start disabled:cursor-wait disabled:opacity-60`}
            >
              {retrying ? 'Trying again...' : 'Try again'}
            </button>
          </div>
        </>
      )}

      {error && <p className={FIELD_ERROR}>{error}</p>}
    </div>
  )
}
