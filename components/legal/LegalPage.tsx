import Link from 'next/link'

import Header from '@/components/layout/Header'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { currentUserOrNull } from '@/lib/supabase/currentUser'

/**
 * Story 1.105 (U-16): the frame of a legal page, as drawn (errors-and-legal-pages.html, the
 * Terms and Heritage Auctions boards). Signed in: the app header and "← Back to Searches".
 * Signed out: the public header and "← Back", to sign-in (where the signed-out way in is).
 */
export async function LegalPage({
  title,
  wide = false,
  children,
}: {
  title: string
  /** As wide as Searches (1200 px), for a document shown as pages (Mahan, 2026-11-19) */
  wide?: boolean
  children: React.ReactNode
}) {
  const user = await currentUserOrNull()
  return (
    <div className="min-h-screen bg-background">
      {user ? <Header user={user} /> : <PublicHeader />}
      <LegalColumn signedIn={user !== null} title={title} wide={wide}>
        {children}
      </LegalColumn>
    </div>
  )
}

/** The column under the header; apart so it can be tested without a session. */
export function LegalColumn({
  signedIn,
  title,
  wide = false,
  children,
}: {
  signedIn: boolean
  title: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <main
      className={`mx-auto flex w-full ${wide ? 'max-w-[1200px]' : 'max-w-[824px]'} flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8`}
    >
      <Link
        href={signedIn ? '/searches' : '/login'}
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-link no-underline hover:underline"
      >
        {signedIn ? '← Back to Searches' : '← Back'}
      </Link>
      <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
        {title}
      </h1>
      {children}
    </main>
  )
}

/**
 * The text of a legal page in a panel. The content's own elements (h2, h3, p, ul, a, hr) are
 * styled here on the tokens: the `prose` classes it used did nothing, since the typography
 * plugin was never installed.
 */
export function LegalProse({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface px-4 py-5 text-body text-ink shadow-sm tablet:px-6 [&_a]:font-semibold [&_a]:text-link [&_a]:underline [&_a]:underline-offset-[3px] [&_h2]:mt-3 [&_h2]:text-card-title [&_h2]:font-bold [&_h3]:mt-1 [&_h3]:font-semibold [&_hr]:my-2 [&_hr]:border-line [&_li]:mt-1.5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
      {children}
    </section>
  )
}
