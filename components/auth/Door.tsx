import Link from 'next/link'

import { BrandLink } from '@/components/layout/BrandLink'
import type { NoticeWords } from '@/lib/auth/authErrorWords'

/**
 * Story 1.106 (U-18): the front door's quiet column (front-door-sign-in.html, `.door-side`,
 * `.door`): the brand, linking to the landing site, a column at most 440 px, and the small links
 * at the foot. Sign-in, the waitlist, forgot and reset password all sit in it.
 */
export const LANDING_URL = 'https://grailseeker.io'

export const DOOR_FIELD =
  'min-h-touch w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm'
export const DOOR_LABEL = 'text-sm font-medium text-ink'
export const DOOR_PRIMARY =
  'inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] border-transparent bg-primary px-[18px] text-[15px] font-semibold text-primary-foreground no-underline disabled:cursor-not-allowed disabled:opacity-50'
export const DOOR_OUTLINE =
  'inline-flex min-h-touch w-full items-center justify-center rounded-button border-[1.5px] border-line-strong bg-surface px-[18px] text-[15px] font-semibold text-ink no-underline disabled:cursor-not-allowed disabled:opacity-50'
export const DOOR_CARD =
  'flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-sm'
export const DOOR_H1 = 'text-[28px] font-bold leading-tight text-ink'
export const DOOR_LEDE = 'text-[15px] text-muted-foreground'
export const DOOR_LINK = 'font-semibold text-link underline underline-offset-[3px]'

export function Door({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex min-h-16 max-w-[1200px] items-center px-4 tablet:px-8">
          <BrandLink href={LANDING_URL} plain />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-10 tablet:py-16">
        <div className="flex w-full max-w-[440px] flex-col gap-5">{children}</div>
      </main>
      <footer className="flex items-center justify-center gap-2 px-4 pb-6 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-ink hover:underline">
          Privacy Policy
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-ink hover:underline">
          Terms
        </Link>
        <span aria-hidden="true">·</span>
        <a href="mailto:support@grailseeker.io" className="hover:text-ink hover:underline">
          Help
        </a>
      </footer>
    </div>
  )
}

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/**
 * The drawn notice (`.attn`): attention (amber: a refusal, a wait) or information (neutral: why
 * sign-in was asked for). Never red: nothing here is the person's fault.
 */
export function DoorNotice({
  tone,
  words,
  extra,
}: {
  tone: 'attention' | 'info'
  words: NoticeWords | string
  extra?: string | null
}) {
  const box =
    tone === 'attention'
      ? 'border border-attention-line bg-attention text-attention-ink'
      : 'border border-line-strong bg-surface text-ink'
  const heading = typeof words === 'string' ? null : words.heading
  const lines = typeof words === 'string' ? [words] : words.lines
  return (
    <div
      role={tone === 'attention' ? 'alert' : 'status'}
      className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-card p-4 ${box}`}
    >
      <div className={`pt-0.5 ${tone === 'attention' ? 'text-attention-line' : 'text-info-icon'}`}>
        {tone === 'attention' ? (
          <svg {...ICON_PROPS}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5M12 16h.01" />
          </svg>
        ) : (
          <svg {...ICON_PROPS}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        )}
      </div>
      <div className="flex flex-col gap-1.5 text-[15px]">
        {heading && <p className="font-bold">{heading}</p>}
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {extra && <p className="mt-1">{extra}</p>}
      </div>
    </div>
  )
}

/** The password field with Show, as at /welcome (one field, no "Confirm"). */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  show,
  onToggle,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'current-password' | 'new-password'
  placeholder?: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={DOOR_LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={autoComplete === 'new-password' ? 8 : undefined}
          placeholder={placeholder}
          className={`peer pr-16 ${DOOR_FIELD}`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={show}
          aria-label={show ? 'Hide password' : 'Show password'}
          // Safari's "Suggest Password" holds the field and won't reveal it (Story 1.89): hidden
          // while the browser has filled the field.
          className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 rounded-md px-2 text-sm font-medium text-link hover:underline peer-[:-webkit-autofill]:hidden peer-[:autofill]:hidden"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
