/**
 * Story 1.100 (U-14): the pieces Reports, the week page and Books found share, as drawn in the
 * session 6 designs (`rp-*`, `bf-*` in docs/ux/mockups/grail-seeker.css), in the app's token
 * classes. Words come from lib/reportRows.ts; these only lay them out.
 */
import type { ReactNode } from 'react'
import Link from 'next/link'

import type { FoundRow, Headline } from '@/lib/reportRows'

export const OUTLINE_BTN =
  'inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink no-underline hover:bg-chip'

const KEY = 'text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground'

/** "IN PROGRESS", "ALL TIME", "COMPLETE". */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-[6px] border border-line-strong px-2 py-px align-middle text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
      {children}
    </span>
  )
}

export function BackToReports() {
  return (
    <Link href="/reports" className="inline-flex min-h-9 items-center self-start text-[15px] font-semibold text-link no-underline hover:underline">
      ← Back to Reports
    </Link>
  )
}

export function PageTitle({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div>
      <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">{title}</h1>
      {sub && <p className="mt-1 text-[15px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function HeadlineBox({ headline }: { headline: Headline }) {
  return (
    <p className="rounded-[10px] border border-line bg-background px-4 py-3.5 text-base font-semibold leading-[1.45] text-ink">
      {headline.headline} {headline.quiet && <span className="font-medium text-muted-foreground">{headline.quiet}</span>}
    </p>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3.5">
      <h3 className={KEY}>{title}</h3>
      {children}
    </div>
  )
}

export function KeyValueRows({ rows }: { rows: { k: string; v: string }[] }) {
  return (
    <dl className="m-0 flex flex-col gap-1.5">
      {rows.map((r, i) => (
        <div key={`${i}|${r.k}`} className="flex justify-between gap-3 text-[15px] text-ink">
          <dt>{r.k}</dt>
          <dd className="m-0 font-bold tabular-nums">{r.v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function FoundList({ rows }: { rows: FoundRow[] }) {
  const cls =
    'flex min-h-touch min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg border border-line-strong px-3 py-2 text-[15px] font-semibold text-ink no-underline hover:bg-chip'
  const go = <T extends string>(text: T) => <span className="flex-none whitespace-nowrap text-sm font-semibold text-link">{text}</span>
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {rows.map((r) => (
        <li key={r.key}>
          {r.external ? (
            <a href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>
              <span className="min-w-0">{r.text}</span>
              {go(r.go)}
            </a>
          ) : (
            <Link href={r.href} className={cls}>
              <span className="min-w-0">{r.text}</span>
              {go(r.go)}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

export function BooksList({ rows }: { rows: { t: string; note: string }[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[15px] text-ink">
      {rows.map((b, i) => (
        <li key={`${i}|${b.t}`}>
          {b.t} {b.note && <span className="text-sm text-muted-foreground">{b.note}</span>}
        </li>
      ))}
    </ul>
  )
}

/** A card: "This week", "Since you joined", or the week page's one panel. */
export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-sm tablet:p-6">
      {children}
    </section>
  )
}

function ReportIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

/** The empty and failed states: an icon, a heading, a line, and the way on. */
export function EmptyState(props: {
  icon?: 'report' | 'calendar'
  heading: string
  body: string
  onRetry?: () => void
  back?: boolean
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-5 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
        {props.icon === 'calendar' ? <CalendarIcon /> : <ReportIcon />}
      </span>
      <h2 className="text-[19px] font-bold text-ink">{props.heading}</h2>
      <p className="max-w-[460px] text-[15px] text-muted-foreground">{props.body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {props.onRetry && (
          <button type="button" onClick={props.onRetry} className={OUTLINE_BTN}>
            Try again
          </button>
        )}
        {props.back && (
          <Link href="/reports" className={OUTLINE_BTN}>
            Back to Reports
          </Link>
        )}
      </div>
    </section>
  )
}

/** The quiet foot line under a page. */
export function FootNote({ children }: { children: ReactNode }) {
  return <p className="text-center text-sm text-muted-foreground">{children}</p>
}
