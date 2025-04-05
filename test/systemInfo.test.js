import { test, expect } from '@playwright/test';

// Utility function to log browser console messages
const logBrowserConsoleMessages = (page) => {
  page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`));
};

// Function to wait for the fingerprint data to be populated
const waitForFingerprintData = async (page) => {
  await page.waitForFunction(() => window.test !== undefined, { timeout: 60000 });
};

// Function to retrieve the test data from the browser context
const getTestData = async (page) => {
  return await page.evaluate(() => window.test);
};

// Function to perform assertions on the test data
const assertFingerprintData = (testData) => {
  expect(testData).toBeDefined();
  expect(typeof testData).toBe('object');

  // Example checks for system information
  expect(testData.systemInfo.adBlocker.adBlocker).toBe(false);
  expect(testData.systemInfo.adBlocker.isBrave).toBe(false);
  expect(['Chrome', 'Firefox', 'Brave', 'Safari','Edge']).toContain(testData.systemInfo.incognito.browserName);
  expect(Array.isArray(testData.systemInfo.screenResolution)).toBe(true);
  expect(testData.systemInfo.screenResolution.length).toBe(2);
  expect(typeof testData.systemInfo.screenResolution[0]).toBe('number');
  expect(typeof testData.systemInfo.screenResolution[1]).toBe('number');
  expect(typeof testData.systemInfo.timezone).toBe('string');
  expect(testData.systemInfo.localStorage).toBe(true);
  expect(testData.systemInfo.sessionStorage).toBe(true);
  expect(testData.systemInfo.indexedDB).toBe(true);
  expect(testData.systemInfo.bot.confidence).toBeGreaterThan(0.1);
};

test('fingerprint-oss systemInfo Test', async ({ page }) => {
  await page.goto('http://localhost:8080/');

  logBrowserConsoleMessages(page);
  await waitForFingerprintData(page);

  const testData = await getTestData(page);

  try {
    assertFingerprintData(testData);
  } catch (error) {
    console.error('Test failed. Full testData:', JSON.stringify(testData, null, 2));
    throw error;
  }
});

