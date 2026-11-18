'use client'

/**
 * Story 1.100 (U-14): Books found, as drawn in reports-books-found.html (approved by Mahan
 * 2026-10-28). Every copy found since the account was made (Decision #110), grouped by book, each
 * opening its listing in a new tab (Story 1.103). Every copy on one page, no paging, as drawn (the
 * largest account has about 1,200). Words: lib/reportRows.ts.
 */
import { BackToReports, EmptyState, FootNote, PageTitle } from '@/components/reports/ReportParts'
import { usePlatforms } from '@/hooks/usePlatforms'
import { useBooksFound } from '@/hooks/useReports'
import { bookName, booksFoundSubtitle, copiesCount, copyGradeAndPrice, copyNow, copyWhereLine } from '@/lib/reportRows'

export default function BooksFoundClient() {
  const { report, isLoading, refetch } = useBooksFound()
  const { displayNameFor } = usePlatforms()
  const now = new Date()

  let body: React.ReactNode
  if (isLoading) {
    body = (
      <>
        <PageTitle title="Books found" />
        <p role="status" aria-busy="true" className="text-sm text-muted-foreground">
          Loading your books found…
        </p>
      </>
    )
  } else if (!report) {
    body = (
      <>
        <PageTitle title="Books found" />
        <EmptyState heading="We couldn’t load your books found" body="Your searches are still running. Try again in a moment." onRetry={() => refetch()} />
      </>
    )
  } else if (report.books.length === 0) {
    body = (
      <>
        <PageTitle title="Books found" />
        <EmptyState heading="No books found yet" body="Every copy we find for you will be listed here." back />
      </>
    )
  } else {
    body = (
      <>
        <PageTitle title="Books found" sub={booksFoundSubtitle(report.copiesFound, report.books.length, report.joinedAt)} />
        <div className="flex flex-col gap-3">
          {report.books.map((b, i) => {
            const title = bookName(b)
            const headingId = `bf-book-${i}`
            // A group, not a landmark: an account can have hundreds of books (review)
            return (
              <div
                key={`${i}|${b.seriesTitle}|${b.issueVolumeText ?? ''}|${b.issueNumber}`}
                role="group"
                aria-labelledby={headingId}
                className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3.5">
                  <h2 id={headingId} className="text-base font-bold leading-[1.3] text-ink">
                    {title}
                  </h2>
                  <span className="flex-none text-sm font-semibold text-muted-foreground">{copiesCount(b.copies.length)}</span>
                </div>
                <ul className="m-0 list-none p-0">
                  {b.copies.map((c) => {
                    const { grade, price } = copyGradeAndPrice(c)
                    const where = copyWhereLine(c, displayNameFor, now)
                    const at = copyNow(c, displayNameFor, now)
                    const row = 'grid min-h-touch grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-5 py-2.5 text-ink no-underline'
                    const body = (
                      <>
                        <span className="text-[15px] font-semibold">
                          {grade}
                          {grade && price && ' · '}
                          {price && <b className="tabular-nums">{price}</b>}
                        </span>
                        <span className="col-start-1 text-[13px] text-muted-foreground">{where}</span>
                        <span
                          className={`col-start-2 row-span-2 row-start-1 text-right text-sm font-semibold ${
                            at.href ? 'text-link underline underline-offset-[3px]' : 'text-muted-foreground'
                          }`}
                        >
                          {at.text}
                        </span>
                      </>
                    )
                    // Straight to the listing, in a new tab (Story 1.103, Mahan); unlinked when there is nothing to open
                    return (
                      <li key={c.alertId} className="border-t border-line first:border-t-0">
                        {at.href ? (
                          <a href={at.href} target="_blank" rel="noopener noreferrer" className={`${row} hover:bg-chip`}>
                            {body}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        ) : (
                          <div className={row}>{body}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
        <FootNote>
          Every copy we found since you joined, including ones that sold, ended or that you dismissed. A copy whose price changed counts once.
        </FootNote>
      </>
    )
  }

  return (
    <div className="mx-auto flex max-w-[824px] flex-col gap-5 px-4 pb-12 pt-5 tablet:px-8">
      <BackToReports />
      {body}
    </div>
  )
}
