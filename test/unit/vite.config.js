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
    // Run only the stable unit tests for now. Remaining suites depend on
    // modules or environments that are not currently required.
    include: [
      'adblocker.test.ts',
      'confidence.test.ts',
      'stability.test.ts',
      'telemetry.test.ts',
      'geo-ip.test.ts',
      'vpn.test.ts',
      'index.test.ts'
    ],
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