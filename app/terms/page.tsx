import Link from 'next/link'

import { TermsContent } from '@/components/auth/TermsContent'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-collector-navy">
            Grail Seeker
          </Link>
          <Link href="/login" className="text-sm text-slate-600 hover:text-collector-blue">
            Back to Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Terms of Service</h1>
          <div className="prose prose-slate max-w-none">
            <TermsContent />
          </div>
        </div>
      </main>
    </div>
  )
}
