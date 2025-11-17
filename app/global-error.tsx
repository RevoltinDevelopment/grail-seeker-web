'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900">Critical Error</h1>
              <p className="text-slate-600">
                We encountered a critical error loading the application. Please try refreshing the
                page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 rounded-md bg-slate-100 p-4">
                <p className="mb-2 font-mono text-sm font-semibold text-red-600">
                  Error Details (Development Only):
                </p>
                <p className="font-mono text-xs text-slate-700">{error.message}</p>
                {error.digest && (
                  <p className="mt-2 font-mono text-xs text-slate-500">Error ID: {error.digest}</p>
                )}
                <p className="mt-2 font-mono text-xs text-slate-500">
                  This error occurred in the root layout.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="w-full rounded-md bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-md border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full rounded-md border border-slate-300 px-4 py-3 text-center font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                Go to Home
              </button>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Need help?{' '}
                <a
                  href="mailto:support@grailseeker.io"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
