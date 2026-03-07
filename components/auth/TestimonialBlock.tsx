interface TestimonialBlockProps {
  className?: string
}

export function TestimonialBlock({ className = '' }: TestimonialBlockProps) {
  return (
    <div
      className={`rounded-lg border-l-4 border-warning-amber bg-white/10 p-4 backdrop-blur-sm ${className}`}
    >
      <blockquote className="text-sm text-white italic">
        &ldquo;Whether you&apos;re seeking golden age books, pedigree collections, investment-grade
        comics, or just to recapture your childhood, this service is a game changer.&rdquo;
      </blockquote>
      <p className="mt-2 text-xs text-slate-300">&mdash; Off Panel, CGC Community</p>
    </div>
  )
}
