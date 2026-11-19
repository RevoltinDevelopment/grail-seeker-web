'use client'

import { useEffect } from 'react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function LegalModal({ isOpen, onClose, title, children }: LegalModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-h"
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-card bg-surface shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="legal-modal-h" className="text-lg font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-chip hover:text-ink"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Story 1.106: the legal pages' text styles (Story 1.105's LegalProse, without its panel);
              the old `prose` classes did nothing, as @tailwindcss/typography isn't installed */}
          <div className="flex flex-col gap-3.5 text-[15px] text-ink [&_a]:font-semibold [&_a]:text-link [&_a]:underline [&_h2]:mt-3 [&_h2]:text-card-title [&_h2]:font-bold [&_h3]:mt-1 [&_h3]:font-semibold [&_hr]:my-2 [&_hr]:border-line [&_li]:mt-1.5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-button bg-primary text-[15px] font-semibold text-primary-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
