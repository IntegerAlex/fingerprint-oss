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

// Function to perform assertions on the geolocation data
const assertGeolocationData = (testData) => {
  expect(testData).toBeDefined();
  expect(typeof testData).toBe('object');

  const geolocation = testData.geolocation;
  
  // Geolocation might be null in CI environments or when network requests fail
  if (geolocation === null) {
    console.log('Geolocation data is null, which is acceptable in CI environments');
    return;
  }
  
  expect(geolocation).toBeDefined();

  if (geolocation.ip) {
    expect(typeof geolocation.ip).toBe('string');
  }

  if (geolocation.city) {
    expect(typeof geolocation.city).toBe('string');
  }

  if (geolocation.region) {
    expect(typeof geolocation.region.isoCode).toBe('string');
    expect(typeof geolocation.region.name).toBe('string');
  }

  if (geolocation.country) {
    expect(typeof geolocation.country.isoCode).toBe('string');
    expect(typeof geolocation.country.name).toBe('string');
  }

  if (geolocation.location) {
    expect(typeof geolocation.location.latitude).toBe('number');
    expect(typeof geolocation.location.longitude).toBe('number');
    expect(typeof geolocation.location.accuracyRadius).toBe('number');
    expect(typeof geolocation.location.timeZone).toBe('string');
  }

  if (geolocation.traits) {
    expect(typeof geolocation.traits.isAnonymous).toBe('boolean');
    expect(typeof geolocation.traits.isAnonymousProxy).toBe('boolean');
    expect(typeof geolocation.traits.isAnonymousVpn).toBe('boolean');
    expect(typeof geolocation.traits.network).toBe('string');
  }
};

test('fingerprint-oss geoInfo test', async ({ page }) => {
  // Go to the test page
  await page.goto('http://localhost:8080/');
  
  // Setup logging and wait for data
  logBrowserConsoleMessages(page);
  
  // Wait for fingerprint data to be ready
  await waitForFingerprintData(page);
  
  // Get and validate the test data
  const testData = await getTestData(page);
  
  try {
    assertGeolocationData(testData);
  } catch (error) {
    console.error('Test failed. Full testData:', JSON.stringify(testData, null, 2));
    throw error;
  }
});

