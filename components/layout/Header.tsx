'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAccountSummary } from '@/hooks/useAccountSummary'
import { useLogout } from '@/hooks/useLogout'
import { useUnseenCount } from '@/hooks/useUnseenAlerts'
import { BUILT_PAGES, PAGE_HREF } from '@/lib/built-pages'

import type { User } from '@supabase/supabase-js'

/**
 * Story 1.82 (U-04): the app's header, as drawn (docs/ux/mockups/subscriber-experience/
 * searches-home.html, phone-menu.js; UX plan section 10). The chalice and wordmark lead to
 * Searches; from 700 pixels, Searches, Alerts with the count of new alerts, and Reports; the
 * avatar menu holds "Plan and slots" (Story 1.85, for an account with a plan), Settings and Log out. On a phone: the menu button (an X while open, a dot
 * while there are new alerts), the wordmark centred, the avatar. On the design tokens throughout.
 */

interface HeaderProps {
  user: User
}

const NAV = [
  { href: '/searches', label: 'Searches' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/reports', label: 'Reports' },
] as const

/** "3", or "99+" above 99. */
export function countLabel(count: number): string {
  return count > 99 ? '99+' : String(count)
}

function initialsOf(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NewCount({ count, long = false }: { count: number; long?: boolean }) {
  if (count <= 0) return null
  return (
    <span className="inline-grid h-[22px] min-w-[22px] place-items-center rounded-full bg-primary px-[7px] text-xs font-bold text-primary-foreground">
      <span aria-hidden="true">{long ? `${countLabel(count)} new` : countLabel(count)}</span>
      <span className="sr-only">{`${count} new ${count === 1 ? 'alert' : 'alerts'}`}</span>
    </span>
  )
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const logout = useLogout()
  const unseen = useUnseenCount()
  // Story 1.85 (plan-page-way-in.html): "Plan and slots", with the plan and the slots in use beneath
  const { account } = useAccountSummary()
  // Code review: through the built-pages switch, as every other way to the plan page
  const planLine =
    BUILT_PAGES.plan && account?.plan
      ? account.status === 'lapsed'
        ? `${account.plan.name} · on hold`
        : `${account.plan.name} · ${account.slots.inUse} of ${account.slots.entitled}`
      : null
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const avatarArea = useRef<HTMLDivElement>(null)
  const avatarButton = useRef<HTMLButtonElement>(null)

  // Escape closes whichever menu is open and returns focus to its button.
  useEffect(() => {
    if (!menuOpen && !avatarOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (menuOpen) {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
      if (avatarOpen) {
        setAvatarOpen(false)
        avatarButton.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen, avatarOpen])

  // A click outside the avatar menu closes it.
  useEffect(() => {
    if (!avatarOpen) return
    const onDown = (event: MouseEvent) => {
      if (avatarArea.current && !avatarArea.current.contains(event.target as Node))
        setAvatarOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [avatarOpen])

  // Moving to another page closes both menus.
  useEffect(() => {
    setMenuOpen(false)
    setAvatarOpen(false)
  }, [pathname])

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="mx-auto grid min-h-16 max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-x-4 px-4 tablet:flex tablet:px-8">
        {/* Phone: the menu button, with a dot while there are new alerts */}
        <button
          ref={menuButton}
          type="button"
          className="relative -ml-2.5 inline-grid h-11 w-11 place-items-center justify-self-start rounded-button text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary tablet:hidden"
          aria-expanded={menuOpen}
          aria-controls="app-menu"
          aria-label={
            menuOpen
              ? 'Close menu'
              : unseen > 0
                ? `Open menu, ${unseen} new ${unseen === 1 ? 'alert' : 'alerts'}`
                : 'Open menu'
          }
          onClick={() => {
            setAvatarOpen(false)
            setMenuOpen((open) => !open)
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
          {unseen > 0 && !menuOpen && (
            <span
              className="absolute right-[7px] top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface"
              data-testid="menu-dot"
              aria-hidden="true"
            />
          )}
        </button>

        {/* The chalice and the wordmark, a link to Searches */}
        <Link
          href="/searches"
          className="flex min-h-11 items-center gap-2.5 justify-self-center text-ink no-underline"
        >
          <Image src="/images/chalice.png" alt="" width={34} height={34} priority />
          <span className="whitespace-nowrap font-cinzel text-[17px] font-semibold tracking-[0.08em]">
            GRAIL SEEKER
          </span>
        </Link>

        {/* From 700 pixels: the main links */}
        <nav className="ml-4 hidden gap-1 tablet:flex" aria-label="Main">
          {NAV.map((link) => {
            const current = isCurrent(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-button px-3 text-[15px] no-underline ${
                  current
                    ? 'bg-primary-tint font-semibold text-ink'
                    : 'font-medium text-muted-foreground hover:text-ink'
                }`}
              >
                {link.label}
                {link.href === '/alerts' && <NewCount count={unseen} />}
              </Link>
            )
          })}
        </nav>

        {/* The avatar and its menu */}
        <div
          ref={avatarArea}
          className="relative justify-self-end tablet:ml-auto"
          onBlur={(event) => {
            // Focus leaving the avatar and its list closes the list (a keyboard user tabbing past).
            if (avatarOpen && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setAvatarOpen(false)
            }
          }}
        >
          <button
            ref={avatarButton}
            type="button"
            className="h-11 w-11 rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-label="Account menu"
            aria-expanded={avatarOpen}
            aria-controls="account-menu"
            onClick={() => {
              setMenuOpen(false)
              setAvatarOpen((open) => !open)
            }}
          >
            {initialsOf(user.email || '')}
          </button>
          {avatarOpen && (
            <nav
              id="account-menu"
              className="absolute right-0 top-14 z-50 flex w-[260px] flex-col rounded-card border border-line-strong bg-surface p-1.5 shadow-lg"
              aria-label="Account"
            >
              <p className="truncate border-b border-line px-3 pb-2 pt-2.5 text-[13px] text-muted-foreground">
                {user.email}
              </p>
              {planLine && (
                <Link
                  href={PAGE_HREF.plan}
                  onClick={() => setAvatarOpen(false)}
                  aria-current={isCurrent(pathname, PAGE_HREF.plan) ? 'page' : undefined}
                  className={`flex min-h-11 flex-col justify-center rounded-button px-3 py-1.5 text-[15px] font-semibold text-ink no-underline ${
                    isCurrent(pathname, PAGE_HREF.plan) ? 'bg-primary-tint' : 'hover:bg-chip'
                  }`}
                >
                  <span>Plan and slots</span>
                  <span className="text-[13px] font-normal text-muted-foreground">{planLine}</span>
                </Link>
              )}
              <Link
                href="/settings"
                onClick={() => setAvatarOpen(false)}
                className={`flex min-h-11 items-center rounded-button px-3 text-[15px] font-semibold text-ink no-underline ${
                  isCurrent(pathname, '/settings') ? 'bg-primary-tint' : 'hover:bg-chip'
                }`}
              >
                Settings
              </Link>
              <hr className="my-1.5 border-0 border-t border-line" />
              <button
                type="button"
                onClick={() => void logout()}
                className="flex min-h-11 items-center rounded-button px-3 text-left text-[15px] font-semibold text-ink hover:bg-chip"
              >
                Log out
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Phone: the menu, under the header */}
      {menuOpen && (
        <nav
          id="app-menu"
          className="flex flex-col border-t border-line bg-surface px-4 pb-3 pt-1.5 tablet:hidden"
          aria-label="Main"
        >
          {NAV.map((link) => {
            const current = isCurrent(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-12 items-center justify-between rounded-button px-3 text-base font-semibold text-ink no-underline ${
                  current ? 'bg-primary-tint' : ''
                }`}
              >
                {link.label}
                {link.href === '/alerts' && <NewCount count={unseen} long />}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
