// npx playwright install chromium

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Use jsdom for DOM testing
    globals: true, // Enable global test functions
    include: ['**/*.test.ts'], // Only include TypeScript test files
    exclude: ['**/*.test.js', 'node_modules/**'], // Exclude Playwright test files
    // Optional: Serve test files via Vite's dev server
    server: {
      deps: {
        inline: ['fingerprint-oss'], // Ensure library is bundled
      },
    },
  },
});
