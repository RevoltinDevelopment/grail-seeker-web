/**
 * Story 1.77 (U-01): the one rule for where sign-in may send a subscriber.
 *
 * A `redirectTo` or `next` value comes from the link, so anyone can write it.
 * Only a path inside this app is followed; anything else lands on the fallback.
 * The value is never decoded again by us (searchParams has already decoded it
 * once), or `/%2F%2Fhost` would become `//host`. The URL parser still resolves
 * dot segments (`.`, `..`, `%2e`) and turns `\` into `/`, so `/.//host` resolves
 * to `//host`: the resolved path is checked by the same rule as the raw value.
 */

// Story 1.82 (U-04): Searches is the app's home; the Dashboard is gone.
export const DEFAULT_AFTER_SIGN_IN = '/searches'

const PLACEHOLDER_ORIGIN = 'https://app.invalid'

// Control characters and whitespace. The URL parser silently strips tab and
// newline, so '/\t/host' would otherwise parse as '//host'.
const UNSAFE_CHARACTERS = /[\u0000-\u001F\u007F\s]/

export function safeRedirectPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_AFTER_SIGN_IN
): string {
  if (!isInAppPath(raw)) return fallback

  let resolved: URL
  try {
    resolved = new URL(raw, PLACEHOLDER_ORIGIN)
  } catch {
    return fallback
  }
  if (resolved.origin !== PLACEHOLDER_ORIGIN) return fallback

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`
  // What is followed must pass the same rule as what was given.
  return isInAppPath(path) ? path : fallback
}

function isInAppPath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false
  if (value[0] !== '/') return false
  // Browsers read a backslash as a slash, so '/\host' is '//host'.
  if (value[1] === '/' || value[1] === '\\') return false
  return !UNSAFE_CHARACTERS.test(value)
}
