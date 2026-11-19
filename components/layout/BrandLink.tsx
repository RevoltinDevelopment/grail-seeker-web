import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * The chalice and the wordmark, as a link. Shared by the app header (Story 1.82) and the public
 * headers (Story 1.105) so they can't drift. `plain` makes it an ordinary link, a full page load,
 * for the error pages, where the client router may be the part that broke.
 */
export function BrandLink({
  href,
  className,
  plain = false,
}: {
  href: string
  className?: string
  plain?: boolean
}) {
  const classes = cn('flex min-h-11 items-center gap-2.5 text-ink no-underline', className)
  const content = (
    <>
      <Image src="/images/chalice.png" alt="" width={34} height={34} priority />
      <span className="whitespace-nowrap font-cinzel text-[17px] font-semibold tracking-[0.08em]">
        GRAIL SEEKER
      </span>
    </>
  )
  return plain ? (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load on purpose (see above)
    <a href={href} className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {content}
    </Link>
  )
}
