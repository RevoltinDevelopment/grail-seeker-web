'use client'

/**
 * Story 1.104: Settings' Password section (need 62). The current password goes to the sign-in
 * provider with the new one (`current_password`); with "Require current password when changing
 * password" switched on (Mahan, after this build is live) the provider refuses a wrong one, so even
 * a stolen session can't change the password without it. Answers are matched on the provider's
 * code, never its text.
 */
import { useState } from 'react'

import { MIN_PASSWORD, PASSWORD_MISMATCH, PASSWORD_SHORT, passwordError } from '@/lib/settingsWords'
import { createClient } from '@/lib/supabase/client'

import {
  CANCEL_LINK,
  EyeButton,
  FIELD,
  FIELD_ERROR,
  FIELD_LABEL,
  FILLED,
  KEY,
  NOTE,
  OUTLINE,
  PANEL,
  ROW,
  RowStatus,
  SECTION_TITLE,
  useFlash,
} from './parts'

type Field = 'current' | 'new' | 'again'

export function PasswordSection() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<Field, string>>({ current: '', new: '', again: '' })
  const [shown, setShown] = useState<Record<Field, boolean>>({
    current: false,
    new: false,
    again: false,
  })
  const [errors, setErrors] = useState<Partial<Record<Field | 'form', string>>>({})
  const [busy, setBusy] = useState(false)
  const [changed, showChanged] = useFlash(6000)

  const close = () => {
    setOpen(false)
    setValues({ current: '', new: '', again: '' })
    setShown({ current: false, new: false, again: false })
    setErrors({})
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (values.new.length < MIN_PASSWORD) return setErrors({ new: PASSWORD_SHORT })
    if (values.new !== values.again) return setErrors({ again: PASSWORD_MISMATCH })
    setBusy(true)
    setErrors({})
    const { error } = await createClient().auth.updateUser({
      password: values.new,
      current_password: values.current,
    })
    setBusy(false)
    if (error) {
      const answer = passwordError(error.code)
      setErrors({ [answer.field]: answer.text })
      return
    }
    close()
    showChanged()
  }

  const field = (key: Field, label: string, autoComplete: string, hint?: string) => (
    <div>
      <label htmlFor={`pw-${key}`} className={FIELD_LABEL}>
        {label}
      </label>
      <span className="relative block">
        <input
          id={`pw-${key}`}
          className={`${FIELD} pr-12`}
          type={shown[key] ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={values[key]}
          onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={errors[key] ? `pw-${key}-err` : hint ? `pw-${key}-hint` : undefined}
          required
        />
        <EyeButton
          shown={shown[key]}
          onToggle={() => setShown((s) => ({ ...s, [key]: !s[key] }))}
        />
      </span>
      {hint && !errors[key] && (
        <p id={`pw-${key}-hint`} className={`${NOTE} mt-1.5`}>
          {hint}
        </p>
      )}
      {errors[key] && (
        <p id={`pw-${key}-err`} role="alert" className={`${FIELD_ERROR} mt-1.5`}>
          {errors[key]}
        </p>
      )}
    </div>
  )

  return (
    <section id="password" aria-labelledby="pw-h" className={PANEL}>
      <h2 id="pw-h" className={SECTION_TITLE}>
        Password
      </h2>
      {!open ? (
        <div>
          <div className={ROW}>
            <div>
              <p className={KEY} id="pw-k">
                Password
              </p>
              <p className={NOTE}>Change it any time. You stay signed in on this device.</p>
            </div>
            <button
              type="button"
              className={OUTLINE}
              onClick={() => setOpen(true)}
              aria-describedby="pw-k"
            >
              Change
            </button>
            <RowStatus saved={changed} error={null} savedText="Password changed" />
          </div>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-col gap-4"
          aria-label="Change your password"
          noValidate
        >
          {field('current', 'Current password', 'current-password')}
          {field('new', 'New password', 'new-password', 'At least 8 characters')}
          {field('again', 'New password, again', 'new-password')}
          {errors.form && (
            <p role="alert" className={FIELD_ERROR}>
              {errors.form}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="submit"
              className={FILLED}
              disabled={busy || !values.current || !values.new || !values.again}
            >
              {busy ? 'Changing…' : 'Change password'}
            </button>
            <button type="button" className={CANCEL_LINK} onClick={close} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
