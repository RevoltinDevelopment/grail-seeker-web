import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

import { countFixedColours, scanFixedColours } from './fixed-colours'

/**
 * Story 1.79 (U-02): a ratchet on colour classes that do not follow the theme.
 *
 * fixed-colours-baseline.json lists every file that still uses them, with its count. This fails
 * when a file not on the list uses one (new code starts on the tokens), when a count rises, or
 * when a count falls and the list was not lowered. To lower the list after moving a page:
 *
 *   UPDATE_FIXED_COLOURS=1 npx vitest run lib/design/fixed-colours.test.ts
 *
 * U-17, which switches dark mode on, requires the list to be empty.
 */

const ROOT = path.resolve(__dirname, '../..')
const BASELINE_FILE = path.join(__dirname, 'fixed-colours-baseline.json')

describe('fixed colour classes (Story 1.79)', () => {
  it('match the committed list exactly', () => {
    const actual = scanFixedColours(ROOT)
    let baseline: Record<string, number> = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
    if (process.env.UPDATE_FIXED_COLOURS === '1') {
      // Lowers the list only: a new file or a higher count is never written, so it still fails.
      const lowered: Record<string, number> = {}
      for (const [file, allowed] of Object.entries(baseline)) {
        const count = actual[file] ?? 0
        if (count > 0) lowered[file] = Math.min(count, allowed)
      }
      writeFileSync(BASELINE_FILE, JSON.stringify(lowered, null, 2) + '\n')
      baseline = lowered
    }

    const problems: string[] = []
    for (const [file, count] of Object.entries(actual)) {
      const allowed = baseline[file]
      if (allowed === undefined) problems.push(`${file}: ${count} fixed colour(s); new code uses the tokens`)
      else if (count > allowed) problems.push(`${file}: ${count}, above the list's ${allowed}; use the tokens`)
      else if (count < allowed) problems.push(`${file}: ${count}, below the list's ${allowed}; lower the list`)
    }
    for (const [file, allowed] of Object.entries(baseline)) {
      if (actual[file] === undefined) problems.push(`${file}: none left (list says ${allowed}); lower the list`)
    }
    expect(problems).toEqual([])
  })
})

describe('the fixed colour matcher', () => {
  it.each([
    ['bg-white', 1],
    ['text-slate-900', 1],
    ['hover:bg-blue-600', 1],
    ['md:border-t-gray-200', 1],
    ['bg-[#ffffff]', 1],
    ['text-collector-blue', 1],
    ['ring-offset-white', 1],
    ['bg-red-50 text-error-red border-error-red', 3],
    ['border-s-slate-200', 1],
    ['bg-[rgb(0,0,0)]', 1],
    ['text-[color:#fff]', 1],
    ['bg-[white]', 1],
  ])('counts %s', (source, n) => {
    expect(countFixedColours(source)).toBe(n)
  })

  it.each([
    'bg-surface text-ink border-line',
    'text-muted-foreground bg-primary/80',
    'bg-hold text-hold-ink',
    'text-sm text-center font-bold',
    'bg-whitesmoke-ish',
    'text-slate',
  ])('does not count %s', (source) => {
    expect(countFixedColours(source)).toBe(0)
  })
})
