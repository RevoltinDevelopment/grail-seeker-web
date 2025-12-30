import { Metadata } from 'next'
import ArchiveClient from './ArchiveClient'

export const metadata: Metadata = {
  title: 'Alerts Archive | Grail Seeker',
  description: 'View your historical alert discoveries',
}

export default function ArchivePage() {
  return <ArchiveClient />
}
