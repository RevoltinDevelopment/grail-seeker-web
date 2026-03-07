'use client'

import { useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { LegalModal } from '@/components/auth/LegalModal'
import { PrivacyContent } from '@/components/auth/PrivacyContent'
import { TermsContent } from '@/components/auth/TermsContent'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { updateUserPreferences } from '@/lib/api/user'
import { createClient } from '@/lib/supabase/client'

type SignUpStep = 'credentials' | 'phone' | 'verify' | 'success'

interface SignUpFlowProps {
  className?: string
}

export function SignUpFlow({ className = '' }: SignUpFlowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<SignUpStep>('credentials')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToSmsConsent, setAgreedToSmsConsent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const startResendCountdown = () => {
    setResendCountdown(60)
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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setStep('phone')
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Phone number is required')
      setLoading(false)
      return
    }

    if (!agreedToSmsConsent) {
      setError('You must agree to receive SMS notifications')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Step 1: Sign up with email + password only
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('No user returned from signup')

      // Step 2: Add phone number (automatically triggers SMS with OTP)
      const { error: updateError } = await supabase.auth.updateUser({
        phone: phoneNumber,
      })

      if (updateError) throw updateError

      // Phone added successfully, SMS sent automatically
      setStep('verify')
      setLoading(false)
      startResendCountdown()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(errorMessage)
      setLoading(false)
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
      type: 'phone_change',
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
      } catch (consentError) {
        console.error('Failed to record SMS consent (non-blocking):', consentError)
      }

      setStep('success')
      setLoading(false)

      // Redirect after success
      setTimeout(() => {
        const redirectTo = searchParams.get('redirectTo') || '/dashboard'
        router.push(redirectTo)
        router.refresh()
      }, 2000)
    }
  }

  const handleResendCode = async () => {
    if (resendCountdown > 0) return

    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.resend({
      phone: phoneNumber,
      type: 'phone_change',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setLoading(false)
      startResendCountdown()
    }
  }

  // Step 1: Email & Password
  if (step === 'credentials') {
    return (
      <div className={className}>
        <div className="mb-4 text-center">
          <p className="text-xs text-slate-500">Step 1 of 2</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
            {error}
          </div>
        )}

        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-email"
              className="mb-2 block text-sm font-medium text-slate-950"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-info-blue focus:outline-none focus:ring-2 focus:ring-info-blue/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-2 block text-sm font-medium text-slate-950"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 focus:border-info-blue focus:outline-none focus:ring-2 focus:ring-info-blue/20"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
          </div>

          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-info-blue focus:ring-2 focus:ring-info-blue"
            />
            <span className="ml-2 text-sm text-slate-700">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-info-blue hover:underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-info-blue hover:underline"
              >
                Privacy Policy
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={!email || !password || password.length < 8 || !agreedToTerms}
            className="w-full rounded-md bg-info-blue py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </form>

        {/* Legal Modals */}
        <LegalModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          title="Terms of Service"
        >
          <TermsContent />
        </LegalModal>

        <LegalModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          title="Privacy Policy"
        >
          <PrivacyContent />
        </LegalModal>
      </div>
    )
  }

  // Step 2: Phone & TCPA Consent
  if (step === 'phone') {
    return (
      <div className={className}>
        <div className="mb-4 text-center">
          <p className="text-xs text-slate-500">Step 2 of 2</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
            {error}
          </div>
        )}

        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-phone"
              className="mb-2 block text-sm font-medium text-slate-950"
            >
              Phone Number
            </label>
            <PhoneInput value={phoneNumber} onChange={setPhoneNumber} required />
          </div>

          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreedToSmsConsent}
              onChange={(e) => setAgreedToSmsConsent(e.target.checked)}
              className="mt-1 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-info-blue focus:ring-2 focus:ring-info-blue"
            />
            <span className="ml-2 text-xs text-slate-700">
              <strong className="font-semibold text-slate-900">TCPA Consent Required:</strong> I
              understand that Grail Seeker is an{' '}
              <strong className="font-semibold text-slate-900">SMS delivery service</strong>. This
              service delivers search results{' '}
              <strong className="font-semibold text-slate-900">
                exclusively via SMS text messages
              </strong>{' '}
              to the phone number provided. By checking this box, I provide{' '}
              <strong className="font-semibold text-slate-900">express written consent</strong> to
              receive automated text message deliveries from Grail Seeker IO, LLC.
              <br />
              <br />I acknowledge that:
              <ul className="ml-4 mt-1 list-disc space-y-1">
                <li>Message frequency varies based on my search criteria</li>
                <li>Standard message and data rates may apply</li>
                <li>I can opt-out by texting STOP at any time</li>
                <li>I can text HELP for assistance</li>
              </ul>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !phoneNumber || !agreedToSmsConsent}
            className="w-full rounded-md bg-info-blue py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setStep('credentials')}
          className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900"
        >
          &larr; Back
        </button>
      </div>
    )
  }

  // Step 3: Phone Verification
  if (step === 'verify') {
    return (
      <div className={className}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-info-blue/10">
            <svg
              className="h-8 w-8 text-info-blue"
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
          <h2 className="mb-2 text-xl font-bold text-slate-950">Verify Your Phone</h2>
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
              htmlFor="verification-code"
              className="mb-2 block text-sm font-medium text-slate-950"
            >
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-info-blue focus:outline-none focus:ring-2 focus:ring-info-blue/20"
              autoFocus
            />
            <p className="mt-1 text-center text-xs text-slate-500">
              Enter the 6-digit code from your SMS
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="w-full rounded-md bg-info-blue py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Phone Number'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCountdown > 0}
            className="text-sm text-info-blue hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            {resendCountdown > 0
              ? `Resend code in ${resendCountdown}s`
              : "Didn't receive a code? Resend"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setStep('phone')}
          className="mt-4 w-full text-sm text-slate-600 hover:text-slate-900"
        >
          &larr; Change phone number
        </button>
      </div>
    )
  }

  // Step 4: Success
  return (
    <div className={`text-center ${className}`}>
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
      <h2 className="mb-2 text-xl font-bold text-slate-950">Account Created!</h2>
      <p className="mb-6 text-sm text-slate-600">
        Your phone number has been verified. Redirecting to your dashboard...
      </p>
      <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-full animate-pulse bg-info-blue"></div>
      </div>
    </div>
  )
}
