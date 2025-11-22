import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Temporarily disabled for Edge Runtime compatibility
// Will re-enable after resolving Supabase + Sentry Edge conflict
Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Disabled temporarily for Edge Runtime compatibility
  enabled: false, // Changed from: process.env.NODE_ENV === 'production'
})
