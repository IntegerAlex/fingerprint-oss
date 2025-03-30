import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'Chromium',
      use: { browserName: 'chromium' },  // Browser setup for Chromium
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },   // Browser setup for Firefox
    },
    {
      name: 'Microsoft Edge',
      use: { browserName: 'chromium', channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { browserName: 'chromium', channel: 'chrome' },
    },
  ],
});

