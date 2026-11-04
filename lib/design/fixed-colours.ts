import { existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'

/**
 * Story 1.79 (U-02): finds colour classes that do not follow the theme. A page coloured with
 * them cannot go dark (U-17), so each redesign story moves its files onto the tokens and lowers
 * the committed list (fixed-colours-baseline.json). Used by fixed-colours.test.ts only.
 */

const UTILITIES =
  'bg|text|border|border-[trblxyse]|ring|ring-offset|divide|outline|from|via|to|fill|stroke|placeholder|shadow|decoration|accent|caret'
const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
// Fixed colours named in tailwind.config.ts before the tokens existed
const NAMED =
  'collector-blue|collector-navy|success-green|warning-amber|error-red|info-blue|ebay-red|heritage-bronze|mycomicshop-blue'

export const FIXED_COLOUR = new RegExp(
  `(?<![\\w-])(?:[\\w-]+:)*(?:${UTILITIES})-(?:(?:white|black)(?![\\w-])|(?:${PALETTE})-\\d{2,3}(?![\\w-])|(?:${NAMED})(?![\\w-])|\\[(?:color:)?(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab)\\(|white\\]|black\\]))`,
  'g'
)

export const SCANNED_DIRECTORIES = ['app', 'components', 'hooks', 'lib', 'contexts']

export function countFixedColours(source: string): number {
  return source.match(FIXED_COLOUR)?.length ?? 0
}

/** Every scanned file that uses a fixed colour, with its count; paths relative to the repo. */
export function scanFixedColours(root: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const walk = (dir: string) => {
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.posix.join(dir, entry.name)
      if (entry.isDirectory()) walk(rel)
      else if (/\.(ts|tsx|js|jsx|mdx)$/.test(entry.name) && !/\.test\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const n = countFixedColours(readFileSync(path.join(root, rel), 'utf8'))
        if (n > 0) counts[rel] = n
      }
    }
  }
  for (const dir of SCANNED_DIRECTORIES) if (existsSync(path.join(root, dir))) walk(dir)
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))
}
