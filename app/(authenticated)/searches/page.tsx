import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SearchesClient from './SearchesClient'

export default async function SearchesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <SearchesClient user={user} />
}
