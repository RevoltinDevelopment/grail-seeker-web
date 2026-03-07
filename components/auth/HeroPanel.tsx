import Link from 'next/link'

import { TestimonialBlock } from './TestimonialBlock'

interface HeroPanelProps {
  className?: string
}

const benefits = [
  'Monitor eBay & auction houses automatically',
  'Set exact criteria: series, issue, grade, price',
  'SMS alerts within 30 minutes',
  'Find the rare and scarce books that others miss',
]

export function HeroPanel({ className = '' }: HeroPanelProps) {
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
          <Link
            href="/#how-it-works"
            className="inline-flex items-center text-sm font-medium text-warning-amber hover:text-amber-400"
          >
            How it works
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Testimonial - hidden on mobile/tablet */}
        <TestimonialBlock className="hidden lg:block" />
      </div>
    </div>
  )
}
