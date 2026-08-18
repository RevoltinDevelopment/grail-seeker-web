import { Inter, Cinzel } from 'next/font/google'

import './globals.css'
import { ToastProvider } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import { ReactQueryProvider } from './providers/ReactQueryProvider'

import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-cinzel',
})

export const metadata: Metadata = {
  title: 'Grail Seeker - Find Your Holy Grail Comics',
  description:
    'Multi-platform comic book monitoring with SMS alerts. Monitor eBay, Heritage Auctions, ComicLink and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans')}>
      <body className={`${inter.className} ${cinzel.variable}`}>
        <ReactQueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
