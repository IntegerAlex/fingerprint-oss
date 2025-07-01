/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

/**
 * Generates a SHA-256 hash from sorted system info for identification.
 * @param systemInfo Object containing system-specific data.
 * @returns A SHA-256 hash string.
 */

import { SystemInfo } from './types';
import { sha256 } from 'hash-wasm';

// Helper function for reliable rounding (ensure this is present from previous fixes)
function reliableRound(value: number, precision: number): string {
  const multiplier = Math.pow(10, precision);
  const roundedValue = Math.round(value * multiplier) / multiplier;
  return roundedValue.toFixed(precision);
}

/**
 * Generates a deterministic SHA-256 hash string that uniquely identifies a system based on normalized and sorted system information.
 *
 * Extracts and normalizes key properties from {@link systemInfo}. The resulting object is 
 * recursively sorted and serialized with consistent formatting before hashing.
 *
 * @param systemInfo - The system information object containing browser, hardware, and environment details to be fingerprinted.
 * @returns A SHA-256 hash string representing the normalized system fingerprint.
 */
export async function generateId(systemInfo: SystemInfo): Promise<string> {

  const stableInfo = {
    // Core browser identity properties
    userAgent: systemInfo.userAgent ?? 'ua_unavailable',
    platform: systemInfo.platform ?? 'platform_unavailable',
    
    // Graphics capabilities (normalized)
    screenResolution: systemInfo.screenResolution ?? [0,0],
    colorDepth: systemInfo.colorDepth ?? 0,
    colorGamut: systemInfo.colorGamut ?? 'gamut_unavailable',
    
    // Platform fundamentals
    os: systemInfo.os ?? { os: 'os_unavailable', version: 'version_unavailable' },
    
    // New WebGL Image Hash
    webGLImageHash: systemInfo.webGL?.imageHash ?? 'webgl_hash_unavailable',

    // New Font Fingerprinting
    detectedFontsString: (systemInfo.fontPreferences?.detectedFonts && systemInfo.fontPreferences.detectedFonts.length > 0) 
                         ? systemInfo.fontPreferences.detectedFonts.join(',') 
                         : 'no_fonts_detected',

    // Canvas and Audio fingerprints
    canvasFingerprint: systemInfo.canvas?.geometry ?? 'canvas_geo_unavailable',
    // Ensure audioFingerprint is consistently a string or number, or a placeholder string
    audioFingerprint: systemInfo.audio !== null && systemInfo.audio !== undefined 
                      ? systemInfo.audio 
                      : 'audio_fp_unavailable',
    
    // Math constants (using reliableRound from previous fix)
    mathConstants: systemInfo.mathConstants 
                   ? Object.fromEntries(
                       Object.entries(systemInfo.mathConstants).map(([k, v]) => [
                         k,
                         reliableRound(Number(v), 3)
                       ])
                     )
                   : {}, // Provide an empty object if mathConstants is undefined

    // Plugins (filtered)
    plugins: systemInfo.plugins 
             ? systemInfo.plugins
                 .filter(p => p && p.name && !p.name.includes('Brave'))
                 .map(p => ({
                   name: p.name?.replace(/\s+/g, ' ').trim() || '',
                   types: p.mimeTypes?.map(mt => mt.type) || []
                 }))
             : [] // Provide an empty array if plugins is undefined
  };

  const sortedStableInfo = deepSortObject(stableInfo);
  const hashInput = JSON.stringify(sortedStableInfo, replacer);
  return await sha256(hashInput);
}

/**
 * Normalizes values for JSON serialization by handling ArrayBuffers, rounding numbers (if not already strings), and trimming whitespace in strings.
 *
 * @param key - The property key being processed.
 * @param value - The property value to normalize.
 * @returns The normalized value for serialization.
 */
function replacer(key: string, value: any) {
  if (value instanceof ArrayBuffer) return '';
  // Numbers that are not already strings (like mathConstants or audioFingerprint if it was stringified)
  // will be processed here.
  if (typeof value === 'number') return Number(reliableRound(value, 3));
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim();
  return value;
}

/**
 * Recursively sorts the keys of objects and the elements of arrays to ensure deterministic ordering.
 *
 * For arrays, each element is recursively sorted and the array is ordered lexicographically by the JSON stringification of its elements. For objects, keys are sorted alphabetically and each value is recursively processed. Primitive values are returned unchanged.
 *
 * @param obj - The object or array to sort.
 * @returns A new object or array with all keys and elements sorted recursively.
 */
function deepSortObject(obj: Record<string, any>): any {
  if (Array.isArray(obj)) {
    return obj
      .map(deepSortObject)
      .sort((a, b) => {
        // Ensure consistent stringification for sorting comparison
        const strA = JSON.stringify(a, replacer); 
        const strB = JSON.stringify(b, replacer);
        return strA.localeCompare(strB);
      });
  }
  
  if (obj && typeof obj === 'object' && obj !== null) { // Added null check for obj
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = deepSortObject(obj[key]);
        return acc;
      }, {} as Record<string, any>);
  }
  
  return obj;
}
