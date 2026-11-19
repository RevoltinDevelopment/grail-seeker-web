'use client'

/**
 * Story 1.104 (U-15): Settings on one page of sections, as approved (docs/ux/mockups/subscriber-
 * experience/settings-page.html in the backend repo): Account, Plan and slots (a pointer), Texts,
 * Alerts, Password and Delete account. Switches save at once and say "Saved". App Only shows no text
 * settings. Appearance waits for U-17 (Decision #109: a theme choice that changes nothing isn't
 * shown). Light only until U-17; tokens only.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { AccountSection } from '@/components/settings/AccountSection'
import { PasswordSection } from '@/components/settings/PasswordSection'
import { SwitchRow, TextsSection } from '@/components/settings/TextsSection'
import {
  DANGER_OUTLINE,
  KEY,
  NOTE,
  OUTLINE,
  PANEL,
  SECTION_TITLE,
  VALUE,
} from '@/components/settings/parts'
import { useAccountSummary } from '@/hooks/useAccountSummary'
import { useCheckTimes, usePreferences } from '@/hooks/useSettings'
import { PLAN_NOTE, hasTexts, nearMissNote, planLine } from '@/lib/settingsWords'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const SECTIONS: { id: string; label: string }[] = [
  { id: 'account', label: 'Account' },
  // Mahan, 2026-11-18: every entry jumps to its section; the section's own button opens the plan page
  { id: 'plan', label: 'Plan and slots' },
  { id: 'texts', label: 'Texts' },
  { id: 'alerts-s', label: 'Alerts' },
  { id: 'password', label: 'Password' },
  { id: 'delete', label: 'Delete account' },
]

export default function SettingsClient() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userFailed, setUserFailed] = useState(false)
  const { prefs, isLoading, error, refetch, save, invalidate } = usePreferences()
  // Wait for the plan before drawing, so App Only never shows text settings for a moment
  const { account, isLoading: accountLoading } = useAccountSummary()
  const { checkTimes, refetch: refetchCheckTimes } = useCheckTimes()

  // Only a missing or refused session goes to sign-in; a failed read keeps what is on screen
  // (review, 2026-11-18: a network blip after a change must not sign the subscriber out)
  const loadUser = useCallback(async () => {
    try {
      const {
        data: { user: fresh },
        error: readError,
      } = await createClient().auth.getUser()
      if (fresh) {
        setUser(fresh)
        setUserFailed(false)
        return
      }
      const signedOut =
        !readError ||
        readError.name === 'AuthSessionMissingError' ||
        readError.status === 401 ||
        readError.status === 403
      if (signedOut) router.push('/login')
      else setUserFailed(true)
    } catch {
      setUserFailed(true)
    }
  }, [router])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const ready = !!user && !!prefs && !accountLoading
  const shownSections = SECTIONS.filter((s) => s.id !== 'plan' || planLine(account))
  const current = useSectionInView(ready ? shownSections.map((s) => s.id) : [])

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <div>
        <h1 className="text-page-title-sm font-bold leading-[1.2] tracking-[-0.01em] text-ink tablet:text-page-title">
          Settings
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Your account, texts and alerts</p>
      </div>

      {(error && !prefs) || (userFailed && !user) ? (
        <LoadError
          onRetry={() => {
            if (error && !prefs) refetch()
            if (!user) loadUser()
          }}
        />
      ) : !ready || isLoading ? (
        <p role="status" aria-busy="true" className="text-[15px] text-muted-foreground">
          Loading your settings…
        </p>
      ) : (
        <div className="grid items-start gap-5 desktop:grid-cols-[220px_minmax(0,760px)]">
          <nav
            aria-label="Settings sections"
            className="sticky top-4 hidden flex-col gap-0.5 desktop:flex"
          >
            {shownSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={current === s.id ? 'true' : undefined}
                className={`flex min-h-touch items-center rounded-lg px-3 text-[15px] no-underline ${
                  current === s.id
                    ? 'bg-primary-tint font-semibold text-ink'
                    : 'font-medium text-muted-foreground hover:text-ink'
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="flex min-w-0 flex-col gap-5">
            <AccountSection user={user} onUserChanged={loadUser} onPhoneVerified={invalidate} />

            {planLine(account) && (
              <section id="plan" aria-labelledby="pl-h" className={PANEL}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <div>
                    <h2 id="pl-h" className={SECTION_TITLE}>
                      Plan and slots
                    </h2>
                    <p className={VALUE}>{planLine(account)}</p>
                    <p className={NOTE}>{PLAN_NOTE}</p>
                  </div>
                  <Link href="/plan" className={OUTLINE}>
                    Plan and slots
                  </Link>
                </div>
              </section>
            )}

            <TextsSection
              appOnly={!hasTexts(account)}
              prefs={prefs}
              save={save}
              phone={user.phone}
              checkTimes={checkTimes}
              onQuietSaved={() => refetchCheckTimes()}
            />

            <section id="alerts-s" aria-labelledby="al-h" className={PANEL}>
              <h2 id="al-h" className={SECTION_TITLE}>
                Alerts
              </h2>
              <div>
                <SwitchRow
                  id="sw-near"
                  title="Near misses"
                  note={nearMissNote(prefs.nearMissMargin)}
                  checked={prefs.nearMissEnabled}
                  onSave={(on) => save({ nearMissEnabled: on })}
                />
              </div>
            </section>

            <PasswordSection />

            <section id="delete" aria-labelledby="del-h" className={PANEL}>
              <h2 id="del-h" className={SECTION_TITLE}>
                Delete account
              </h2>
              <p className={NOTE}>
                Deletes your account and everything in it: your searches, your alerts and their
                archive, and your reports. It can’t be undone.
              </p>
              <Link href="/settings/delete" className={DANGER_OUTLINE}>
                Delete account
              </Link>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Which section is in view, for the section list's mark (desktop): the first section in the band
 * near the top of the window; at the very bottom of the page, the last one (a short last section
 * never reaches the band).
 */
function useSectionInView(ids: string[]): string | null {
  const [current, setCurrent] = useState<string | null>(null)
  const key = ids.join(',')
  useEffect(() => {
    if (!key || typeof IntersectionObserver === 'undefined') return
    const order = key.split(',')
    const visible = new Set<string>()
    const atBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    const pick = () => {
      if (atBottom() && window.scrollY > 0) return setCurrent(order[order.length - 1])
      const first = order.find((id) => visible.has(id))
      if (first) setCurrent(first)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id)
          else visible.delete(e.target.id)
        }
        pick()
      },
      { rootMargin: '-10% 0px -55% 0px' }
    )
    for (const id of order) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    window.addEventListener('scroll', pick, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', pick)
    }
  }, [key])
  return current && ids.includes(current) ? current : ids[0] || null
}

/** A failed read, as Story 1.98's archive draws it: never the error's text. */
function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      aria-labelledby="settings-error-h"
      className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-card border border-line-strong bg-surface p-4 text-ink tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:px-6 tablet:py-5"
    >
      <div className="pt-0.5 text-info-icon">
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
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h2 id="settings-error-h" className={KEY}>
          We couldn’t load your settings
        </h2>
        <p className="text-[15px]">Try again in a moment.</p>
      </div>
      <div className="col-span-2 flex items-center tablet:col-span-1">
        <button type="button" onClick={onRetry} className={OUTLINE}>
          Try again
        </button>
      </div>
    </section>
  )
}
