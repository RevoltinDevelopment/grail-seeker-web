import { readFileSync } from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

/**
 * Story 1.79 (U-02): the colour tokens in app/globals.css match the approved design
 * (docs/ux/mockups/grail-seeker.css; UX plan 7b) in both themes, and every text pair passes
 * WCAG AA. A change to a token that breaks either fails here, before anyone sees it.
 */

// [light, dark], as the design states them
const DESIGN: Record<string, [string, string]> = {
  bg: ['#f8fafc', '#0b1120'],
  surface: ['#ffffff', '#111827'],
  ink: ['#0f172a', '#f1f5f9'],
  muted: ['#475569', '#cbd5e1'],
  line: ['#e2e8f0', '#1f2937'],
  'line-strong': ['#94a3b8', '#64748b'],
  primary: ['#1e40af', '#2563eb'],
  'on-primary': ['#ffffff', '#ffffff'],
  'primary-tint': ['#eff6ff', '#1e293b'],
  link: ['#1d4ed8', '#93c5fd'],
  chip: ['#f1f5f9', '#1f2937'],
  danger: ['#b91c1c', '#fca5a5'],
  'attn-bg': ['#fffbeb', '#2a1a04'],
  'attn-ink': ['#451a03', '#fef3c7'],
  'attn-line': ['#d97706', '#d97706'],
  'hold-bg': ['#fef3c7', '#422006'],
  'hold-ink': ['#78350f', '#fde68a'],
  'hold-line': ['#b45309', '#f59e0b'],
  'paused-bg': ['#eef2f6', '#0b1120'],
  over: ['#b45309', '#f59e0b'],
  ok: ['#047857', '#34d399'],
}

type Rgb = [number, number, number]

function readBlock(css: string, selector: string): Record<string, Rgb> {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`no ${selector} block in globals.css`)
  const body = css.slice(start, css.indexOf('}', start))
  const vars: Record<string, Rgb> = {}
  for (const m of body.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    vars[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])]
  }
  return vars
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const css = readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8')
const THEMES = { light: readBlock(css, ':root'), dark: readBlock(css, '.dark') } as const

// [text or mark, background, minimum ratio]
const PAIRS: Array<[string, string, number]> = [
  ['ink', 'bg', 4.5],
  ['ink', 'surface', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'paused-bg', 4.5],
  ['link', 'surface', 4.5],
  ['link', 'bg', 4.5],
  ['ink', 'chip', 4.5],
  ['muted', 'chip', 4.5],
  ['ink', 'primary-tint', 4.5],
  ['on-primary', 'primary', 4.5],
  ['danger', 'surface', 4.5],
  ['attn-ink', 'attn-bg', 4.5],
  ['hold-ink', 'hold-bg', 4.5],
  ['over', 'surface', 3],
  ['ok', 'surface', 3],
]

describe('design tokens (Story 1.79)', () => {
  it.each(['light', 'dark'] as const)('%s values match the design', (theme) => {
    const index = theme === 'light' ? 0 : 1
    for (const [name, values] of Object.entries(DESIGN)) {
      expect(THEMES[theme][name], `--${name} (${theme})`).toEqual(hexToRgb(values[index]))
    }
  })

  it('defines no token in one theme without the other', () => {
    expect(Object.keys(THEMES.dark).sort()).toEqual(Object.keys(THEMES.light).sort())
  })

  it.each(['light', 'dark'] as const)('every text pair passes AA in %s', (theme) => {
    const t = THEMES[theme]
    for (const [fg, bg, min] of PAIRS) {
      const ratio = contrast(t[fg], t[bg])
      expect(ratio, `${fg} on ${bg} (${theme}): ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min)
    }
  })
})
