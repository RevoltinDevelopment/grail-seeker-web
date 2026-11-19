import { redirect } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { readDoorPlan } from '@/lib/api/server'
import { DOOR_PATH, doorStep, needsWelcome } from '@/lib/auth/door'
import { createClient } from '@/lib/supabase/server'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Story 1.106 (U-18, need 39): an account that still owes a step goes to it, and nowhere else
  // (lib/auth/door.ts). The welcome step needs no backend, so it's decided before the plan read.
  const step = needsWelcome(user) ? 'welcome' : doorStep(user, await readDoorPlan(supabase))
  if (step) redirect(DOOR_PATH[step])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
