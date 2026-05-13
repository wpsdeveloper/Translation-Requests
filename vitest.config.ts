import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  // We need these to handle the Vite-specific imports in tests
  resolve: {
    conditions: ['development', 'browser'],
  },
});
