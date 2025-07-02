import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 90000, // 90 seconds
  retries: 2, // Retry failed tests up to 2 times
  use: {
    headless: true, // Run in headless mode for CI
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Chromium',
      use: { 
        browserName: 'chromium',
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage'] // Better for CI environments
        }
      },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'WebKit',
      use: { browserName: 'webkit' },
    },
  ],
});

