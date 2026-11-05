import { describe, expect, it } from 'vitest'

import config from '../../tailwind.config'

/**
 * Story 1.79: each Tailwind colour name points at the right design variable. The token test
 * checks the variables' values; this checks the names that pages and shadcn components use.
 */

type Tree = { [key: string]: string | Tree }
const colours = (config.theme?.extend?.colors ?? {}) as Tree

function variableOf(name: string): string | undefined {
  const [head, tail] = name.split(/-(.+)/)
  let node: string | Tree | undefined = colours[name] ?? colours[head]
  if (typeof node === 'object') node = tail ? node[tail] : node.DEFAULT
  if (node === undefined && typeof colours[head] === 'object' && !tail) node = (colours[head] as Tree).DEFAULT
  return typeof node === 'string' ? node.match(/var\((--[a-z-]+)\)/)?.[1] : undefined
}

const EXPECTED: Record<string, string> = {
  background: '--bg',
  surface: '--surface',
  ink: '--ink',
  'muted-foreground': '--muted',
  muted: '--chip',
  line: '--line',
  'line-strong': '--line-strong',
  primary: '--primary',
  'primary-foreground': '--on-primary',
  'primary-tint': '--primary-tint',
  link: '--link',
  chip: '--chip',
  danger: '--danger',
  attention: '--attn-bg',
  'attention-ink': '--attn-ink',
  hold: '--hold-bg',
  'hold-ink': '--hold-ink',
  paused: '--paused-bg',
  over: '--over',
  ok: '--ok',
  rule: '--rule',
  'seg-other': '--seg-other',
  'info-icon': '--info-icon',
  foreground: '--ink',
  border: '--line',
  input: '--line-strong',
  ring: '--link',
  destructive: '--danger',
  card: '--surface',
  popover: '--surface',
  secondary: '--chip',
  accent: '--primary-tint',
}

describe('Tailwind colour names (Story 1.79)', () => {
  it.each(Object.entries(EXPECTED))('%s reads %s', (name, variable) => {
    expect(variableOf(name)).toBe(variable)
  })

  it('uses class-based dark mode', () => {
    expect(config.darkMode).toBe('class')
  })
})
