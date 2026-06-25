'use client'

import dynamic from 'next/dynamic'

const HeritagePdfViewer = dynamic(
  () => import('@/components/pdf/HeritagePdfViewer').then((m) => m.HeritagePdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading document…
      </div>
    ),
  },
)

export function HeritagePdfLoader({ url }: { url: string }) {
  return <HeritagePdfViewer url={url} />
}
