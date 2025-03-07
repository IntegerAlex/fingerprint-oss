import { BraveInfo } from './types';

/**
 * Determines whether the current browser is Brave.
 *
 * The function first attempts to detect Brave by calling the `navigator.brave.isBrave()` method (if available).
 * If this method call fails or is unavailable, it falls back to checking the user agent string for the substring "brave".
 *
 * @returns A promise that resolves to true if Brave is detected, or false otherwise.
 */
async function isBraveBrowser(): Promise<boolean> {
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    try {
      return await navigator.brave.isBrave();
    } catch {
      // If an error occurs, fallback to user agent check
    }
  }
  // Fallback: check the user agent (not always reliable)
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('brave');
}

/**
 * Determines if the current browser is Brave by examining the `navigator.userAgentData` API.
 *
 * This function checks if `navigator.userAgentData` and its `brands` array are available. It returns true if any brand's name includes "brave" (case-insensitive), and false otherwise.
 *
 * @returns A promise that resolves to true if the Brave browser is detected, or false otherwise.
 */

async function isBraveBrowserUAData(): Promise<boolean> {
    if (navigator.userAgentData && navigator.userAgentData.brands) {
        return navigator.userAgentData.brands.some((brand: { brand: string }) =>
            brand.brand.toLowerCase().includes('brave')
        );
    }
    return false;
}

/**
 * Determines if an ad blocker (e.g., uBlock Origin or similar) is active.
 *
 * The function attempts to detect an ad blocker by invoking a helper that loads an external script. If an error occurs during detection,
 * the error is logged and the function returns false.
 *
 * @returns A promise that resolves to a boolean indicating whether an ad blocker is active.
 */
 async function isUBlockActive(): Promise<boolean> {
    let result = false;
    try {
        result = await detectAdBlock();
    } catch (error) {
        console.error('Error detecting ad blocker:', error);
    }
    return result;
}
/**
 * Detects whether an ad blocker is active.
 *
 * This function injects a script element that loads './dfp_async.js' from your server. The script is expected to add an element with the ID "GTvbiUxNuhSd" to the document. If this element is present after the script loads, it indicates that an ad blocker is not active and the promise resolves to false. If the element is absent or the script fails to load, the promise resolves to true, indicating that an ad blocker is active.
 *
 * @returns A promise that resolves to true if an ad blocker is detected; otherwise, false.
 */
function detectAdBlock(): Promise<boolean> {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = './dfp_async.js'; // Must exist on your server
        script.onload = () => resolve(!document.getElementById('GTvbiUxNuhSd'));
        script.onerror = () => resolve(true);
        document.body.appendChild(script);
    });
}

// Usage example
/**
 * Orchestrates detection of the Brave browser and ad blocker activity.
 *
 * This asynchronous function concurrently performs two checks to verify if the browser is Brave—one using the `navigator.brave` API and another using `navigator.userAgentData`—and also checks whether an ad blocker, such as uBlock Origin, is active.
 *
 * @returns A promise that resolves to an object with two boolean properties:
 * - `isBrave`: true if the browser is identified as Brave.
 * - `isUBlock`: true if an ad blocker is detected.
 */
export async function detectAdBlockers(): Promise<{ isBrave: boolean, isUBlock: boolean }> {
  // 1. Detect Brave
  const braveChecks = [
    isBraveBrowser(),       // Check navigator.brave
    isBraveBrowserUAData()  // Check userAgentData
  ];
  const [maybeBrave1, maybeBrave2] = await Promise.all(braveChecks);
  const isBrave = maybeBrave1 || maybeBrave2;

  // 2. Detect uBlock (or some ad blocker)
  const isUBlock =  await isUBlockActive();

  return { isBrave, isUBlock };
}

// Usage

