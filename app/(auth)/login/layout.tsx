import type { Metadata } from 'next'

// Story 1.77: the app is kept out of search results (root layout), but the sign-in
// page may be listed. The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
