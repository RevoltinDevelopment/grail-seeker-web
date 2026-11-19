import { LegalPage } from '@/components/legal/LegalPage'
import { HeritagePdfLoader } from '@/components/pdf/HeritagePdfLoader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Mahan, 2026-11-19
  title: 'Heritage Auctions terms and conditions | Grail Seeker',
}

/**
 * Story 1.105 (U-16): the heading as drawn; the PDF's pages stay white in both themes
 * (`bg-paper`, in the viewer).
 */
export default function HeritageTermsPage() {
  return (
    <LegalPage title="Heritage Auctions terms and conditions of auction">
      <div className="overflow-hidden rounded-card border border-line">
        <HeritagePdfLoader url="/heritage-terms.pdf" />
      </div>
    </LegalPage>
  )
}
