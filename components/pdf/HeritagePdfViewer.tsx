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
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            Loading document…
          </div>
        }
        error={
          <div className="flex items-center justify-center p-12 text-danger">
            Unable to load document. Please try again later.
          </div>
        }
      >
        {Array.from({ length: numPages ?? 0 }, (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={containerWidth || undefined}
            // Story 1.105 (U-16): white in both themes, like a printed page
            className="border-b border-line bg-paper last:border-b-0"
            loading={null}
            renderAnnotationLayer
            renderTextLayer
          />
        ))}
      </Document>
    </div>
  )
}
