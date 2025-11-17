'use client'

import { useState } from 'react'
import Link from 'next/link'

import { PhoneInput } from '@/components/ui/PhoneInput'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          phone_number: phoneNumber,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
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

        {/* Success Message */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-5xl">✅</div>
              <h1 className="mb-4 text-2xl font-bold">Check Your Email</h1>
              <p className="mb-2 text-slate-700">We sent a verification link to:</p>
              <p className="mb-6 font-semibold text-collector-navy">{email}</p>
              <p className="mb-8 text-sm text-slate-600">
                Click the link in the email to verify your account and start finding your grails.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-md bg-collector-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

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

      {/* Register Form */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-center text-2xl font-bold">Create Your Account</h1>

            {error && (
              <div className="mb-6 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-950">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-collector-blue focus:outline-none focus:ring-2 focus:ring-collector-blue"
                  placeholder="you@example.com"
                />
                <p className="mt-1 text-xs text-slate-600">We'll send a confirmation email</p>
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
                    placeholder="••••••••"
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

              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-collector-blue focus:ring-collector-blue"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-slate-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-collector-blue hover:underline">
                    Terms of Service
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className="w-full rounded-md bg-collector-blue py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-700">
              Have an account?{' '}
              <Link href="/login" className="font-medium text-collector-blue hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
