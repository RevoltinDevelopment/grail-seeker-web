'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { PlainHeader } from '@/components/layout/PublicHeader'
import { StatusScreen } from '@/components/status/StatusScreen'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Story 1.105 (U-16): an error outside the signed-in pages (sign-in, the legal pages), or in the
 * signed-in layout itself. No layout gives it a header, and it can't tell who is signed in, so it
 * carries the plain one (brand only).
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      <PlainHeader />
      <main>
        <StatusScreen kind="error" onRetry={reset} error={error} />
      </main>
    </div>
  )
}
