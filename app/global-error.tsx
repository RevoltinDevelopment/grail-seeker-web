'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Inter, Cinzel } from 'next/font/google'

import './globals.css'
import { PlainHeader } from '@/components/layout/PublicHeader'
import { StatusScreen } from '@/components/status/StatusScreen'

const inter = Inter({ subsets: ['latin'] })
const cinzel = Cinzel({ subsets: ['latin'], weight: ['600'], variable: '--font-cinzel' })

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Story 1.105 (U-16): the root layout itself failed. This replaces the whole document, so it
 * brings its own stylesheet and fonts (it had neither) and the plain header: the app header
 * needs the providers the root layout would have given, and its link is a full page load. The drawn error words, as everywhere.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en" className="font-sans">
      <body className={`${inter.className} ${cinzel.variable} min-h-screen bg-background`}>
        <PlainHeader />
        <main>
          <StatusScreen kind="error" onRetry={reset} error={error} />
        </main>
      </body>
    </html>
  )
}
