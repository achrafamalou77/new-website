import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/types/**',
        '**/*.d.ts',
        'src/app/layout.tsx',
        'src/app/globals.css',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 40,
      },
    },
  },
})
