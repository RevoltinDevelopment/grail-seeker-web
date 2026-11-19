'use client'

/**
 * Story 1.104: Settings' Account section (settings-page.html, "Account"): the email, changed the way
 * the sign-in provider really changes it; the phone, changed through the code step (need 63); and
 * "Member since".
 *
 * Email: Secure email change is on (Mahan, 2026-11-18), so the provider sends a link to each address
 * and the change happens when both are opened. The pending address is the user's `new_email`, so a
 * reload still shows the panel. The provider can't cancel a pending change, so there is no
 * "Cancel the change" (Decision #109); the link expires in 24 hours.
 *
 * Phone: the provider keeps a new number aside until its code is verified, and the worker texts the
 * account's number, so texts go to the old number until then by construction.
 */
import { useState } from 'react'

import { PhoneStep } from '@/components/auth/PhoneStep'
import {
  EMAIL_FORM_NOTE,
  EMAIL_IGNORE_NOTE,
  emailError,
  emailPending,
  formatPhone,
  memberSince,
} from '@/lib/settingsWords'
import { createClient } from '@/lib/supabase/client'

import {
  CANCEL_LINK,
  FIELD,
  FIELD_ERROR,
  FIELD_LABEL,
  FILLED,
  FULL,
  InfoPanel,
  KEY,
  NOTE,
  OUTLINE,
  PANEL,
  ROW,
  RowStatus,
  SECTION_TITLE,
  Tick,
  VALUE,
  useFlash,
} from './parts'
import type { User } from '@supabase/supabase-js'

export function AccountSection({
  user,
  onUserChanged,
  onPhoneVerified,
}: {
  user: User
  onUserChanged: () => Promise<void>
  /** The phone step recorded a new consent time: Settings reads its preferences again. */
  onPhoneVerified: () => void
}) {
  return (
    <section id="account" aria-labelledby="acc-h" className={PANEL}>
      <h2 id="acc-h" className={SECTION_TITLE}>
        Account
      </h2>
      <div>
        <EmailRow user={user} onUserChanged={onUserChanged} />
        <PhoneRow user={user} onUserChanged={onUserChanged} onPhoneVerified={onPhoneVerified} />
        {memberSince(user.created_at) && (
          <div className={ROW}>
            <div>
              <p className={KEY}>Member since</p>
              <p className={VALUE}>{memberSince(user.created_at)}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function EmailRow({ user, onUserChanged }: { user: User; onUserChanged: () => Promise<void> }) {
  const current = user.email ?? ''
  const pending = user.new_email && user.new_email !== current ? user.new_email : null
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, showResent] = useFlash()

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = value.trim()
    if (!next || next.toLowerCase() === current.toLowerCase()) {
      setError(next ? 'That’s the email you have now.' : 'Enter the new email.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: err } = await createClient().auth.updateUser(
      { email: next },
      { emailRedirectTo: `${window.location.origin}/settings` }
    )
    setBusy(false)
    if (err) {
      setError(emailError(err.code))
      return
    }
    setEditing(false)
    setValue('')
    await onUserChanged()
  }

  const resend = async () => {
    if (!pending) return
    setBusy(true)
    setError(null)
    const { error: err } = await createClient().auth.resend({
      type: 'email_change',
      email: pending,
    })
    setBusy(false)
    if (err) setError(emailError(err.code))
    else showResent()
  }

  return (
    <div className={ROW}>
      <div>
        <p className={KEY} id="email-k">
          Email
        </p>
        <p className={VALUE}>{current}</p>
      </div>
      {!editing && !pending && (
        <button
          type="button"
          className={OUTLINE}
          onClick={() => setEditing(true)}
          aria-describedby="email-k"
        >
          Change
        </button>
      )}
      {editing && (
        <form
          onSubmit={send}
          className={`${FULL} flex flex-col gap-3`}
          aria-label="Change your email"
        >
          <label>
            <span className={FIELD_LABEL}>New email</span>
            <input
              className={FIELD}
              type="email"
              autoComplete="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby="email-note"
              required
            />
          </label>
          {error && <p className={FIELD_ERROR}>{error}</p>}
          <p id="email-note" className={NOTE}>
            {EMAIL_FORM_NOTE}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="submit" className={FILLED} disabled={busy}>
              {busy ? 'Sending…' : 'Send the link'}
            </button>
            <button
              type="button"
              className={CANCEL_LINK}
              onClick={() => {
                setEditing(false)
                setValue('')
                setError(null)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {pending && !editing && (
        <InfoPanel
          heading={emailPending(pending, current).heading}
          actions={
            <>
              <button type="button" className={OUTLINE} onClick={resend} disabled={busy}>
                {busy ? 'Sending…' : 'Send it again'}
              </button>
              {/* A mistyped address can be replaced: a new change takes the pending one's place */}
              <button
                type="button"
                className={CANCEL_LINK}
                onClick={() => {
                  setError(null)
                  setEditing(true)
                }}
              >
                Use a different address
              </button>
              <p role="status" className="text-sm font-semibold text-ink empty:hidden">
                {resent ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-primary">
                      <Tick />
                    </span>
                    Sent
                  </span>
                ) : null}
              </p>
            </>
          }
        >
          <p className="text-[15px]">{emailPending(pending, current).body}</p>
          <p className={NOTE}>{EMAIL_IGNORE_NOTE}</p>
          {error && <p className={FIELD_ERROR}>{error}</p>}
        </InfoPanel>
      )}
    </div>
  )
}

function PhoneRow({
  user,
  onUserChanged,
  onPhoneVerified,
}: {
  user: User
  onUserChanged: () => Promise<void>
  onPhoneVerified: () => void
}) {
  const shown = formatPhone(user.phone)
  const [open, setOpen] = useState(false)
  const [saved, showSaved] = useFlash()

  return (
    <div className={ROW}>
      <div>
        <p className={KEY} id="phone-k">
          Phone number
        </p>
        {shown ? (
          <p className={VALUE}>
            {shown}
            {user.phone_confirmed_at && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-ok">
                <Tick size={14} />
                Verified
              </span>
            )}
          </p>
        ) : (
          <p className={VALUE}>No number yet</p>
        )}
        {open && shown && (
          <p className={NOTE}>Texts keep going to {shown} until the new number is confirmed.</p>
        )}
      </div>
      {!open && (
        <button
          type="button"
          className={OUTLINE}
          onClick={() => setOpen(true)}
          aria-describedby="phone-k"
        >
          {shown ? 'Change' : 'Add'}
        </button>
      )}
      {open && (
        <div className={`${FULL} rounded-card border border-line p-4`}>
          <PhoneStep
            heading="Your new phone number"
            onCancel={() => setOpen(false)}
            onDone={async () => {
              setOpen(false)
              onPhoneVerified()
              await onUserChanged()
              showSaved()
            }}
          />
        </div>
      )}
      <RowStatus saved={saved} error={null} />
    </div>
  )
}
