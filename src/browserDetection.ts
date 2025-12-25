/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import Bowser from './bowser/bowser.js';

/**
 * Detects browser information using Bowser library
 * @returns { name?: string, version?: string } Browser name and version
 */
export function getBrowserInfo(): { name?: string; version?: string } {
  if (typeof navigator === 'undefined') {
    return {};
  }

  try {
    const result = Bowser.parse(navigator.userAgent);
    return {
      name: result.browser.name,
      version: result.browser.version
    };
  } catch (error) {
    console.warn('Browser detection failed:', error);
    return {};
  }
}

/**
 * Gets browser name using Bowser library
 * @returns {string} Browser name or 'Unknown'
 */
export function getBrowserName(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown';
  }

  try {
    const result = Bowser.parse(navigator.userAgent);
    return result.browser.name || 'Unknown';
  } catch (error) {
    console.warn('Browser name detection failed:', error);
    return 'Unknown';
  }
}

