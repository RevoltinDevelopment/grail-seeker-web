
import Link from 'next/link'

/**
 * Story 1.105 (U-16): on the design tokens, contents and words unchanged (Mahan, 2026-11-19).
 * No design draws an app footer yet; whether the app keeps one is for a later design pass.
 */
export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-custom py-12">
        {/* Footer Columns */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">⚱️</span>
              <h2 className="text-xl font-bold text-ink">Grail Seeker</h2>
            </div>
            <p className="text-sm text-muted-foreground">Stop Searching. Start Finding.</p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://grailseeker.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  About Grail Seeker
                </a>
              </li>
              <li>
                <a
                  href="https://grailseeker.io/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://grailseeker.io/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@grailseeker.io"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@grailseeker.io"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:partnerships@grailseeker.io"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  Partnerships
                </a>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">
              Community
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.cgccomics.com/boards/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  CGC Boards
                </a>
              </li>
              <li>
                <a
                  href="https://www.cbcscomics.com/forum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-link"
                >
                  CBCS Forum
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-line pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2025 Grail Seeker IO, LLC. All rights reserved.
            </p>
            <p className="text-sm font-medium text-primary">Beta launching Q2 2026</p>
          </div>
          {/* GCD Attribution (required by CC BY-SA 4.0 license) */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Comic series data provided in part by the{' '}
            <a
              href="https://www.comics.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-link"
            >
              Grand Comics Database™
            </a>
            , licensed under{' '}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-link"
            >
              CC BY-SA 4.0
            </a>
            .
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link
              href="/heritage-terms"
              className="underline hover:text-link"
            >
              Heritage Terms and Conditions of Auction
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
