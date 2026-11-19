import { redirect } from 'next/navigation'

import { readDoorAccount } from '@/lib/api/server'
import { DOOR_PATH, doorStep, needsWelcome, type DoorStep } from '@/lib/auth/door'
import { createClient } from '@/lib/supabase/server'

import type { User } from '@supabase/supabase-js'

/**
 * Story 1.106 (U-18): a guard page's own check. Only an account that owes this step may see it:
 * signed out → sign-in; owing a different step → that step; owing none → Searches. Same rule as
 * the signed-in layout (lib/auth/door.ts).
 *
 * The guard pages are in the middleware's matcher, so a refreshed session's cookies are saved
 * before this reads one (lib/supabase/currentUser.ts).
 */
export async function requireDoorStep(
  expected: Exclude<DoorStep, 'welcome'>
): Promise<{ user: User; searchCount: number | null; planName: string | null }> {
  const supabase = await createClient()
  let user: User | null = null
  try {
    user = (await supabase.auth.getUser()).data.user
  } catch {
    user = null
  }
  if (!user) redirect('/login')
  if (needsWelcome(user)) redirect(DOOR_PATH.welcome)
  const account = await readDoorAccount(supabase)
  // Code review: if the plan can't be read here, show the step the layout chose rather than send the
  // person back to it (with a slow backend the two could bounce between each other)
  if (account.plan !== undefined) {
    const step = doorStep(user, account.plan)
    if (step !== expected) redirect(step ? DOOR_PATH[step] : '/searches')
  }
  return { user, searchCount: account.searchCount, planName: account.planName }
}
