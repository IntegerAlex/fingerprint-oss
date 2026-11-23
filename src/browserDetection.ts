/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import Bowser from 'bowser';
import { StructuredLogger } from './config.js';
import { probeBrowser, BROWSER_FAMILY_NAMES } from './browserProbe.js';
import type { BrowserProbe } from './browserProbe.js';

const BLINK_UA_NAMES = new Set(['Chrome', 'Chromium', 'Microsoft Edge', 'Opera', 'Samsung Internet']);

/**
 * Decides whether the feature probe or the User-Agent should name the browser.
 *
 * The probe only overrides the UA when the UA provably cannot self-report the
 * truth:
 *  - Brave ships a Chrome UA and Chrome brands; only `navigator.brave` knows.
 *  - A Gecko engine behind a Chrome/Edge UA means the string is spoofed.
 *  - Safari's DOM bindings behind a desktop Chrome UA, likewise.
 *  - A Chromium variant that the UA reports as plain `Chrome`, where Client
 *    Hints name the vendor.
 *
 * Everything else keeps the UA verdict: Chrome on iOS is a WebKit shell that
 * exposes Safari's globals, and calling it Safari would be wrong.
 */
function resolveBrowserName(uaName: string | undefined, ua: string, probe: BrowserProbe): {
  name?: string;
  source: 'probe' | 'ua';
} {
  const probedName = probe.family === 'unknown' ? undefined : BROWSER_FAMILY_NAMES[probe.family];
  if (!probedName) return { name: uaName, source: 'ua' };

  if (probe.family === 'brave') {
    return uaName === 'Brave' ? { name: uaName, source: 'ua' } : { name: probedName, source: 'probe' };
  }

  if (probe.family === 'firefox' && uaName !== undefined && BLINK_UA_NAMES.has(uaName)) {
    return { name: probedName, source: 'probe' };
  }

  if (probe.family === 'safari'
      && (uaName === 'Chrome' || uaName === 'Chromium')
      && !/iphone|ipad|ipod/i.test(ua)) {
    return { name: probedName, source: 'probe' };
  }

  if (probe.detectedBy === 'client-hints'
      && probe.family !== 'chromium'
      && (uaName === 'Chrome' || uaName === 'Chromium')) {
    return { name: probedName, source: 'probe' };
  }

  return { name: uaName, source: 'ua' };
}

/**
 * Detects browser information: Client Hints and feature probes first, with
 * Bowser's User-Agent parsing as the naming fallback and the version source.
 * @returns { name?, version?, detectedBy? } Browser name, version, and which
 * source named it
 */
export function getBrowserInfo(): { name?: string; version?: string; detectedBy?: 'probe' | 'ua' } {
  if (typeof navigator === 'undefined') {
    return {};
  }

  try {
    const result = Bowser.parse(navigator.userAgent);
    const probe = probeBrowser();
    const { name, source } = resolveBrowserName(result.browser.name, navigator.userAgent, probe);
    return {
      name,
      version: result.browser.version,
      detectedBy: source,
    };
  } catch (error) {
    StructuredLogger.warn('getBrowserInfo', 'Browser detection failed', error);
    return {};
  }
}

/**
 * Gets browser name, preferring the feature probe over User-Agent parsing.
 * @returns {string} Browser name or 'Unknown'
 */
export function getBrowserName(): string {
  return getBrowserInfo().name || 'Unknown';
}

