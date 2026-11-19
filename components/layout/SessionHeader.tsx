'use client'

import { useEffect, useState } from 'react'

import Header from '@/components/layout/Header'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { createClient } from '@/lib/supabase/client'

import type { User } from '@supabase/supabase-js'

/**
 * Story 1.105 (code review): the right header for a page any address can reach (not found),
 * decided in the browser. The middleware doesn't run on every address, and a server read there
 * could refresh the session without being able to save it; the browser client saves its own
 * cookies. Until the answer comes, an empty bar of the same height holds the place.
 */
export function SessionHeader() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    let live = true
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (live) setUser(data.user ?? null)
      })
      .catch(() => {
        if (live) setUser(null)
      })
    return () => {
      live = false
    }
  }, [])

  if (user === undefined) {
    return <div className="min-h-16 border-b border-line bg-surface" aria-hidden="true" />
  }
  return user ? <Header user={user} /> : <PublicHeader />
}
