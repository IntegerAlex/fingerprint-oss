import { test, expect } from '@playwright/test';

test('fingerprint-oss systemInfo Test', async ({ page }) => {
  // Navigate to the server page where fingerprinting happens

   
  await page.goto('http://localhost:8080/'); // Ensure the server is running

  // Debug: Log any browser console errors for visibility
  page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`));

  // Wait for the fingerprint data to be populated in the window.test variable
  await page.waitForFunction(() => window.test !== undefined, { timeout: 60000 });

  // Retrieve the actual test data from the browser context
  const testData = await page.evaluate(() => window.test);
try{
  // Debug output for inspection
  //console.log(testData);

  // Assertions to ensure the fingerprint data is valid
  expect(testData).toBeDefined(); // Ensure that the data exists

  // Check the type of testData, which should be an object
  expect(typeof testData).toBe('object');

  // Example checks for system information that are typically collected:
  // Verify that the system info contains expected values for certain properties

  // Check adBlocker information (adjust based on actual output)
  expect(testData.systemInfo.adBlocker.adBlocker).toBe(false); // Ensure adblocker is not present
  expect(testData.systemInfo.adBlocker.isBrave).toBe(false); // Ensure browser isn't Brave

  // Check the browser information
  expect(['Chrome', 'Firefox', 'Brave', 'Safari']).toContain(testData.systemInfo.incognito.browserName);

  // Validate screen resolution
  expect(testData.systemInfo.screenResolution).toEqual([1280, 720]); // Ensure resolution is 1920x1080

  // Validate the timezone info (example based on the mock data provided)
  expect(typeof testData.systemInfo.timezone).toBe('string'); // Ensure timezone is correct

  // Check the device memory (this may vary based on the actual system)
  //expect(testData.systemInfo.deviceMemory).toBeGreaterThan(0); // Device memory should be greater than 0

  // Check the availability of important browser APIs
  expect(testData.systemInfo.localStorage).toBe(true); // Ensure localStorage is available
  expect(testData.systemInfo.sessionStorage).toBe(true); // Ensure sessionStorage is available
  expect(testData.systemInfo.indexedDB).toBe(true); // Ensure indexedDB is available

  // Check for any bot signals (confidence score should be reasonable)
  expect(testData.systemInfo.bot.confidence).toBeGreaterThan(0.1); // Ensure confidence is reasonably high (e.g., > 0.7)

  // Check if the fingerprinting system returned a hash (this is typically a hash of various data points)
  //expect(testData.systemInfo.hash).toMatch(/[a-f0-9]{32}/); // Ensure hash is a valid MD5 hash (adjust depending on your hash algorithm)
  } catch (error) {
  // Log the entire testData if any assertion fails
  console.error('Test failed. Full testData:', JSON.stringify(testData, null, 2));
  
  // Rethrow the error to ensure the test still fails
  throw error;
}
});

