import type { Config } from 'tailwindcss'

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
        'comiclink-purple': '#6366F1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
