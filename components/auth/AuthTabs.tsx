'use client'

import { useCallback } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

interface AuthTabsProps {
  activeTab: 'signin' | 'signup'
  className?: string
}

export function AuthTabs({ activeTab, className = '' }: AuthTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = useCallback(
    (tab: 'signin' | 'signup') => {
      const params = new URLSearchParams(searchParams.toString())

      if (tab === 'signup') {
        params.set('tab', 'signup')
      } else {
        params.delete('tab')
      }

      // Preserve redirectTo param
      const redirectTo = searchParams.get('redirectTo')
      if (redirectTo) {
        params.set('redirectTo', redirectTo)
      }

      const queryString = params.toString()
      router.push(`/login${queryString ? `?${queryString}` : ''}`)
    },
    [router, searchParams]
  )

  return (
    <div className={`flex rounded-lg bg-slate-100 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => handleTabChange('signin')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === 'signin'
            ? 'bg-white text-collector-blue shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => handleTabChange('signup')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === 'signup'
            ? 'bg-white text-collector-blue shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Sign Up
      </button>
    </div>
  )
}
