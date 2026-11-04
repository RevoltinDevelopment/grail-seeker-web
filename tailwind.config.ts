import type { Config } from 'tailwindcss'

// Story 1.79 (U-02): every design token is a CSS variable in app/globals.css holding RGB
// channels ("248 250 252"). Wrapping it as rgb(var(--x) / <alpha-value>) lets Tailwind add
// opacity from a `/NN` modifier (`bg-primary/80`, used by the shadcn components).
function token(cssVariable: string): string {
  return `rgb(var(${cssVariable}) / <alpha-value>)`
}

const config: Config = {
  // Story 1.79: class-based, so the Settings choice can set it (U-17). Was Tailwind v3's
  // default, 'media', which applied the shadcn components' dark: styles on dark devices.
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Story 1.79: the design lays out at 700 and 1000 pixels (UX plan 15). Tailwind's own
    // breakpoints stay, since pages use them; the whole list is declared here, in width order,
    // because Tailwind emits breakpoints in the order given, and extending would put 700 and
    // 1000 after 1024.
    screens: {
      sm: '640px',
      tablet: '700px',
      md: '768px',
      desktop: '1000px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
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

        // Story 1.79: the design tokens (UX plan 7b; docs/ux/mockups/grail-seeker.css).
        // Secondary text is `text-muted-foreground`: shadcn's `muted` is a quiet background.
        background: token('--bg'),
        surface: token('--surface'),
        ink: token('--ink'),
        line: {
          DEFAULT: token('--line'),
          strong: token('--line-strong'),
        },
        primary: {
          DEFAULT: token('--primary'),
          foreground: token('--on-primary'),
          tint: token('--primary-tint'),
        },
        link: token('--link'),
        chip: token('--chip'),
        danger: token('--danger'),
        attention: {
          DEFAULT: token('--attn-bg'),
          ink: token('--attn-ink'),
          line: token('--attn-line'),
        },
        hold: {
          DEFAULT: token('--hold-bg'),
          ink: token('--hold-ink'),
          line: token('--hold-line'),
        },
        paused: token('--paused-bg'),
        over: token('--over'),
        ok: token('--ok'),

        // shadcn's names, aliased onto the same variables, so components/ui/ takes the design.
        foreground: token('--ink'),
        border: token('--line'),
        input: token('--line-strong'),
        ring: token('--link'),
        muted: {
          DEFAULT: token('--chip'),
          foreground: token('--muted'),
        },
        secondary: {
          DEFAULT: token('--chip'),
          foreground: token('--ink'),
        },
        accent: {
          DEFAULT: token('--primary-tint'),
          foreground: token('--ink'),
        },
        destructive: token('--danger'),
        card: {
          DEFAULT: token('--surface'),
          foreground: token('--ink'),
        },
        popover: {
          DEFAULT: token('--surface'),
          foreground: token('--ink'),
        },
      },
      borderRadius: {
        // Unchanged: lg 10px, md 8px (131 uses, already the design's button corner), sm 6px.
        // Story 1.79 adds the design's named corners.
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: '12px',
        button: '8px',
      },
      // Story 1.79: the design's sizes
      minHeight: {
        touch: '44px',
      },
      height: {
        touch: '44px',
      },
      fontSize: {
        'page-title': ['32px', { lineHeight: '1.25' }],
        'page-title-sm': ['28px', { lineHeight: '1.25' }],
        'card-title': ['17px', { lineHeight: '1.4' }],
        body: ['16px', { lineHeight: '1.5' }],
        label: ['12px', { lineHeight: '1.4', letterSpacing: '0.04em' }],
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
