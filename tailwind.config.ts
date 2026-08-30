import type { Config } from 'tailwindcss'

// Story 1.16: see the color-token comment below for why this wrapper is
// needed -- Tailwind's <alpha-value> placeholder gets substituted with the
// opacity from a `/NN` modifier (e.g. `ring-ring/50`), letting a single
// CSS-variable-backed token support opacity utilities.
function withAlpha(cssVariable: string): string {
  return `oklch(var(${cssVariable}) / <alpha-value>)`
}

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors (Sally's v1.1)
        'collector-blue': '#1E40AF',
        'collector-navy': '#1E293B',
        'success-green': '#059669',

        // Semantic Colors
        'warning-amber': '#D97706',
        'error-red': '#DC2626',
        'info-blue': '#2563EB',

        // Platform Brand Colors
        'ebay-red': '#E53238',
        'heritage-bronze': '#8B4513',
        'mycomicshop-blue': '#0052C1',

        // Story 1.16: shadcn/ui's color tokens, mapped to the CSS custom
        // properties its own init generated in app/globals.css. Required
        // on Tailwind v3 (unlike v4, a v3 project has to declare these
        // utility-class mappings explicitly) -- shadcn's init generated
        // the CSS variables and components that reference classes like
        // `border-border`/`bg-background`, but never wired this file to
        // connect them. Caught by `next build`'s real Tailwind compile,
        // not tsc/eslint/vitest (none of them parse Tailwind classes
        // against the actual utility set).
        //
        // Each CSS variable holds bare oklch channel numbers (e.g.
        // "0.708 0 0"), not a full `oklch(...)` value -- wrapping it here
        // as `oklch(var(--x) / <alpha-value>)` is what lets Tailwind
        // synthesize opacity-modified utilities like `ring-ring/50`
        // (used throughout the generated components in components/ui/).
        // A bare `var(--x)` reference (the first attempt) builds fine for
        // plain utilities but Tailwind can't inject an alpha channel into
        // an opaque variable reference with no visible structure, so every
        // `/NN` opacity modifier failed with "class does not exist" --
        // only caught by next build, not tsc/eslint/vitest.
        border: withAlpha('--border'),
        input: withAlpha('--input'),
        ring: withAlpha('--ring'),
        background: withAlpha('--background'),
        foreground: withAlpha('--foreground'),
        primary: {
          DEFAULT: withAlpha('--primary'),
          foreground: withAlpha('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withAlpha('--secondary'),
          foreground: withAlpha('--secondary-foreground'),
        },
        destructive: withAlpha('--destructive'),
        muted: {
          DEFAULT: withAlpha('--muted'),
          foreground: withAlpha('--muted-foreground'),
        },
        accent: {
          DEFAULT: withAlpha('--accent'),
          foreground: withAlpha('--accent-foreground'),
        },
        popover: {
          DEFAULT: withAlpha('--popover'),
          foreground: withAlpha('--popover-foreground'),
        },
        card: {
          DEFAULT: withAlpha('--card'),
          foreground: withAlpha('--card-foreground'),
        },
        sidebar: {
          DEFAULT: withAlpha('--sidebar'),
          foreground: withAlpha('--sidebar-foreground'),
          primary: withAlpha('--sidebar-primary'),
          'primary-foreground': withAlpha('--sidebar-primary-foreground'),
          accent: withAlpha('--sidebar-accent'),
          'accent-foreground': withAlpha('--sidebar-accent-foreground'),
          border: withAlpha('--sidebar-border'),
          ring: withAlpha('--sidebar-ring'),
        },
        chart: {
          '1': withAlpha('--chart-1'),
          '2': withAlpha('--chart-2'),
          '3': withAlpha('--chart-3'),
          '4': withAlpha('--chart-4'),
          '5': withAlpha('--chart-5'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
      },
      spacing: {
        // 4px base spacing system
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config
