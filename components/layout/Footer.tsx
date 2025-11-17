import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-custom py-12">
        {/* Footer Columns */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">⚱️</span>
              <h2 className="text-xl font-bold text-collector-navy">Grail Seeker</h2>
            </div>
            <p className="text-sm text-slate-600">Stop Searching. Start Finding.</p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-collector-navy">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  About Grail Seeker
                </Link>
              </li>
              <li>
                <a
                  href="https://grailseeker.io/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://grailseeker.io/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-collector-navy">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@grailseeker.io"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@grailseeker.io"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:partnerships@grailseeker.io"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  Partnerships
                </a>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-collector-navy">
              Community
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://www.cgccomics.com/boards/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  CGC Boards
                </a>
              </li>
              <li>
                <a
                  href="https://www.cbcscomics.com/forum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 transition-colors hover:text-collector-blue"
                >
                  CBCS Forum
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-600">
              © 2025 Grail Seeker IO, LLC. All rights reserved.
            </p>
            <p className="text-sm font-medium text-collector-blue">Beta launching Q2 2026</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
