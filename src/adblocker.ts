/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import { BraveInfo } from './types';

/**
 * Detects Brave browser 
 * @returns {Promise<boolean>} true if Brave browser is detected, false otherwise
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
 * Detects Brave browser using `navigator.userAgentData`
 * @returns {Promise<boolean>} true if Brave browser is detected, false otherwise
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
 * Detects uBlock Origin or some other ad blocker
 * @returns {Promise<boolean>} true if uBlock Origin is detected, false otherwise
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
// src/adblocker.ts
interface AdsByGoogle {
  loaded: boolean;
  push: (config: any) => void;
}
async function detectAdBlock(): Promise<boolean> {
  try {
    // Fetch the script and read it as text
    const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
      method: 'GET',
      mode: 'no-cors',
    });

    // If the response is null, it means the ad blocker fully blocked it
    if (!response) return true;

    // Try to read response text (this might fail if completely blocked)
    const text = await response.text();

    // Check for uBlock Origin or similar modifications in the script response
    if (text.includes('uBlock Origin') || text.includes('window.adsbygoogle = { loaded: true, push: function() {} };')) {
      return true; // Adblocker detected
    }

    return false; // No adblock detected
  } catch (_error: unknown) {
    return true; // Fetch failure = likely ad blocker
  }
}

/**
 * Detects Brave browser and uBlock Origin (or some ad blocker)
 * @returns {Promise<{ isBrave: boolean, isUBlock: boolean }>}
 */
export async function detectAdBlockers(): Promise<{ isBrave: boolean, adBlocker: boolean }> {
  // 1. Detect Brave
  const braveChecks = [
    isBraveBrowser(),       // Check navigator.brave
    isBraveBrowserUAData()  // Check userAgentData
  ];
  const [maybeBrave1, maybeBrave2] = await Promise.all(braveChecks);
  const isBrave = maybeBrave1 || maybeBrave2;

  // 2. Detect uBlock (or some ad blocker)
  const isUBlock =  await isUBlockActive();

  return { isBrave, adBlocker: isUBlock };
}

// Usage

