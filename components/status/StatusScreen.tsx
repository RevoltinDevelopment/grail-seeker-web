import { Button } from '@/components/ui/button'
import {
  BACK_TO_SEARCHES,
  RETRY_LABEL,
  STATUS_WORDS,
  SUPPORT_EMAIL,
  SUPPORT_LEAD,
  type StatusKind,
} from '@/lib/statusWords'

/**
 * Story 1.105 (U-16): the error and not-found pages' column, as drawn
 * (docs/ux/mockups/subscriber-experience/errors-and-legal-pages.html, `.door` and `.big-ico`).
 * A round icon in the primary tint (no red), the title, one line, and the way back to Searches.
 * An error also offers Try again and the support line. Not a landmark: the caller puts it in
 * its `<main>` (the signed-in layout already has one).
 *
 * "Back to Searches" is a plain link, a full page load: after an error the client router may be
 * the part that broke, and a full load starts clean.
 */
interface StatusScreenProps {
  kind: StatusKind
  /** An error boundary's reset. Shows "Try again". */
  onRetry?: () => void
  /** Shown in development only, never in production. */
  error?: Error & { digest?: string }
}

const BUTTON = 'w-full text-[15px] font-semibold'

export function StatusScreen({ kind, onRetry, error }: StatusScreenProps) {
  const words = STATUS_WORDS[kind]
  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-5 px-4 pb-12 pt-8 text-center desktop:pb-[72px] desktop:pt-14">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-info-icon">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </span>
      <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
        {words.title}
      </h1>
      <p className="text-body text-muted-foreground">{words.body}</p>

      {process.env.NODE_ENV === 'development' && error && (
        <div className="rounded-card bg-muted p-4 text-left font-mono text-xs text-muted-foreground">
          <p className="mb-2 font-semibold text-ink">Error details (development only)</p>
          <p>{error.message}</p>
          {error.digest && <p className="mt-2">Error ID: {error.digest}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {kind === 'error' && onRetry && (
          <Button type="button" className={BUTTON} onClick={onRetry}>
            {RETRY_LABEL}
          </Button>
        )}
        <Button asChild variant="outline" className={`${BUTTON} text-ink`}>
          <a href="/searches">{BACK_TO_SEARCHES}</a>
        </Button>
      </div>

      {kind === 'error' && (
        <p className="text-sm text-muted-foreground">
          {SUPPORT_LEAD}{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold text-link underline underline-offset-[3px]"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      )}
    </div>
  )
}
