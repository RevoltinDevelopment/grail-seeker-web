'use client'

import Link from 'next/link'

import type { Banner } from '@/lib/attention'

/**
 * Story 1.83 (U-05): the one attention banner, as drawn (attention-banner-states.html). Which
 * state and which words come from lib/attention.ts; this only draws them, in three tones: hold
 * (amber, dashed, a lock), attention (amber, a clock), information (neutral, an "i").
 */
const TONE = {
  hold: 'border-2 border-dashed border-hold-line bg-hold text-hold-ink',
  attention: 'border border-attention-line bg-attention text-attention-ink',
  info: 'border border-line-strong bg-surface text-ink',
} as const

const ICON_COLOUR = {
  hold: 'text-hold-line',
  attention: 'text-attention-line',
  info: 'text-info-icon',
} as const

function Icon({ tone }: { tone: Banner['tone'] }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (tone === 'hold')
    return (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    )
  if (tone === 'attention')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

export function AttentionBanner({ banner, onDismiss }: { banner: Banner; onDismiss?: () => void }) {
  return (
    <section
      className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-card p-4 tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:px-6 tablet:py-5 ${TONE[banner.tone]}`}
      aria-labelledby="attention-h"
      data-state={banner.state}
    >
      <div className={`pt-0.5 ${ICON_COLOUR[banner.tone]}`}>
        <Icon tone={banner.tone} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 id="attention-h" className="text-card-title font-bold leading-[1.3]">
          {banner.heading}
        </h2>
        {banner.paragraphs.map((p) => (
          <p key={p} className="text-[15px]">
            {p}
          </p>
        ))}
      </div>
      {(banner.action || banner.due || banner.dismissible) && (
        <div className="col-span-2 flex flex-wrap items-center gap-2.5 tablet:col-span-1 tablet:flex-col tablet:items-end tablet:justify-center">
          {banner.action && (
            <Link
              href={banner.action.href}
              className={`inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] px-[18px] text-[15px] font-semibold no-underline ${
                banner.action.filled
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-line-strong bg-surface text-ink'
              }`}
            >
              {banner.action.label}
            </Link>
          )}
          {banner.due && <span className="mt-1 text-sm font-semibold">{banner.due}</span>}
          {banner.dismissible && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="inline-grid h-11 w-11 place-items-center rounded-button text-muted-foreground hover:bg-chip"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  )
}
