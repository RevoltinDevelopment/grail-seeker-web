import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
      sensitiveHeaders.forEach((header) => {
        if (event.request?.headers?.[header]) {
          event.request.headers[header] = '[FILTERED]'
        }
      })
    }

    // Remove sensitive query parameters
    if (event.request?.url) {
      const url = new URL(event.request.url)
      const sensitiveParams = ['token', 'key', 'password', 'secret']
      sensitiveParams.forEach((param) => {
        if (url.searchParams.has(param)) {
          url.searchParams.set(param, '[FILTERED]')
        }
      })
      event.request.url = url.toString()
    }

    return event
  },
})
