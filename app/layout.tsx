import { Inter } from 'next/font/google'

import './globals.css'
import { ToastProvider } from '@/contexts/ToastContext'
import { ReactQueryProvider } from './providers/ReactQueryProvider'

import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grail Seeker - Find Your Holy Grail Comics',
  description:
    'Multi-platform comic book monitoring with SMS alerts. Monitor eBay, Heritage Auctions, ComicLink and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
