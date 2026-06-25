'use client'

import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface HeritagePdfViewerProps {
  url: string
}

export function HeritagePdfViewer({ url }: HeritagePdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width))
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex items-center justify-center p-12 text-slate-500">
            Loading document…
          </div>
        }
        error={
          <div className="flex items-center justify-center p-12 text-red-500">
            Unable to load document. Please try again later.
          </div>
        }
      >
        {Array.from({ length: numPages ?? 0 }, (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={containerWidth || undefined}
            className="border-b border-slate-200 last:border-b-0"
            renderAnnotationLayer
            renderTextLayer
          />
        ))}
      </Document>
    </div>
  )
}
