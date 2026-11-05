'use client'

import { useId } from 'react'

import type { PickTally } from '@/lib/pickScreen'

/**
 * Story 1.86 (S-12): "Your choice" (pick-screen.js tally(); grail-seeker.css .tally). From 1000px a
 * panel beside the cards, always shown; below, a bar pinned to the bottom of the screen, hidden until
 * the first Keep and then kept (Mahan, 2026-10-20).
 */
export function PickTallyPanel({
  tally,
  cap,
  keptSlots,
  sentence,
  previewFailed,
  onRetryPreview,
  idle,
  saving,
  onConfirm,
}: {
  tally: PickTally
  cap: number
  keptSlots: number
  sentence: string
  previewFailed: boolean
  onRetryPreview: () => void
  /** Nothing has been kept yet: the phone bar waits */
  idle: boolean
  saving: boolean
  onConfirm: () => void
}) {
  const noteId = useId()
  const off = !tally.canConfirm || saving
  const segs = Array.from({ length: cap }, (_, i) => (i < keptSlots ? 'in' : 'free'))
  return (
    <aside
      aria-label="Your choice"
      className={`${idle ? 'hidden' : 'flex'} shadow-bar sticky bottom-0 z-[2] -mx-4 flex-col gap-2.5 border-t border-line-strong bg-surface p-4 tablet:-mx-8 tablet:px-8 desktop:sticky desktop:bottom-auto desktop:top-4 desktop:mx-0 desktop:flex desktop:gap-3 desktop:rounded-card desktop:border desktop:border-line desktop:p-5 desktop:!shadow-sm`}
    >
      <p className="text-xs font-bold uppercase tracking-[.06em] text-muted-foreground">
        {tally.label}
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xl font-bold text-ink" aria-live="polite">
          {tally.count}
        </p>
        <p className="inline-flex items-center gap-1.5 text-[15px] font-bold text-ink">
          {tally.tone === 'over' && (
            <svg
              className="text-over"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4l9 16H3z" />
              <path d="M12 10v4M12 17v.5" />
            </svg>
          )}
          {tally.tone === 'fits' && (
            <svg
              className="text-primary"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
          <span>{tally.status}</span>
        </p>
      </div>
      <div
        role="img"
        aria-label={`${keptSlots} of ${cap} slots chosen${tally.over ? `, ${tally.over} too many` : ''}`}
        className="flex min-w-0 flex-nowrap items-center gap-1"
      >
        {segs.map((k, i) => (
          <span
            key={i}
            data-seg={k}
            className={`h-[14px] min-w-[5px] shrink basis-[22px] rounded-[3px] border-[1.5px] ${k === 'in' ? 'border-primary bg-primary' : 'border-muted-foreground bg-surface'}`}
          />
        ))}
        <span className="mx-1 h-[26px] w-0.5 flex-none rounded-sm bg-ink" data-testid="limit" />
        {Array.from({ length: tally.over }, (_, i) => (
          <span
            key={`o${i}`}
            data-seg="over"
            className="seg-over h-[14px] min-w-[5px] shrink basis-[22px] rounded-[3px] border-[1.5px]"
          />
        ))}
      </div>
      {sentence && <p className="text-sm text-ink">{sentence}</p>}
      {previewFailed && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-attention-line bg-attention p-3 text-sm text-attention-ink"
        >
          <strong className="text-[15px]">We could not check this choice just now.</strong>
          <span>
            Your choices are kept, and the total comes from your searches. You can still confirm:
            your choice is checked again when you do.
          </span>
          <button
            type="button"
            onClick={onRetryPreview}
            className="inline-flex min-h-touch items-center justify-center self-start rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink"
          >
            Try again
          </button>
        </div>
      )}
      <button
        type="button"
        aria-disabled={off || undefined}
        aria-describedby={noteId}
        onClick={() => {
          if (!off) onConfirm()
        }}
        className={`inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] px-[18px] text-[15px] font-semibold ${
          off
            ? 'cursor-not-allowed border-dashed border-line-strong bg-background text-muted-foreground'
            : 'border-transparent bg-primary text-primary-foreground'
        }`}
      >
        {saving ? 'Saving...' : tally.button}
      </button>
      <p id={noteId} className="text-sm text-muted-foreground">
        {tally.note}
      </p>
      <p className="hidden text-sm text-muted-foreground desktop:block">
        Nothing is saved until you confirm.
      </p>
    </aside>
  )
}
