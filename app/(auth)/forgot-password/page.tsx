import { Door } from '@/components/auth/Door'
import { SendLinkForm } from '@/components/auth/SendLinkForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reset your password | Grail Seeker' }

/** Story 1.106 (U-18): Forgot password, in the door's quiet column (front-door-password.html). */
export default function ForgotPasswordPage() {
  return (
    <Door>
      <SendLinkForm variant="forgot" />
    </Door>
  )
}
