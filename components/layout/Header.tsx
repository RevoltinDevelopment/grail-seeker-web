'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const mobileAvatarRef = useRef<HTMLDivElement>(null)
  const desktopAvatarRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Get user initials from email
  const getInitials = (email: string) => {
    const name = email.split('@')[0]
    const parts = name.split(/[._-]/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const initials = getInitials(user.email || '')

  // App navigation links (hamburger on mobile, visible on tablet+)
  const appNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/searches', label: 'Searches' },
    { href: '/alerts', label: 'Alerts' },
  ]

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedInsideMobile =
        mobileAvatarRef.current && mobileAvatarRef.current.contains(event.target as Node)
      const clickedInsideDesktop =
        desktopAvatarRef.current && desktopAvatarRef.current.contains(event.target as Node)

      if (!clickedInsideMobile && !clickedInsideDesktop) {
        setAvatarMenuOpen(false)
      }
    }

    if (avatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [avatarMenuOpen])

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4">
      <div className="container-custom">
        {/* Mobile Layout: Hamburger | Centered Logo | Avatar */}
        <div className="flex items-center justify-between md:hidden">
          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-md hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            <span
              className={`h-0.5 w-6 bg-slate-700 transition-all ${
                mobileMenuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-slate-700 transition-all ${
                mobileMenuOpen ? 'opacity-0' : ''
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-slate-700 transition-all ${
                mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            ></span>
          </button>

          {/* Centered Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">⚱️</span>
            <h1 className="text-xl font-bold text-collector-navy">Grail Seeker</h1>
          </Link>

          {/* Avatar */}
          <div className="relative" ref={mobileAvatarRef}>
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-collector-blue text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              aria-label="Account menu"
            >
              {initials}
            </button>

            {/* Avatar Dropdown */}
            {avatarMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="truncate text-sm text-slate-700">{user.email}</p>
                </div>
                <nav className="py-2">
                  <Link
                    href="/settings"
                    onClick={() => setAvatarMenuOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      pathname === '/settings'
                        ? 'bg-blue-50 text-collector-blue'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Tablet/Desktop Layout: Logo | Nav Links | Avatar */}
        <div className="hidden items-center justify-between md:flex">
          {/* Logo + Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">⚱️</span>
              <h1 className="text-xl font-bold text-collector-navy">Grail Seeker</h1>
            </Link>

            <nav className="flex items-center gap-6">
              {appNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    pathname === link.href
                      ? 'font-medium text-collector-blue'
                      : 'text-slate-700 hover:text-collector-blue'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Avatar */}
          <div className="relative" ref={desktopAvatarRef}>
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-collector-blue text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              aria-label="Account menu"
            >
              {initials}
            </button>

            {/* Avatar Dropdown */}
            {avatarMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="truncate text-sm text-slate-700">{user.email}</p>
                </div>
                <nav className="py-2">
                  <Link
                    href="/settings"
                    onClick={() => setAvatarMenuOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      pathname === '/settings'
                        ? 'bg-blue-50 text-collector-blue'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-4 border-t border-slate-200 pt-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {appNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-50 font-medium text-collector-blue'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
