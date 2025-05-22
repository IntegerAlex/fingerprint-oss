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

// Helper function for reliable rounding
function reliableRound(value: number, precision: number): string {
  const multiplier = Math.pow(10, precision);
  // Handle potential floating point inaccuracies for numbers very close to x.5
  // e.g. 1.2345 * 1000 = 1234.4999999999998, Math.round would give 1234.
  // Adding a small epsilon can help, but must be smaller than what would change a correct rounding.
  // A more robust way is to convert to string and check, or use a decimal library.
  // For this specific case, let's test Math.round directly first.
  // The issue with 1.2345 was that toFixed(3) was truncating it to "1.234".
  // Math.round(1.2345 * 1000) = Math.round(1234.5) = 1235. So this should work.
  const roundedValue = Math.round(value * multiplier) / multiplier;
  return roundedValue.toFixed(precision);
}

/**
 * Generates a deterministic SHA-256 hash string that uniquely identifies a system based on normalized and sorted system information.
 *
 * Extracts and normalizes key properties from {@link systemInfo}, including browser identity, language, graphics capabilities, platform details, GPU information, font metrics, math constants, and plugins. The resulting object is recursively sorted and serialized with consistent formatting before hashing.
 *
 * @param systemInfo - The system information object containing browser, hardware, and environment details to be fingerprinted.
 * @returns A SHA-256 hash string representing the normalized system fingerprint.
 */
export async function generateId(systemInfo: SystemInfo): Promise<string> {

  const stableInfo = {
    // Core browser identity properties
    userAgent: systemInfo.userAgent,
    platform: systemInfo.platform,
    
    // Graphics capabilities (normalized)
    screenResolution: systemInfo.screenResolution,
    colorDepth: systemInfo.colorDepth,
    colorGamut: systemInfo.colorGamut,
    
    // Platform fundamentals
    os: systemInfo.os,
    
    // Hardware fingerprint (normalized)
    gpuVendor: (systemInfo.webGL?.vendor ?? '').replace(/\(.*?\)/g, '').trim(),
    gpuRenderer: (systemInfo.webGL?.renderer ?? '').replace(/(0x[\da-f]+)|(D3D\d+)|(vs_.*?ps_.*)/gi, '').trim(),
    hardwareConcurrency: systemInfo.hardwareConcurrency,
    deviceMemory: systemInfo.deviceMemory,

    // Canvas and Audio fingerprints
    canvasFingerprint: systemInfo.canvas,
    audioFingerprint: systemInfo.audio,
    
    // Privacy-neutral font metrics
    fontMetrics: systemInfo.fontPreferences.fonts.map(f => ({
      name: f.name,
      width: Math.round(f.width / 10) * 10 // Round to nearest 10
    })),
   // Fixed mathConstants section
    mathConstants: Object.fromEntries(
      Object.entries(systemInfo.mathConstants).map(([k, v]) => [
        k,
        reliableRound(Number(v), 3) // Use reliable rounding
      ])
    ),

// Fixed plugins section
plugins: systemInfo.plugins
  .filter(p => !p.name?.includes('Brave'))
  .map(p => ({
    name: p.name?.replace(/\s+/g, ' ').trim() || '',
    types: p.mimeTypes?.map(mt => mt.type) || []
  })) 
  };
  const sortedStableInfo = deepSortObject(stableInfo);
  const hashInput = JSON.stringify(sortedStableInfo, replacer);
  return await sha256(hashInput);
}

/**
 * Normalizes values for JSON serialization by handling ArrayBuffers, rounding numbers, and trimming whitespace in strings.
 *
 * @param key - The property key being processed.
 * @param value - The property value to normalize.
 * @returns The normalized value for serialization.
 */
function replacer(key: string, value: any) {
  if (value instanceof ArrayBuffer) return '';
  if (typeof value === 'number') return Number(value.toFixed(3)); // This should be fine for numbers not processed by reliableRound
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
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  
  if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = deepSortObject(obj[key]);
        return acc;
      }, {} as Record<string, any>);
  }
  
  return obj;
}
