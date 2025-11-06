'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearches } from '@/hooks/useSearches'
import Header from '@/components/layout/Header'
import type { User } from '@supabase/supabase-js'

export default function SearchesClient({ user }: { user: User }) {
  const router = useRouter()
  const { searches, isLoading, deleteSearch, updateSearchStatus } = useSearches()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    await deleteSearch.mutateAsync(id)
    setDeleteConfirmId(null)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await updateSearchStatus.mutateAsync({ id, isActive: !currentStatus })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header user={user} />

        {/* Loading State */}
        <main className="container-custom py-12">
          <div className="py-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-collector-blue"></div>
            <p className="mt-4 text-slate-600">Loading searches...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />

      {/* Main Content */}
      <main className="container-custom py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold">My Searches</h2>
            <p className="text-slate-600">
              {searches.length > 0
                ? `Showing ${searches.length} active ${searches.length === 1 ? 'search' : 'searches'}`
                : 'Manage your grail searches'}
            </p>
          </div>
          <Link
            href="/searches/new"
            className="rounded-md bg-collector-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
          >
            + Create Search
          </Link>
        </div>

        {/* Empty State */}
        {searches.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-5xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold">No searches yet</h3>
            <p className="mb-6 text-slate-600">
              Create your first grail search to start monitoring.
            </p>
            <Link
              href="/searches/new"
              className="inline-block rounded-md border-2 border-collector-blue px-6 py-3 font-semibold text-collector-blue transition-colors hover:bg-blue-50"
            >
              Create Search →
            </Link>
          </div>
        )}

        {/* Search Cards Grid */}
        {searches.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {searches.map((search) => (
              <div
                key={search.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-collector-blue hover:shadow-md"
              >
                {/* Series Title */}
                <h3 className="mb-1 text-lg font-semibold">
                  {search.series.title} #{search.issueNumber}
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  Vol. {search.series.volume} ({search.series.yearRange})
                </p>

                {/* Search Criteria */}
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Max Price:</span>
                    <span className="font-medium">
                      {search.maxPrice ? `$${search.maxPrice.toLocaleString()}` : 'Any'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Grade:</span>
                    <span className="font-medium">
                      {search.gradeMin && search.gradeMax
                        ? `${Number(search.gradeMin).toFixed(1)} - ${Number(search.gradeMax).toFixed(1)}`
                        : 'Any'}
                    </span>
                  </div>
                  {search.pageQuality && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pages:</span>
                      <span className="font-medium">{search.pageQuality}</span>
                    </div>
                  )}
                  {search.gradingAuthority && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Graded by:</span>
                      <span className="font-medium uppercase">{search.gradingAuthority}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      search.isActive
                        ? 'bg-success-green text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {search.isActive ? '✅ Active' : '⏸ Paused'}
                  </span>
                  <span className="ml-2 text-sm text-slate-600">
                    {search.alertCount || 0} alerts
                  </span>
                </div>

                {/* Platforms */}
                <div className="mb-4">
                  <p className="mb-1 text-xs text-slate-600">Monitoring:</p>
                  <div className="flex flex-wrap gap-1">
                    {search.platforms.includes('ebay') && (
                      <span className="rounded bg-ebay-red px-2 py-1 text-xs text-white">
                        eBay ✓
                      </span>
                    )}
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      Heritage (Q1)
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      MyComicShop (Q1)
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <p className="mb-4 text-xs text-slate-500">
                  Last checked: {new Date(search.lastCheckedAt).toLocaleString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/searches/${search.id}/edit`}
                    className="flex-1 rounded-md border-2 border-collector-blue px-3 py-2 text-center text-sm font-semibold text-collector-blue transition-colors hover:bg-blue-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(search.id, search.isActive)}
                    disabled={updateSearchStatus.isPending}
                    className="flex-1 rounded-md border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    {search.isActive ? '⏸ Pause' : '▶️ Resume'}
                  </button>
                </div>

                {/* Delete Button */}
                {deleteConfirmId === search.id ? (
                  <div className="mt-3 rounded-md border border-error-red bg-red-50 p-3">
                    <p className="mb-2 text-sm font-medium text-error-red">Delete this search?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(search.id)}
                        disabled={deleteSearch.isPending}
                        className="flex-1 rounded-md bg-error-red px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteSearch.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 rounded-md border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(search.id)}
                    className="mt-3 w-full rounded-md px-3 py-2 text-sm font-semibold text-error-red transition-colors hover:bg-red-50"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
