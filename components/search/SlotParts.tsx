'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

import type { FormNoticeModel, SlotAlert } from '@/lib/formSlots'

import { InfoIcon, WarnIcon } from './formStyles'

/**
 * Story 1.85 (S-10): the search form's slot parts, as drawn (search-form.js; grail-seeker.css
 * .slot-badge, .of-count, .cnt, .meter, .legend, .attn, .narrow-only). The words and numbers come
 * from lib/formSlots.ts; these only draw them.
 */

/** "Search Slots", the number, "Available" (on an edit, "Available / To This Search"). */
export function SlotBadge({ available, edit }: { available: number; edit: boolean }) {
  const small = 'text-xs font-bold uppercase leading-[1.3] tracking-[.05em] text-muted-foreground'
  return (
    <div
      role="group"
      aria-label={`Search slots: ${available} available${edit ? ' to this search' : ''}`}
      className="min-w-[112px] flex-none rounded-card border-[1.5px] border-line-strong bg-surface px-3.5 py-2 text-center"
    >
      <p className={small} aria-hidden="true">
        Search Slots
      </p>
      <p
        className="my-0.5 text-[34px] font-bold tabular-nums leading-none text-ink"
        aria-hidden="true"
      >
        {available}
      </p>
      <p className={small} aria-hidden="true">
        Available
      </p>
      {edit && (
        <p className={small} aria-hidden="true">
          To This Search
        </p>
      )}
    </div>
  )
}

type SegKind = 'other' | 'this' | 'free' | 'over'
const SEG: Record<SegKind, string> = {
  other: 'border-seg-other bg-seg-other',
  this: 'border-primary bg-primary',
  free: 'border-muted-foreground bg-surface',
  over: 'seg-over',
}
const Seg = ({ kind, legend }: { kind: SegKind; legend?: boolean }) => (
  <span
    data-seg={kind}
    className={`rounded-[3px] border-[1.5px] ${SEG[kind]} ${legend ? 'inline-block h-[11px] w-[14px]' : 'h-[14px] min-w-[5px] shrink basis-[22px]'}`}
  />
)

/** Under Grade: the hint (the cost), or the slots alert in its place. One live region for both. */
export function SlotCount({
  id,
  hint,
  alert,
  final = false,
}: {
  id: string
  hint: string | null
  alert: SlotAlert | null
  /** The final cost (both grades chosen): bold and black, not muted (Mahan, 2026-11-05) */
  final?: boolean
}) {
  return (
    <div id={id} aria-live="polite">
      {hint && !alert && (
        <p className={`mt-2.5 text-sm ${final ? 'font-bold text-ink' : 'text-muted-foreground'}`}>
          {hint}
        </p>
      )}
      {alert && (
        <div className="mt-3 flex flex-col gap-2 rounded-[10px] border border-attention-line bg-attention px-3.5 py-3 text-attention-ink">
          <div className="flex items-start gap-2">
            <span className="mt-[3px] flex-none text-attention-line">
              <WarnIcon />
            </span>
            <div>
              <p className="text-base font-bold">{alert.equation}</p>
              <p className="text-sm">{alert.sentence}</p>
            </div>
          </div>
          <div
            role="img"
            aria-label={alert.meter.label}
            className="flex min-w-0 flex-nowrap items-center gap-1"
          >
            {Array.from({ length: alert.meter.others }, (_, i) => (
              <Seg key={`o${i}`} kind="other" />
            ))}
            {Array.from({ length: alert.meter.thisIn }, (_, i) => (
              <Seg key={`t${i}`} kind="this" />
            ))}
            {Array.from({ length: alert.meter.free }, (_, i) => (
              <Seg key={`f${i}`} kind="free" />
            ))}
            <span className="mx-1 h-[26px] w-0.5 flex-none rounded-sm bg-ink" data-testid="limit" />
            {Array.from({ length: alert.meter.over }, (_, i) => (
              <Seg key={`v${i}`} kind="over" />
            ))}
          </div>
          <ul
            className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-[13px]"
            aria-hidden="true"
          >
            <li className="inline-flex items-center gap-1.5">
              <Seg kind="other" legend />
              Your other searches · {alert.meter.others}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Seg kind="this" legend />
              This search · {alert.thisSlots}
            </li>
            {alert.meter.free > 0 && (
              <li className="inline-flex items-center gap-1.5">
                <Seg kind="free" legend />
                Free · {alert.meter.free}
              </li>
            )}
            {alert.meter.over > 0 && (
              <li className="inline-flex items-center gap-1.5">
                <Seg kind="over" legend />
                More than your plan · {alert.meter.over}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Over plan, on an edit: the line under Grade */
export function NarrowOnlyLine() {
  return (
    <p className="mt-2.5 flex items-start gap-2 text-sm text-ink">
      <span className="mt-[3px] flex-none text-info-icon">
        <InfoIcon />
      </span>
      <span>
        While your searches use more slots than your plan, the grades here can only narrow.
      </span>
    </p>
  )
}

const TONE = {
  info: 'border border-line-strong bg-surface text-ink',
  hold: 'border-2 border-dashed border-hold-line bg-hold text-hold-ink',
  // Story 1.86: .tone-attn
  attention: 'border border-attention-line bg-attention text-attention-ink',
} as const
const ICON_TONE = {
  info: 'text-info-icon',
  hold: 'text-hold-line',
  attention: 'text-attention-line',
} as const

const NoticeIcon = ({ tone, icon }: { tone: FormNoticeModel['tone']; icon?: 'check' }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {icon === 'check' ? (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l3 3 5-6" />
      </>
    ) : tone === 'hold' ? (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ) : tone === 'attention' ? (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ) : (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7.5v.5" />
      </>
    )}
  </svg>
)

/**
 * A notice above the form (.attn): a refusal, a standing state (over plan), or a hold. A refusal
 * takes focus when it appears, so a subscriber who pressed Save at the foot of the form is taken to
 * it (the design moves focus to it).
 */
export function FormNotice({ notice }: { notice: FormNoticeModel }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (notice.role === 'alert') ref.current?.focus()
  }, [notice.role])
  const many = notice.actions.length > 2
  return (
    <section
      ref={ref}
      tabIndex={-1}
      role={notice.role === 'alert' ? 'alert' : 'region'}
      aria-label={notice.heading}
      className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-card p-4 outline-none ${
        many ? '' : 'tablet:grid-cols-[auto_minmax(0,1fr)_auto]'
      } tablet:px-6 tablet:py-5 ${TONE[notice.tone]}`}
    >
      <div className={`pt-0.5 ${ICON_TONE[notice.tone]}`}>
        <NoticeIcon tone={notice.tone} icon={notice.icon} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-[17px] font-bold leading-[1.3]">{notice.heading}</h2>
        {notice.paragraphs.map((p) => (
          <p key={p} className="text-[15px]">
            {p}
          </p>
        ))}
      </div>
      {notice.actions.length > 0 && (
        <div
          className={`col-span-2 flex flex-wrap items-center gap-2.5 ${
            many ? '' : 'tablet:col-span-1 tablet:flex-col tablet:items-end tablet:justify-center'
          }`}
        >
          {notice.actions.map((a) => {
            const cls = `inline-flex min-h-touch items-center justify-center whitespace-nowrap rounded-button border-[1.5px] px-[18px] text-[15px] font-semibold no-underline ${
              a.filled
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-line-strong bg-surface text-ink'
            }`
            return a.onClick ? (
              <button key={a.label} type="button" onClick={a.onClick} className={cls}>
                {a.label}
              </button>
            ) : (
              <Link key={a.label} href={a.href} className={cls}>
                {a.label}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
