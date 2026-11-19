import { TermsContent } from '@/components/auth/TermsContent'
import { LegalPage, LegalProse } from '@/components/legal/LegalPage'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Grail Seeker',
}

/** Story 1.105 (U-16): on the tokens. The words are S-23's, unchanged here. */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <LegalProse>
        <TermsContent />
      </LegalProse>
    </LegalPage>
  )
}
