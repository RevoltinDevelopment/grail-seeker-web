import Link from 'next/link'

import { HeritagePdfLoader } from '@/components/pdf/HeritagePdfLoader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Heritage Terms and Conditions of Auction | Grail Seeker',
}

export default function HeritageTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-collector-navy">
            Grail Seeker
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
          Heritage Terms and Conditions of Auction
        </h1>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <HeritagePdfLoader url="/heritage-terms.pdf" />
        </div>
      </main>
    </div>
  )
}
