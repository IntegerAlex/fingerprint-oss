import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@/src': path.resolve(__dirname, '../../src'),
      '@/test': path.resolve(__dirname, '../'),
      '@': path.resolve(__dirname, '../../'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.ts'],
    setupFiles: ['./test-setup.ts'],
    isolate: true,
    sequence: {
      concurrent: false // Prevent race conditions in enterprise environments
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        '**/*.test.ts',
        '**/*.config.js'
      ]
    }
  },
}); 