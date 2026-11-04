import { redirect } from 'next/navigation'

// Story 1.82 (U-04): the Dashboard is gone and Searches is the app's home. The middleware redirects
// first; this answers anything that reaches the route another way.
export default function DashboardPage() {
  redirect('/searches')
}
