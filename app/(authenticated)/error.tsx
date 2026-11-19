'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { StatusScreen } from '@/components/status/StatusScreen'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** Story 1.105 (U-16): an error on a signed-in page, under the app header the layout gives it. */
export default function AuthenticatedError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return <StatusScreen kind="error" onRetry={reset} error={error} />
}
