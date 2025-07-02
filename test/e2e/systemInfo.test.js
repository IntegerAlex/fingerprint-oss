import { test, expect } from '@playwright/test';

// Utility function to log browser console messages
const logBrowserConsoleMessages = (page) => {
  page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`));
};

// Function to wait for the fingerprint data to be populated
const waitForFingerprintData = async (page) => {
  await page.waitForFunction(() => window.testStatus === 'success', { timeout: 60000 });
};

// Function to retrieve the test data from the browser context
const getTestData = async (page) => {
  return await page.evaluate(() => window.test);
};

// Function to perform assertions on the test data
const assertFingerprintData = (testData) => {
  expect(testData).toBeDefined();
  expect(typeof testData).toBe('object');
  expect(testData.systemInfo).toBeDefined();

  // Check adBlocker information exists
  if (testData.systemInfo.adBlocker) {
    expect(typeof testData.systemInfo.adBlocker.adBlocker).toBe('boolean');
    expect(typeof testData.systemInfo.adBlocker.isBrave).toBe('boolean');
  }

  // Check browser name (more flexible list including CI browsers)
  if (testData.systemInfo.incognito && testData.systemInfo.incognito.browserName) {
    expect(['Chrome', 'Firefox', 'Brave', 'Safari', 'Edge', 'Chromium', 'HeadlessChrome']).toContain(testData.systemInfo.incognito.browserName);
  }

  // Check screen resolution
  if (testData.systemInfo.screenResolution) {
    expect(Array.isArray(testData.systemInfo.screenResolution)).toBe(true);
    expect(testData.systemInfo.screenResolution.length).toBe(2);
    expect(typeof testData.systemInfo.screenResolution[0]).toBe('number');
    expect(typeof testData.systemInfo.screenResolution[1]).toBe('number');
  }

  // Check timezone
  if (testData.systemInfo.timezone) {
    expect(typeof testData.systemInfo.timezone).toBe('string');
  }

  // Check storage capabilities (might not be available in all environments)
  if (testData.systemInfo.localStorage !== undefined) {
    expect(typeof testData.systemInfo.localStorage).toBe('boolean');
  }
  if (testData.systemInfo.sessionStorage !== undefined) {
    expect(typeof testData.systemInfo.sessionStorage).toBe('boolean');
  }
  if (testData.systemInfo.indexedDB !== undefined) {
    expect(typeof testData.systemInfo.indexedDB).toBe('boolean');
  }

  // Check bot confidence (should be a number)
  if (testData.systemInfo.bot && testData.systemInfo.bot.confidence !== undefined) {
    expect(typeof testData.systemInfo.bot.confidence).toBe('number');
    expect(testData.systemInfo.bot.confidence).toBeGreaterThanOrEqual(0);
  }
};

test('fingerprint-oss systemInfo Test', async ({ page }) => {
  // Navigate to the test page
  await page.goto('http://localhost:8080/');

  // Setup logging
  logBrowserConsoleMessages(page);
  
  // Wait for fingerprint data to be ready
  await waitForFingerprintData(page);

  // Get the test data
  const testData = await getTestData(page);

  try {
    assertFingerprintData(testData);
  } catch (error) {
    console.error('Test failed. Full testData:', JSON.stringify(testData, null, 2));
    throw error;
  }
});

