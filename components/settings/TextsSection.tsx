'use client'

/**
 * Story 1.104: Settings' Texts section (settings-page.html, "Texts"): the texts switch, a test text,
 * the consent on record, and quiet hours, which say when the searches are checked and warn in amber
 * when the hours cover a check (needs 60, 69). The warning is the server's answer for the hours on
 * screen, saved or not (Decision #108: the worker's own rule, never a copy of it here).
 *
 * App Only (a plan without texts) shows only where to find plans with texts.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Switch } from '@/components/ui/Switch'
import { useQuietPreview } from '@/hooks/useSettings'
import type { CheckTimes } from '@/lib/api/account'
import { APIError } from '@/lib/api/client'
import { sendTestSms, type UserPreferences } from '@/lib/api/user'
import {
  checkTimesLine,
  consentLine,
  quietWarning,
  testTextError,
  testTextNote,
  textsNote,
} from '@/lib/settingsWords'
import { timezoneOptionsFor } from '@/lib/timezones'

import {
  FIELD,
  FIELD_LABEL,
  FILLED,
  FULL,
  KEY,
  NOTE,
  OUTLINE,
  PANEL,
  ROW,
  RowStatus,
  SECTION_TITLE,
  useFlash,
} from './parts'

type Save = (patch: Partial<UserPreferences>) => Promise<unknown>

const SAVE_FAILED = 'Couldn’t save that. Try again.'

export function TextsSection({
  appOnly,
  prefs,
  save,
  phone,
  checkTimes,
  onQuietSaved,
}: {
  appOnly: boolean
  prefs: UserPreferences
  save: Save
  phone: string | null | undefined
  /** The saved hours' check times, for the account's time zone; null until read. */
  checkTimes: CheckTimes | null
  onQuietSaved: () => void
}) {
  if (appOnly) {
    return (
      <section id="texts" aria-labelledby="tx-h" className={PANEL}>
        <h2 id="tx-h" className={SECTION_TITLE}>
          Texts
        </h2>
        <div className="flex flex-col items-start gap-3">
          <div>
            <p className={KEY}>App Only doesn’t include texts</p>
            <p className={NOTE}>
              Matches show in Alerts and under Latest matches on Searches. Plans with texts are on
              Plan and slots.
            </p>
          </div>
          <Link href="/plan" className={OUTLINE}>
            See plans with texts
          </Link>
        </div>
      </section>
    )
  }

  const zone = checkTimes?.timezone ?? prefs.timezone ?? 'America/New_York'
  const consent = prefs.smsConsentGiven ? consentLine(prefs.smsConsentTimestamp, zone) : null

  return (
    <section id="texts" aria-labelledby="tx-h" className={PANEL}>
      <h2 id="tx-h" className={SECTION_TITLE}>
        Texts
      </h2>
      <div>
        <SwitchRow
          id="sw-texts"
          title="Text me when a search finds a match"
          note={textsNote(prefs.smsNotificationsEnabled, phone)}
          checked={prefs.smsNotificationsEnabled}
          onSave={(on) => save({ smsNotificationsEnabled: on })}
        />
        <TestTextRow phone={phone} />
        {consent && (
          <div className={ROW}>
            <div className={FULL}>
              <p className={KEY}>Your consent</p>
              <p className={NOTE}>{consent}</p>
            </div>
          </div>
        )}
        <QuietHoursRow prefs={prefs} save={save} checkTimes={checkTimes} onSaved={onQuietSaved} />
      </div>
    </section>
  )
}

/** A row with a switch that saves at once: "Saved" after the server answers; a failure puts it back. */
export function SwitchRow({
  id,
  title,
  note,
  checked,
  onSave,
  onShown,
  children,
}: {
  id: string
  title: string
  note: string
  checked: boolean
  onSave: (next: boolean) => Promise<unknown>
  /** Told what the switch shows whenever it changes, so what opens under it follows a flip at once (Decision 2). */
  onShown?: (on: boolean) => void
  children?: React.ReactNode
}) {
  const [shown, setShown] = useState(checked)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, showSaved, hideSaved] = useFlash()

  // Follow the saved value when it changes (the cache after a save, or a refetch); a failed save
  // puts the switch back itself
  useEffect(() => {
    setShown(checked)
  }, [checked])
  useEffect(() => {
    onShown?.(shown)
  }, [shown, onShown])

  const flip = async (next: boolean) => {
    setShown(next)
    setBusy(true)
    setError(null)
    hideSaved()
    try {
      await onSave(next)
      showSaved()
    } catch {
      setShown(!next)
      setError(SAVE_FAILED)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={ROW}>
      <div>
        <p className={KEY} id={id}>
          {title}
        </p>
        <p className={NOTE}>{note}</p>
      </div>
      <Switch checked={shown} onChange={flip} labelledBy={id} disabled={busy} />
      <RowStatus saved={saved} error={error} />
      {children}
    </div>
  )
}

