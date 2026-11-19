'use client'

/**
 * Story 1.104: the shared pieces of Settings, the design's `panel`, `st-row`, `st-k`, `st-note`,
 * `saved` and `qh-*` classes (settings-page.html) translated to the app's token classes.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export const PANEL =
  'flex min-w-0 scroll-mt-24 flex-col gap-3.5 rounded-card border border-line bg-surface px-4 py-5 shadow-sm tablet:px-6'
export const SECTION_TITLE = 'text-[19px] font-bold text-ink'
export const ROW =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-t border-line py-3.5 first:border-t-0 first:pt-1'
export const KEY = 'text-base font-semibold text-ink'
export const VALUE = 'text-[15px] text-ink [overflow-wrap:anywhere]'
export const NOTE = 'text-sm text-muted-foreground'
export const FULL = 'col-span-2'
export const OUTLINE =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink no-underline hover:bg-chip disabled:cursor-not-allowed disabled:opacity-60'
export const FILLED =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline disabled:cursor-not-allowed disabled:opacity-60'
export const DANGER_OUTLINE =
  'inline-flex min-h-touch items-center justify-center self-start rounded-button border-[1.5px] border-danger bg-surface px-[18px] text-[15px] font-semibold text-danger no-underline'
export const CANCEL_LINK =
  'inline-flex min-h-touch items-center text-[15px] font-semibold text-link underline underline-offset-[3px] disabled:opacity-60'
export const FIELD_LABEL = 'mb-1.5 block text-sm font-semibold text-ink'
export const FIELD =
  'block h-12 w-full rounded-lg border-[1.5px] border-line-strong bg-surface px-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-ring aria-[invalid=true]:border-danger'
export const FIELD_ERROR = 'text-sm font-semibold text-danger'

export function Tick({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

/** "Saved" with the tick, as drawn; or the row's error. Always in the DOM as a status region. */
export function RowStatus({
  saved,
  error,
  savedText = 'Saved',
}: {
  saved: boolean
  error: string | null
  savedText?: string
}) {
  return (
    <p role="status" className={`${FULL} empty:hidden`}>
      {error ? (
        <span className="text-sm font-semibold text-danger">{error}</span>
      ) : saved ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span className="text-primary">
            <Tick />
          </span>
          {savedText}
        </span>
      ) : null}
    </p>
  )
}

/** A flag that turns itself off after `ms` (the "Saved" that fades after 4 seconds). */
export function useFlash(ms = 4000): [boolean, () => void, () => void] {
  const [on, setOn] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  const show = useCallback(() => {
    setOn(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOn(false), ms)
  }, [ms])
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setOn(false)
  }, [])
  return [on, show, hide]
}

/** The information panel (`attn tone-info`), used for the pending email change. */
export function InfoPanel({
  heading,
  children,
  actions,
}: {
  heading: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <div
      role="status"
      className={`${FULL} grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-card border border-line-strong bg-surface p-4 text-ink`}
    >
      <div className="pt-0.5 text-info-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-bold">{heading}</p>
        {children}
      </div>
      {actions && (
        <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2">{actions}</div>
      )}
    </div>
  )
}

/** The eye button beside a password field (an outline icon, as drawn). */
export function EyeButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
        {shown && <path d="M4 4l16 16" />}
      </svg>
    </button>
  )
}
