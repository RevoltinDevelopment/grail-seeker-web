'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PhoneInput } from '@/components/ui/PhoneInput'
import { updateUserPreferences } from '@/lib/api/user'
import { createClient } from '@/lib/supabase/client'

type RegistrationStep = 'form' | 'verify-phone' | 'success'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<RegistrationStep>('form')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToSmsConsent, setAgreedToSmsConsent] = useState(false)

  // Verification code
  const [verificationCode, setVerificationCode] = useState('')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service')
      setLoading(false)
      return
    }

    if (!agreedToSmsConsent) {
      setError('You must agree to receive SMS notifications')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      phone: phoneNumber,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Move to verification step
      setStep('verify-phone')
      setLoading(false)
      startResendCountdown()
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: verificationCode,
      type: 'sms',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Record SMS consent timestamp and IP address (TCPA compliance)
      try {
        await updateUserPreferences({
          smsConsentGiven: true,
        })
        console.log('✅ SMS consent recorded with timestamp and IP address')
      } catch (consentError) {
        // Don't block registration if consent recording fails - log it
        console.error('⚠️ Failed to record SMS consent (non-blocking):', consentError)
      }

      setStep('success')
      setLoading(false)

      // Redirect to dashboard after brief success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }

  const handleResendCode = async () => {
    if (resendCountdown > 0) return

    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setLoading(false)
      startResendCountdown()
    }
  }

  const startResendCountdown = () => {
    setResendCountdown(60) // 60 second cooldown
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Step 1: Registration Form
  if (step === 'form') {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="container-custom flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-collector-navy">
              Grail Seeker
            </Link>
            <Link href="/" className="text-sm text-slate-700 hover:text-collector-blue">
              ← Back Home
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <h1 className="mb-2 text-2xl font-bold text-slate-950">Create Your Account</h1>
              <p className="mb-6 text-sm text-slate-600">
                Start tracking your grails with real-time eBay alerts
              </p>

              {error && (
                <div className="mb-4 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-950">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-950">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Min 8 characters</p>
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="mb-2 block text-sm font-medium text-slate-950"
                  >
                    Phone Number
                  </label>
                  <PhoneInput value={phoneNumber} onChange={setPhoneNumber} required />
                  <p className="mt-1 text-xs text-slate-600">
                    Used for SMS alert notifications. Saved in international format (E.164).
                  </p>
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-collector-blue focus:ring-2 focus:ring-collector-blue"
                    />
                    <span className="ml-2 text-sm text-slate-700">
                      I agree to the{' '}
                      <Link href="/terms" className="text-collector-blue hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-collector-blue hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={agreedToSmsConsent}
                      onChange={(e) => setAgreedToSmsConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-collector-blue focus:ring-2 focus:ring-collector-blue"
                    />
                    <span className="ml-2 text-xs text-slate-700">
                      <strong className="font-semibold text-slate-900">
                        TCPA Consent Required:
                      </strong>{' '}
                      I understand that Grail Seeker is an{' '}
                      <strong className="font-semibold text-slate-900">SMS delivery service</strong>.
                      This service delivers search results{' '}
                      <strong className="font-semibold text-slate-900">
                        exclusively via SMS text messages
                      </strong>{' '}
                      to the phone number provided. By checking this box, I provide{' '}
                      <strong className="font-semibold text-slate-900">
                        express written consent
                      </strong>{' '}
                      to receive automated text message deliveries from Grail Seeker IO, LLC.
                      <br />
                      <br />I acknowledge that:
                      <ul className="ml-4 mt-1 list-disc space-y-1">
                        <li>Consent is not required to purchase any goods or services</li>
                        <li>Message frequency varies based on my search criteria</li>
                        <li>Standard message and data rates may apply</li>
                        <li>I can opt-out by texting STOP at any time</li>
                        <li>I can text HELP for assistance</li>
                      </ul>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !email ||
                    !password ||
                    password.length < 8 ||
                    !phoneNumber ||
                    !agreedToTerms ||
                    !agreedToSmsConsent
                  }
                  className="w-full rounded-md bg-collector-blue py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login" className="text-collector-blue hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Step 2: Phone Verification
  if (step === 'verify-phone') {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="container-custom flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-collector-navy">
              Grail Seeker
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-collector-blue/10">
                  <svg
                    className="h-8 w-8 text-collector-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-slate-950">Verify Your Phone</h1>
                <p className="text-sm text-slate-600">
                  We sent a 6-digit code to <span className="font-medium">{phoneNumber}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="verificationCode"
                    className="mb-2 block text-sm font-medium text-slate-950"
                  >
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-slate-600">Enter the 6-digit code from your SMS</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full rounded-md bg-collector-blue py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Phone Number'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCountdown > 0}
                  className="text-sm text-collector-blue hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                >
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Didn't receive a code? Resend"}
                </button>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full text-sm text-slate-600 hover:text-slate-950"
                >
                  ← Change phone number
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Step 3: Success
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="container-custom flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-collector-navy">
            Grail Seeker
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-green/10">
              <svg
                className="h-8 w-8 text-success-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-950">Account Created!</h1>
            <p className="mb-6 text-sm text-slate-600">
              Your phone number has been verified. Redirecting to your dashboard...
            </p>
            <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-full animate-pulse bg-collector-blue"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
