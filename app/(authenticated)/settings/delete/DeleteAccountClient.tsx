'use client'

/**
 * Story 1.104 (U-15): Delete account (settings-delete-account.html, answer A's confirm without its
 * billing lines: Decision #104 waits for S-20, so "Cancel your subscription instead" and the
 * subscription lines come with it). Today's behaviour behind it: the provider's delete, which
 * cascades. On success: signed out, to the sign-in page with the deleted notice.
 */
import { useState } from 'react'
import Link from 'next/link'

import { CANCEL_LINK, FIELD, FIELD_LABEL, NOTE } from '@/components/settings/parts'
import { useSearches } from '@/hooks/useSearches'
import { APIError } from '@/lib/api/client'
import { deleteAccount } from '@/lib/api/user'
import { deleteSearchesLine, deleteTyped } from '@/lib/settingsWords'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountClient() {
  const { searches, isLoading: searchesLoading, error: searchesError } = useSearches()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  // 'refused': the server answered and deleted nothing; 'unknown': no answer, so we can't say
  const [failed, setFailed] = useState<null | 'refused' | 'unknown'>(null)
  // The count waits for the searches, so nobody confirms before seeing it; unreadable, a plain line
  const searchesLine = searchesError
    ? 'Your searches stop and are deleted.'
    : deleteSearchesLine(searches.length)

  const doDelete = async () => {
    if (!deleteTyped(typed)) return
    setBusy(true)
    setFailed(null)
    try {
      await deleteAccount()
    } catch (err) {
      // Our server's own error answer means nothing was deleted; no answer, a gateway's page or a
      // lost session leaves it unknown (review, 2026-11-18)
      const refused = err instanceof APIError && err.status !== 401 && err.code !== 'UNKNOWN_ERROR'
      setFailed(refused ? 'refused' : 'unknown')
      setBusy(false)
      return
    }
    // The account is gone; signing out only clears this browser's session
    try {
      await createClient().auth.signOut({ scope: 'local' })
    } catch {
      // nothing to do: the next page is the sign-in page either way
    }
    window.location.href = '/login?deleted=1'
  }

  return (
    <div className="mx-auto flex max-w-[824px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <Link
        href="/settings"
        className="inline-flex min-h-touch items-center self-start text-[15px] font-semibold text-link no-underline"
      >
        ← Settings
      </Link>
      <section
        aria-labelledby="del-h"
        className="flex min-w-0 flex-col gap-3.5 rounded-card border border-line bg-surface px-4 py-5 shadow-sm tablet:px-6"
      >
        <h1 id="del-h" className="text-[19px] font-bold text-ink">
          Delete account
        </h1>
        <div className="flex flex-col gap-3 rounded-xl border-2 border-danger bg-surface p-4">
          <h2 className="text-[17px] font-bold text-ink">Delete your account?</h2>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[15px] text-ink">
            {!searchesLoading && searchesLine && <li>{searchesLine}</li>}
            <li>Your alerts, their archive and your reports are deleted.</li>
          </ul>
          <p className={NOTE}>This can’t be undone.</p>
          <label>
            <span className={FIELD_LABEL}>Type DELETE to confirm</span>
            <input
              className={FIELD}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          {failed === 'refused' && (
            <p role="alert" className="text-sm font-semibold text-danger">
              Couldn’t delete your account. Nothing was deleted. Try again.
            </p>
          )}
          {failed === 'unknown' && (
            <p role="alert" className="text-sm font-semibold text-danger">
              We couldn’t reach Grail Seeker, so we can’t tell whether your account was deleted.
              Check your connection, then try again.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={doDelete}
              disabled={busy || searchesLoading || !deleteTyped(typed)}
              className="inline-flex min-h-touch items-center justify-center rounded-button border-[1.5px] border-transparent bg-danger px-[18px] text-[15px] font-semibold text-surface disabled:cursor-not-allowed disabled:bg-background disabled:text-muted-foreground"
            >
              {busy ? 'Deleting…' : 'Delete my account'}
            </button>
            <Link href="/settings" className={CANCEL_LINK}>
              Keep my account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
