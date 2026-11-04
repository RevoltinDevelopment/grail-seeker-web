import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Story 1.77: the last step before a server or edge error goes to Sentry.
 *
 * The request-error hook (`onRequestError`) hands Sentry every request header,
 * and Sentry's request data keeps cookies by default, parsed into
 * `event.request.cookies`. Those cookies carry the subscriber's Supabase
 * session, so they never leave our server. Sensitive headers are masked, and
 * sensitive query values are filtered wherever the address is recorded.
 */

const FILTERED = '[FILTERED]'
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key']
// `code` is the one-time sign-in code on /auth/callback
const SENSITIVE_PARAMS = ['token', 'key', 'password', 'secret', 'code']

export function scrubServerEvent(event: ErrorEvent): ErrorEvent {
  const request = event.request
  if (request) {
    delete request.cookies

    if (request.headers) {
      for (const name of Object.keys(request.headers)) {
        if (SENSITIVE_HEADERS.includes(name.toLowerCase())) {
          request.headers[name] = FILTERED
        }
      }
    }

    if (typeof request.url === 'string') request.url = scrubAddress(request.url)
    if (typeof request.query_string === 'string') {
      request.query_string = scrubQuery(request.query_string)
    }
  }

  const nextjs = event.contexts?.nextjs as { request_path?: unknown } | undefined
  if (nextjs && typeof nextjs.request_path === 'string') {
    nextjs.request_path = scrubAddress(nextjs.request_path)
  }

  return event
}

/** Filters sensitive query values in a full address or a path with a query. */
export function scrubAddress(address: string): string {
  const queryAt = address.indexOf('?')
  if (queryAt === -1) return address
  const hashAt = address.indexOf('#', queryAt)
  const end = hashAt === -1 ? address.length : hashAt
  return (
    address.slice(0, queryAt + 1) +
    scrubQuery(address.slice(queryAt + 1, end)) +
    address.slice(end)
  )
}

function scrubQuery(query: string): string {
  const params = new URLSearchParams(query)
  let changed = false
  for (const name of SENSITIVE_PARAMS) {
    if (params.has(name)) {
      params.set(name, FILTERED)
      changed = true
    }
  }
  return changed ? params.toString() : query
}
