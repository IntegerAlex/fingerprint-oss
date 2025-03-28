// npx playwright install chromium

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: ['jsdom','happy-dom'], // Enable browser environment [[6]][[8]]
    // Optional: Serve test files via Vite's dev server
    server: {
      deps: {
        inline: ['fingerprint-oss'], // Ensure library is bundled
      },
    },
  },
});