function TestTextRow({ phone }: { phone: string | null | undefined }) {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await sendTestSms()
      setSent(true)
    } catch (err) {
      setSent(false)
      setError(testTextError(err instanceof APIError ? err.code : null))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={ROW}>
      <div>
        <p className={KEY} id="test-k">
          Send a test text
        </p>
        <p className={NOTE} role="status">
          {testTextNote(phone, sent)}
        </p>
      </div>
      <button
        type="button"
        className={OUTLINE}
        onClick={send}
        disabled={busy || !phone}
        aria-describedby="test-k"
      >
        {busy ? 'Sending…' : 'Send'}
      </button>
      <RowStatus saved={false} error={error} />
    </div>
  )
}

const hhmm = (t: string | null | undefined, fallback: string) => (t ? t.slice(0, 5) : fallback)

function QuietHoursRow({
  prefs,
  save,
  checkTimes,
  onSaved,
}: {
  prefs: UserPreferences
  save: Save
  checkTimes: CheckTimes | null
  onSaved: () => void
}) {
  const savedZone = checkTimes?.timezone ?? prefs.timezone ?? 'America/New_York'
  const [from, setFrom] = useState(hhmm(prefs.quietHoursStart, '22:00'))
  const [to, setTo] = useState(hhmm(prefs.quietHoursEnd, '08:00'))
  const [zone, setZone] = useState(savedZone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, showSaved, hideSaved] = useFlash()

  // The account's zone arrives with check times after the first paint; follow it until edited
  const [zoneTouched, setZoneTouched] = useState(false)
  useEffect(() => {
    if (!zoneTouched) setZone(savedZone)
  }, [savedZone, zoneTouched])

  const options = useMemo(
    () =>
      timezoneOptionsFor(
        savedZone,
        checkTimes?.timezone === savedZone ? checkTimes?.timezoneName : null
      ),
    [savedZone, checkTimes]
  )

  // The panel follows the switch as shown (it opens as the switch flips, before the save answers)
  const [on, setOn] = useState(prefs.quietHoursEnabled)
  // Ask the server about exactly the hours on screen; a field being cleared asks nothing
  const preview = useMemo(
    () =>
      on && from && to
        ? { quietEnabled: true, quietStart: from, quietEnd: to, timezone: zone }
        : null,
    [on, from, to, zone]
  )
  const answer = useQuietPreview(preview)

  // Hours never saved (no start, end or zone stored) can be saved as shown (review, 2026-11-18)
  const dirty =
    !prefs.quietHoursStart ||
    !prefs.quietHoursEnd ||
    !prefs.timezone ||
    from !== hhmm(prefs.quietHoursStart, '22:00') ||
    to !== hhmm(prefs.quietHoursEnd, '08:00') ||
    zone !== prefs.timezone

  // Until the first preview answers, the saved hours' check times stand in when the screen shows
  // exactly those hours (review, 2026-11-18: "always shown while quiet hours are on")
  const shownAnswer =
    answer !== undefined ? answer : !dirty && prefs.quietHoursEnabled ? checkTimes : null
  const line = shownAnswer ? checkTimesLine(shownAnswer) : null
  const warning = shownAnswer ? quietWarning(shownAnswer) : null
  const describedBy = line ? 'qh-say' : undefined

  const saveHours = async () => {
    if (!from || !to) return
    setBusy(true)
    setError(null)
    hideSaved()
    try {
      await save({ quietHoursStart: `${from}:00`, quietHoursEnd: `${to}:00`, timezone: zone })
      showSaved()
      onSaved()
    } catch {
      setError(SAVE_FAILED)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SwitchRow
      id="sw-quiet"
      title="Quiet hours"
      note="No texts during the hours you choose."
      checked={prefs.quietHoursEnabled}
      onShown={setOn}
      onSave={async (next) => {
        await save({ quietHoursEnabled: next })
        onSaved()
      }}
    >
      {on && (
        <div className={`${FULL} mt-1.5 flex flex-col gap-3`}>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={FIELD_LABEL}>From</span>
              <input
                className={FIELD}
                type="time"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-describedby={describedBy}
                required
              />
            </label>
            <label>
              <span className={FIELD_LABEL}>To</span>
              <input
                className={FIELD}
                type="time"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-describedby={describedBy}
                required
              />
            </label>
          </div>
          <label>
            <span className={FIELD_LABEL}>Time zone</span>
            <span className="relative block">
              <select
                className={`${FIELD} appearance-none pr-10`}
                value={zone}
                onChange={(e) => {
                  setZoneTouched(true)
                  setZone(e.target.value)
                }}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </label>
          {line && (
            <p id="qh-say" className="flex items-start gap-2 text-sm text-ink">
              <svg
                className="mt-0.5 flex-none text-info-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>{line}</span>
            </p>
          )}
          <div role="status" className="empty:hidden">
            {warning && (
              <div className="flex items-start gap-2.5 rounded-[10px] border-[1.5px] border-attention-line bg-attention px-3.5 py-3 text-sm text-attention-ink">
                <svg
                  className="mt-px flex-none"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <span>
                  <strong className="block text-[15px]">{warning.heading}</strong>
                  {warning.body}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              className={FILLED}
              onClick={saveHours}
              disabled={busy || !from || !to || !dirty}
            >
              {busy ? 'Saving…' : 'Save quiet hours'}
            </button>
          </div>
          <RowStatus saved={saved} error={error} />
        </div>
      )}
    </SwitchRow>
  )
}
