'use client'

import { useState } from 'react'

import { HowItWorksModal } from './HowItWorksModal'
import { TestimonialBlock } from './TestimonialBlock'

/**
 * The March hero beside sign-in, put back on 2026-11-19 (Mahan) in place of Story 1.106's Grail
 * Seeker Gallery placeholder, until he and Sally take another cut at it. The sign-in column
 * (components/auth/Door) is unchanged. Two lines rewritten so they are true (Mahan, 2026-11-19):
 * the old "auction houses" (Heritage Auctions is the one) and "SMS alerts within 30 minutes"
 * (searches run twice a day). Fixed colours on purpose: the navy panel is the same in both themes.
 */
interface HeroPanelProps {
  className?: string
}

const benefits = [
  'Monitor eBay, Heritage Auctions, and the coolest comic book retailers (including MyComicShop) automatically',
  'Set exact criteria: series, issue, grade, price',
  'Grail Seeker searches for you every morning and evening, and texts you when we find your book',
  'Find the rare and scarce books that others miss',
]

/** The hero's headline as a banner above sign-in on a phone, where the panel is hidden. */
export function HeroBanner() {
  return (
    <div className="flex h-28 items-center justify-center bg-gradient-to-r from-collector-navy to-collector-blue lg:hidden">
      <h2 className="text-center text-xl font-bold text-white">
        Stop searching.{' '}
        <span className="relative inline-block">
          Start finding.
          <span className="absolute bottom-0 left-0 h-0.5 w-full bg-warning-amber" />
        </span>
      </h2>
    </div>
  )
}

export function HeroPanel({ className = '' }: HeroPanelProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  return (
    <div
      className={`relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-collector-navy to-collector-blue ${className}`}
    >
      {/* Halftone dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-8 py-12 lg:px-16 lg:py-16">
        {/* Headline */}
        <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl xl:text-5xl">
          Stop searching.
          <br />
          <span className="relative inline-block">
            Start finding.
            <span className="absolute bottom-0 left-0 h-1 w-full bg-warning-amber" />
          </span>
        </h2>

        {/* Subtitle - hidden on mobile */}
        <p className="mb-8 hidden text-lg text-slate-300 lg:block">
          Professional SMS alerts for serious comic collectors
        </p>

        {/* Benefits - hidden on mobile/tablet */}
        <ul className="mb-8 hidden space-y-3 lg:block">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start text-white/90">
              <svg
                className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-success-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm lg:text-base">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* How it works link - hidden on mobile */}
        <div className="mb-10 hidden lg:block">
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            className="inline-flex items-center text-sm font-medium text-warning-amber hover:text-amber-400"
          >
            How it works
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Testimonial - hidden on mobile/tablet */}
        <TestimonialBlock className="hidden lg:block" />
      </div>

      {/* How It Works Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </div>
  )
}
