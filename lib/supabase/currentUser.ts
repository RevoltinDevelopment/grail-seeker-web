import { createClient } from '@/lib/supabase/server'

import type { User } from '@supabase/supabase-js'

/** Long enough for a normal answer; short enough that a hung provider doesn't hold the page. */
const SESSION_READ_TIMEOUT_MS = 3000

/**
 * Story 1.105 (U-16): the signed-in user for a legal page, which anyone may open, or null. A
 * failure or a slow answer counts as signed out: these pages must still render.
 *
 * ONLY for routes the middleware covers (middleware.ts `config.matcher`). Reading the user can
 * refresh an expired session, and a Server Component can't save the refreshed cookies; on a
 * route the middleware covers, the middleware has already refreshed and saved them. Elsewhere,
 * the browser would keep a refresh token that has been used up, and the next page would sign the
 * person out. (The not-found page matches any address, so it decides its header in the browser:
 * components/layout/SessionHeader.tsx.)
 */
export async function currentUserOrNull(): Promise<User | null> {
  try {
    const supabase = await createClient()
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), SESSION_READ_TIMEOUT_MS)
    })
    const read = supabase.auth.getUser().then(({ data }) => data.user ?? null)
    try {
      return await Promise.race([read, timeout])
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}
