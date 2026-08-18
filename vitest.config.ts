import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Story 1.16: first test framework in this repo. jsdom environment (React
// component tests need a DOM); the @/* alias mirrors tsconfig.json's own
// paths mapping exactly so import paths don't diverge between the app and
// its tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
