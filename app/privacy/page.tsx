import { PrivacyContent } from '@/components/auth/PrivacyContent'
import { LegalPage, LegalProse } from '@/components/legal/LegalPage'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Grail Seeker',
}

/** Story 1.105 (U-16): laid out as Terms (not drawn on its own). The words are unchanged. */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <LegalProse>
        <PrivacyContent />
      </LegalProse>
    </LegalPage>
  )
}
