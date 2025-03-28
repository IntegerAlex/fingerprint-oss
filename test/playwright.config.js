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
      name: 'Safari',
      use: { browserName: 'webkit' },    // Browser setup for WebKit (Safari)
    },
    {
      name:'MsEdge',
      use:{browserName:'msedge'},
    },
    {
      name:'Chrome',
      use:{browserName:'chrome'},
     },	

	  
  ],
});

