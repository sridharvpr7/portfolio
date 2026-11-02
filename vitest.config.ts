/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['api/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: false,
    // Don't require a real DB or credentials for unit tests
    setupFiles: [],
    coverage: {
      provider: 'v8',
      include: ['api/lib/**', 'api/db/**'],
      exclude: ['api/__tests__/**'],
    },
  },
});
