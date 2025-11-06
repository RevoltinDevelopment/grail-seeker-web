import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AlertsClient from './AlertsClient'

export default async function AlertsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <AlertsClient user={user} />
}
