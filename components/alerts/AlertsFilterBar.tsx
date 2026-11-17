'use client'

import type { MarketplaceOption, MatchFilter } from '@/lib/alertRows'
import type { AlertsSortMode } from '@/lib/api/user'

/**
 * Story 1.96 (U-11): Alerts' filter and sort bar (alerts-list.html). Every marketplace named; the
 * match filter; Clear filters when either is set; By date and By book, with the circle that closes
 * or opens every book (down: all open; right: all closed; between: some of each). The archive uses
 * it too (Story 1.98, U-12).
 */
export type BooksState = 'open' | 'closed' | 'mixed'

const ROTATION: Record<BooksState, string> = { open: '', closed: '-rotate-90', mixed: '-rotate-45' }

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

const SELECT =
  'block h-12 w-full cursor-pointer appearance-none rounded-button border-[1.5px] border-line-strong bg-surface pl-3.5 pr-[42px] text-body font-medium text-ink'

export function AlertsFilterBar(props: {
  markets: MarketplaceOption[]
  market: string
  match: MatchFilter
  onMarket: (slug: string) => void
  onMatch: (match: MatchFilter) => void
  onClear: () => void
  /** Absent when the page shows one search (no sort there, as drawn) */
  sort?: AlertsSortMode
  onSort?: (sort: AlertsSortMode) => void
  /** Present in By book when there are books */
  books?: BooksState
  onToggleBooks?: () => void
}) {
  const filtered = props.market !== 'all' || props.match !== 'all'
  const booksLabel = props.books === 'closed' ? 'Expand every book' : 'Collapse every book'

  return (
    <section
      aria-label="Filter and sort"
      className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-card border border-line bg-surface px-4 py-3.5 shadow-sm"
    >
      <label className="flex flex-[1_1_100%] flex-col gap-1 text-[13px] font-semibold text-muted-foreground tablet:flex-[0_1_220px]">
        Marketplace
        <span className="relative block">
          <select className={SELECT} value={props.market} onChange={(e) => props.onMarket(e.target.value)}>
            <option value="all">All marketplaces</option>
            {props.markets.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.label}
              </option>
            ))}
          </select>
          <Chevron className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </span>
      </label>
      <label className="flex flex-[1_1_100%] flex-col gap-1 text-[13px] font-semibold text-muted-foreground tablet:flex-[0_1_220px]">
        Matches
        <span className="relative block">
          <select
            className={SELECT}
            value={props.match}
            onChange={(e) => props.onMatch(e.target.value as MatchFilter)}
          >
            <option value="all">All matches</option>
            <option value="within">Within your price</option>
            <option value="near">Near misses</option>
          </select>
          <Chevron className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </span>
      </label>
      {filtered && (
        <button
          type="button"
          onClick={props.onClear}
          className="inline-flex min-h-touch items-center self-end bg-transparent px-2 text-[15px] font-semibold text-link underline underline-offset-[3px]"
        >
          Clear filters
        </button>
      )}
      {props.sort && props.onSort && (
        <div className="flex flex-col gap-1 text-[13px] font-semibold text-muted-foreground tablet:ml-auto">
          Show
          <div className="flex items-center gap-2.5">
            <div
              role="group"
              aria-label="Show alerts"
              className="inline-flex flex-wrap gap-1 rounded-card border-[1.5px] border-line-strong bg-surface p-[3px]"
            >
              {(['date', 'book'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={props.sort === mode}
                  onClick={() => props.onSort?.(mode)}
                  className={`min-h-[38px] rounded-button px-3.5 text-[15px] font-semibold ${
                    props.sort === mode ? 'bg-primary text-primary-foreground' : 'bg-transparent text-ink'
                  }`}
                >
                  {mode === 'date' ? 'By date' : 'By book'}
                </button>
              ))}
            </div>
            {props.books && props.onToggleBooks && (
              <button
                type="button"
                onClick={props.onToggleBooks}
                aria-label={booksLabel}
                title={booksLabel}
                data-state={props.books}
                className="inline-grid h-10 w-10 flex-none place-items-center rounded-full border-[1.5px] border-line-strong bg-surface text-ink"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`transition-transform duration-200 motion-reduce:transition-none ${ROTATION[props.books]}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
