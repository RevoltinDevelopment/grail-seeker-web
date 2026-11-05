'use client'

import { useId } from 'react'
import Link from 'next/link'

import {
  BackArrowIcon,
  BUTTON_OUTLINE,
  BUTTON_PRIMARY,
  CheckIcon,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  SELECT,
  SelectWrap,
  WarnIcon,
} from './formStyles'

/**
 * Story 1.84 (S-04): the pieces Create New Search and Edit Search share, drawn from the approved
 * design (search-form-start.html, search-form-could-not-load.html).
 */

/** The page: 20px below the header, the centred form column, "Back to Searches", then the title. */
export function SearchFormPage({
  title,
  lede,
  children,
}: {
  title?: string
  lede?: string
  children: React.ReactNode
}) {
  return (
    <div className="container-custom flex max-w-[704px] flex-col gap-5 pb-12 pt-5">
      <Link
        href="/searches"
        className="inline-flex min-h-touch items-center gap-1.5 self-start text-[15px] font-semibold text-link hover:underline"
      >
        <BackArrowIcon />
        Back to Searches
      </Link>
      {title && (
        <div>
          <h1 className="text-page-title-sm font-bold tracking-[-0.01em] text-ink tablet:text-page-title">{title}</h1>
          {lede && <p className="mt-1.5 text-[15px] text-muted-foreground">{lede}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

/** .of-card; the design widens it from 700px (code review) */
export const FORM_CARD =
  'flex w-full flex-col gap-6 rounded-card border border-line bg-surface px-4 py-6 shadow-sm tablet:p-8'

/** The loading form (mockup 7, "Loading"): the card's shape, nothing to act on. */
export function SearchFormSkeleton({ label }: { label: string }) {
  const bars = ['w-[120px] h-4', 'w-full h-12', 'w-[110px] h-4', 'w-full h-12', 'w-[60px] h-4', 'w-full h-12', 'w-full h-[72px]', 'w-full h-12']
  return (
    <div role="status" className={FORM_CARD}>
      <span className="sr-only">{label}</span>
      {bars.map((size, i) => (
        <span key={i} aria-hidden="true" className={`block animate-pulse rounded-button bg-chip motion-reduce:animate-none ${size}`} />
      ))}
    </div>
  )
}

/** A required field's label: the red star, and "(required)" for screen readers. */
export function RequiredLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={FIELD_LABEL}>
      {children}{' '}
      <span className="text-danger" aria-hidden="true">
        *
      </span>
      <span className="sr-only">(required)</span>
    </label>
  )
}

export const PAGE_QUALITY_OPTIONS = [
  'Any',
  'White',
  'Off-White to White',
  'Off-White',
  'Cream to Off-White',
  'Cream',
  'Tan',
  'Brown',
]

export const GRADING_AUTHORITY_OPTIONS = ['Any', 'CGC', 'CBCS', 'PGX']

/** Page Quality, Graded by and Maximum Price, as drawn. */
export function OtherCriteriaFields({
  pageQuality,
  onPageQualityChange,
  gradingAuthority,
  onGradingAuthorityChange,
  maxPriceValue,
  onMaxPriceChange,
  onMaxPriceFocus,
  onMaxPriceBlur,
}: {
  pageQuality: string
  onPageQualityChange: (value: string) => void
  gradingAuthority: string
  onGradingAuthorityChange: (value: string) => void
  maxPriceValue: string
  onMaxPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onMaxPriceFocus: () => void
  onMaxPriceBlur: () => void
}) {
  return (
    <>
      <div>
        <label htmlFor="pageQuality" className={FIELD_LABEL}>
          Page Quality
        </label>
        <SelectWrap>
          <select id="pageQuality" value={pageQuality} onChange={(e) => onPageQualityChange(e.target.value)} className={SELECT}>
            {PAGE_QUALITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </SelectWrap>
      </div>

      <div>
        <label htmlFor="gradingAuthority" className={FIELD_LABEL}>
          Graded by
        </label>
        <SelectWrap>
          <select
            id="gradingAuthority"
            value={gradingAuthority}
            onChange={(e) => onGradingAuthorityChange(e.target.value)}
            className={SELECT}
          >
            {GRADING_AUTHORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </SelectWrap>
      </div>

      <div>
        <label htmlFor="maxPrice" className={FIELD_LABEL}>
          Maximum Price
        </label>
        <input
          id="maxPrice"
          type="text"
          inputMode="decimal"
          value={maxPriceValue}
          onChange={onMaxPriceChange}
          onFocus={onMaxPriceFocus}
          onBlur={onMaxPriceBlur}
          placeholder="Any"
          className={FIELD}
        />
        <p className={FIELD_HINT}>Optional - leave blank to see all prices</p>
      </div>
    </>
  )
}

/** .btn[aria-disabled], .btn[disabled]: the design's dashed look for a button that cannot be pressed */
const BUTTON_OFF =
  'inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-button border-[1.5px] border-dashed border-line-strong bg-background px-[18px] text-[15px] font-semibold text-muted-foreground'

/** The save row: the reason Save cannot be pressed (when there is one), Cancel and Save, "* Required fields". */
export function SaveRow({
  saveLabel,
  savingLabel,
  isSubmitting,
  disabled,
  why,
}: {
  saveLabel: string
  savingLabel: string
  isSubmitting: boolean
  /** The form is not complete yet */
  disabled: boolean
  /**
   * Why Save cannot be pressed, said beside it (search-form.js, .save-why). With a reason, the button
   * stays focusable (aria-disabled), so a screen reader reaches it and hears the reason (code review).
   */
  why?: string
}) {
  const whyId = useId()
  const off = disabled || !!why
  return (
    <>
      <div className="flex flex-col gap-2.5 border-t border-line pt-6">
        {why && (
          <p id={whyId} className="flex items-start gap-2 text-sm font-semibold text-ink">
            <span className="mt-0.5 flex-none text-attention-line">
              <WarnIcon />
            </span>
            <span>{why}</span>
          </p>
        )}
        <div className="flex gap-4">
          <Link href="/searches" className={`${BUTTON_OUTLINE} flex-1`}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || (disabled && !why)}
            aria-disabled={off || undefined}
            aria-describedby={why ? whyId : undefined}
            onClick={(e) => {
              if (off) e.preventDefault()
            }}
            className={`${off ? BUTTON_OFF : BUTTON_PRIMARY} flex-1 disabled:cursor-wait`}
          >
            {isSubmitting ? savingLabel : saveLabel}
            {!isSubmitting && <CheckIcon />}
          </button>
        </div>
      </div>
      <p className="text-center text-[13px] text-muted-foreground">
        <span aria-hidden="true">*</span> Required fields
      </p>
    </>
  )
}

/** A save the server refused: its words, above the form. */
export function SubmitError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-[10px] border border-danger bg-surface px-4 py-3 text-[15px] text-danger">
      {message}
    </div>
  )
}
