'use client'

import { useRef, useState } from 'react'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  DOOR_CARD,
  DOOR_FIELD,
  DOOR_LABEL,
  DOOR_PRIMARY,
  DoorNotice,
  PasswordField,
} from '@/components/auth/Door'
import { AUTH_WORDS, signInRefusal } from '@/lib/auth/authErrorWords'
import { PAY_FIRST_SIGNUP } from '@/lib/front-door'
import { createClient } from '@/lib/supabase/client'
import { safeRedirectPath } from '@/lib/utils/safe-redirect'

/**
 * Story 1.106 (U-18): sign-in as drawn (front-door-sign-in.html, "sign in", "wrong password", "too
 * many tries", "from a link"). Refusals in plain words from the provider's code (need 37); after
 * sign-in, the page the link named or Searches (Story 1.77, need 34), through the signed-in
 * layout, which sends a guarded account to its step instead (need 39).
 */
export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [refusal, setRefusal] = useState<ReturnType<typeof signInRefusal> | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // Code review: set at once, so a fast double press can't send twice before React re-renders
  const inFlight = useRef(false)

  const rawRedirect = searchParams.get('redirectTo')
  const redirectTo = safeRedirectPath(rawRedirect)
  // Sent here from a page: say why, as long as the page is one we'd follow back
  const fromLink = !!rawRedirect && redirectTo === rawRedirect

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setRefusal(null)
    setLoading(true)

    let error: unknown = null
    try {
      const result = await createClient().auth.signInWithPassword({ email: email.trim(), password })
      error = result.error
    } catch (thrown) {
      error = thrown
    }

    if (error) {
      const r = signInRefusal(error)
      if (r.kind === 'failed') {
        const code = (error as { code?: string; status?: number }).code
        Sentry.addBreadcrumb({ category: 'auth', message: `sign-in refused: ${code ?? 'no code'}` })
      }
      setRefusal(r)
      setLoading(false)
      inFlight.current = false
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[28px] font-bold leading-tight text-ink">Sign in</h1>
      {fromLink && !refusal && <DoorNotice tone="info" words={AUTH_WORDS.fromLink} />}
      {refusal && (
        <DoorNotice
          tone="attention"
          words={refusal.words}
          extra={refusal.kind === 'wrong' && PAY_FIRST_SIGNUP ? AUTH_WORDS.wrongPayer : null}
        />
      )}

      <form onSubmit={handleLogin} aria-label="Sign in" className={DOOR_CARD}>
        <div className="flex flex-col gap-2">
          <label htmlFor="signin-email" className={DOOR_LABEL}>
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className={DOOR_FIELD}
          />
        </div>
        <PasswordField
          id="signin-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          show={showPassword}
          onToggle={() => setShowPassword((s) => !s)}
        />
        <p className="-mt-2 flex justify-end">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-[15px] font-semibold text-link hover:underline"
          >
            Forgot password?
          </Link>
        </p>
        <button type="submit" disabled={loading} className={DOOR_PRIMARY}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
