import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      './src/test/setup.ts',
      './src/test/mocks/three-mock.ts'
    ],
    include: [
      'src/**/*.{test,spec}.{ts,tsx,js,jsx}',
      'tests/unit/**/*.{test,spec}.{ts,tsx,js,jsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx,js,jsx}'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        'src/types/',
        '**/*.d.ts',
        '**/*.config.{js,ts,mjs}',
        'dist/',
        '.planning/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        perFile: true,
        100: false
      },
      global: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    reporters: ['default', 'hanging-process'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@bim': path.resolve(__dirname, './src/bim')
    }
  }
})
