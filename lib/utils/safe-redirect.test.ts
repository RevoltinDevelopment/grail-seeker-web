import { describe, expect, it } from 'vitest'

import { DEFAULT_AFTER_SIGN_IN, safeRedirectPath } from './safe-redirect'

// Story 1.77 (U-01): sign-in follows only addresses inside the app.
describe('safeRedirectPath', () => {
  it('falls back to the default when nothing is given', () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_AFTER_SIGN_IN)
    expect(safeRedirectPath('')).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('keeps an in-app deep link whole, query and fragment included', () => {
    expect(safeRedirectPath('/alerts?search=abc')).toBe('/alerts?search=abc')
    expect(safeRedirectPath('/searches/123/edit')).toBe('/searches/123/edit')
    expect(safeRedirectPath('/reports#week')).toBe('/reports#week')
    expect(safeRedirectPath('/')).toBe('/')
  })

  it('uses the fallback it is given', () => {
    expect(safeRedirectPath('https://evil.example', '/searches')).toBe('/searches')
  })

  it.each([
    ['an absolute address', 'https://evil.example'],
    ['an absolute http address', 'http://evil.example/path'],
    ['a protocol-relative address', '//evil.example'],
    ['a protocol-relative address with a path', '//evil.example/dashboard'],
    ['a backslash address', '/\\evil.example'],
    ['a double backslash address', '\\\\evil.example'],
    ['a tab-smuggled address', '/\t/evil.example'],
    ['a newline-smuggled address', '/\n/evil.example'],
    ['a leading-space address', ' /dashboard'],
    ['a javascript: address', 'javascript:alert(1)'],
    ['a data: address', 'data:text/html,hi'],
    ['an encoded address that does not start with a slash', '%2F%2Fevil.example'],
    ['a bare host', 'evil.example'],
    ['a relative path', 'dashboard'],
    // Found in code review: dot segments resolve to '//host' after the raw check
    ['a dot segment before a double slash', '/.//evil.example'],
    ['a parent segment before a double slash', '/..//evil.example'],
    ['a named parent segment before a double slash', '/a/..//evil.example'],
    ['an encoded dot segment', '/%2e//evil.example'],
    ['an encoded parent segment', '/%2E%2E//evil.example'],
    ['a dot segment before a backslash', '/./\\evil.example'],
    ['a dot segment and a backslash before a slash', '/.\\/evil.example'],
  ])('refuses %s', (_label, raw) => {
    expect(safeRedirectPath(raw)).toBe(DEFAULT_AFTER_SIGN_IN)
  })

  it('treats an encoded double slash after a real slash as a path, never decoding it again', () => {
    const result = safeRedirectPath('/%2F%2Fevil.example')
    expect(result.startsWith('//')).toBe(false)
    expect(result).toBe('/%2F%2Fevil.example')
  })

  it('never returns a protocol-relative address, whatever the input', () => {
    const tricks = ['.', '..', '%2e', '%2E%2E', 'a/..', './.', '.%2e']
    const tails = ['//evil.example', '/\\evil.example', '\\/evil.example', '\\\\evil.example']
    for (const trick of tricks) {
      for (const tail of tails) {
        const result = safeRedirectPath(`/${trick}${tail}`)
        expect(result.startsWith('//')).toBe(false)
        expect(result.startsWith('/\\')).toBe(false)
      }
    }
  })
})
