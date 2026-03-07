import { ReactNode } from 'react'

import Link from 'next/link'

interface AuthPanelProps {
  children: ReactNode
  className?: string
}

export function AuthPanel({ children, className = '' }: AuthPanelProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-between bg-white px-6 py-8 lg:w-2/5 lg:px-12 ${className}`}
    >
      <div className="w-full max-w-sm flex-1 flex flex-col justify-center">{children}</div>

      {/* Footer links */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/privacy" className="hover:text-slate-700 hover:underline">
          Privacy Policy
        </Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-slate-700 hover:underline">
          Terms
        </Link>
        <span>·</span>
        <Link href="mailto:support@grailseeker.io" className="hover:text-slate-700 hover:underline">
          Help
        </Link>
      </div>
    </div>
  )
}
