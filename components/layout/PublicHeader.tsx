import Link from 'next/link'

import { BrandLink } from '@/components/layout/BrandLink'

const BAR = 'border-b border-line bg-surface'
const ROW =
  'mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-4 tablet:px-8'

/**
 * Story 1.105 (U-16): the header for someone not signed in, as drawn on the Terms board
 * (errors-and-legal-pages.html): the chalice and wordmark, and "Sign in".
 */
export function PublicHeader() {
  return (
    <header className={BAR}>
      <div className={ROW}>
        <BrandLink href="/login" />
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-semibold text-link no-underline hover:underline"
        >
          Sign in
        </Link>
      </div>
    </header>
  )
}

/**
 * Story 1.105 (code review): the header above the error pages that no layout gives one
 * (app/error.tsx, app/global-error.tsx). They can't tell whether the person is signed in, so it
 * offers no "Sign in"; and its link is a full page load, since the client router may be what
 * broke. Searches sends a signed-out visitor through sign-in.
 */
export function PlainHeader() {
  return (
    <header className={BAR}>
      <div className={ROW}>
        <BrandLink href="/searches" plain />
      </div>
    </header>
  )
}
