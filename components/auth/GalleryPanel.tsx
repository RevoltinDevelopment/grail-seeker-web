import Image from 'next/image'

/**
 * Story 1.106 (U-18, AC 1): the Grail Seeker Gallery beside sign-in (front-door-sign-in.html,
 * `.book-panel`), from desktop width only; a phone leaves it out, as drawn.
 *
 * A key graded book, a different one on each visit, once Mahan has photos of his own books (UX
 * plan section 13, part 2). Until then it is drawn as a placeholder: the title and an empty frame,
 * with no caption and no claim. Give it `book` and the photo, its title and its grade appear with
 * no change to the layout.
 */
export interface GalleryBook {
  src: string
  alt: string
  title: string
  line: string
}

export function GalleryPanel({ book }: { book?: GalleryBook | null }) {
  return (
    <figure
      className="m-0 hidden flex-[0_0_38%] flex-col justify-center gap-3.5 border-r border-line bg-primary-tint p-14 lg:flex"
      aria-hidden={book ? undefined : true}
      aria-label={book ? `Grail Seeker Gallery: ${book.title}` : undefined}
    >
      <p className="self-start border-b-2 border-ink pb-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-ink">
        Grail Seeker Gallery
      </p>
      <div className="relative aspect-[3/4.6] max-h-[560px] overflow-hidden rounded-xl border border-line bg-surface">
        {book && (
          <Image src={book.src} alt={book.alt} fill sizes="38vw" className="object-contain" />
        )}
      </div>
      {book && (
        <figcaption className="flex flex-col gap-0.5 text-[15px] text-muted-foreground">
          <b className="text-card-title text-ink">{book.title}</b>
          <span>{book.line}</span>
        </figcaption>
      )}
    </figure>
  )
}
