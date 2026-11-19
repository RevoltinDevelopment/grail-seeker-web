import { SessionHeader } from '@/components/layout/SessionHeader'
import { StatusScreen } from '@/components/status/StatusScreen'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found | Grail Seeker',
}

/**
 * Story 1.105 (U-16): an address that matches nothing (the app had no page for it). Under the
 * app header when signed in, the public header when not, decided in the browser (SessionHeader
 * says why); answered with 404. Not sent to Sentry: a wrong address isn't a fault.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SessionHeader />
      <main>
        <StatusScreen kind="notFound" />
      </main>
    </div>
  )
}
