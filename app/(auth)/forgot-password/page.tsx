'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
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
              <p className="mb-2 text-slate-700">We sent a password reset link to:</p>
              <p className="mb-6 font-semibold text-collector-navy">{email}</p>
              <p className="mb-8 text-sm text-slate-600">Click the link to reset your password.</p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="w-full rounded-md border-2 border-collector-blue px-6 py-3 font-semibold text-collector-blue transition-colors hover:bg-blue-50"
                >
                  Resend Link
                </button>
                <Link href="/login" className="block text-sm text-collector-blue hover:underline">
                  ← Back to Login
                </Link>
              </div>
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

      {/* Forgot Password Form */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="mb-3 text-center text-2xl font-bold">Reset Password</h1>
            <p className="mb-6 text-center text-sm text-slate-600">
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="mb-6 rounded-md border border-error-red bg-red-50 p-3 text-sm text-error-red">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-collector-blue py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-collector-blue hover:underline">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
