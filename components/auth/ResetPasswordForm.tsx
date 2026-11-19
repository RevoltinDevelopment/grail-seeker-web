'use client'

import { useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { DOOR_CARD, DOOR_H1, DOOR_LEDE, DOOR_PRIMARY, PasswordField } from '@/components/auth/Door'
import { PASSWORD_WORDS, passwordRefusalWords, sessionEnded } from '@/lib/auth/passwordWords'
import { createClient } from '@/lib/supabase/client'

/**
 * Story 1.106 (U-18): set a new password from a reset link (front-door-password.html, "reset"):
 * one field with Show, as at /welcome; today's second "Confirm" field goes. Then Searches with
 * "Your password is saved. You're signed in.", through the signed-in layout, which sends a guarded
 * account to its step instead.
 */
export const AFTER_RESET = '/searches?welcome=password'

export function ResetPasswordForm({ email }: { email: string | null }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Code review: set at once, so a fast double press can't save twice
  const inFlight = useRef(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return
    setError(null)
    if (password.length < 8) return setError(PASSWORD_WORDS.short)
    inFlight.current = true
    setBusy(true)
    let saveError: { code?: string; message?: string; name?: string; status?: number } | null = null
    try {
      saveError = (await createClient().auth.updateUser({ password })).error
    } catch {
      saveError = { name: 'NetworkError' }
    }
    if (saveError) {
      if (sessionEnded(saveError)) {
        // The link's session is gone: the expired page offers a new link
        router.replace('/reset-password?error=link')
        return
      }
      setError(passwordRefusalWords(saveError))
      setBusy(false)
      inFlight.current = false
      return
    }
    router.push(AFTER_RESET)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className={DOOR_H1}>Set a new password</h1>
        {email && <p className={DOOR_LEDE}>For {email}</p>}
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger bg-surface p-3 text-sm text-danger"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSave} aria-label="Set a new password" className={DOOR_CARD}>
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          show={show}
          onToggle={() => setShow((s) => !s)}
        />
        <button type="submit" disabled={busy || password.length < 8} className={DOOR_PRIMARY}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  )
}
