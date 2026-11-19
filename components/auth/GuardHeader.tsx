'use client'

import { useEffect, useRef, useState } from 'react'

import { BrandLink } from '@/components/layout/BrandLink'
import { initialsOf } from '@/components/layout/Header'
import { useLogout } from '@/hooks/useLogout'

/**
 * Story 1.106 (U-18, need 39): the header over a guarded step (front-door-no-plan.html, "no plan:
 * menu open"): the brand, which stays on the step, and the account menu with only the email and
 * Log out. Nothing here leads into the app: the step is the only way on.
 */
export function GuardHeader({ email, home }: { email: string; home: string }) {
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const area = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    const onClick = (event: MouseEvent) => {
      if (area.current && !area.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-4 tablet:px-8">
        <BrandLink href={home} plain />
        <div
          ref={area}
          className="relative"
          onBlur={(event) => {
            if (open && !event.currentTarget.contains(event.relatedTarget as Node | null))
              setOpen(false)
          }}
        >
          <button
            ref={button}
            type="button"
            className="h-11 w-11 rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-label="Account menu"
            aria-expanded={open}
            aria-controls="guard-account-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {initialsOf(email)}
          </button>
          {open && (
            <nav
              id="guard-account-menu"
              aria-label="Account"
              className="absolute right-0 top-14 z-50 flex w-[260px] flex-col rounded-card border border-line-strong bg-surface p-1.5 shadow-lg"
            >
              <p className="border-b border-line px-3 pb-2 pt-2.5 text-[13px] text-muted-foreground">
                Signed in as
                <b className="block truncate font-semibold text-ink">{email}</b>
              </p>
              <button
                type="button"
                onClick={() => void logout()}
                className="mt-1.5 flex min-h-11 items-center rounded-button px-3 text-left text-[15px] font-semibold text-ink hover:bg-chip"
              >
                Log out
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
