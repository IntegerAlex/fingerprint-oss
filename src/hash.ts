/**
 * Generates a SHA-256 hash from sorted system info for identification.
 * @param systemInfo Object containing system-specific data.
 * @returns A SHA-256 hash string.
 */

import { SystemInfo } from './types';
import { sha256 } from 'hash-wasm';

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
    
    // Language and regional settings
    languages: systemInfo.languages,
    timezone: systemInfo.timezone,
    
    // Graphics capabilities (normalized)
    screenResolution: systemInfo.screenResolution,
    colorDepth: systemInfo.colorDepth,
    colorGamut: systemInfo.colorGamut,
    
    // Platform fundamentals
    os: systemInfo.os,
    
    // Hardware fingerprint (normalized)
    gpuVendor: (systemInfo.webGL?.vendor ?? '').replace(/\(.*?\)/g, '').trim(),
    gpuRenderer: (systemInfo.webGL?.renderer ?? '').replace(/(0x[\da-f]+)|(D3D\d+)|(vs_.*?ps_.*)/gi, '').trim(),
    
    // Privacy-neutral font metrics
    fontMetrics: systemInfo.fontPreferences.fonts.map(f => ({
      name: f.name,
      width: Math.round(f.width / 10) * 10 // Round to nearest 10
    })),
   // Fixed mathConstants section
mathConstants: Object.fromEntries(
  Object.entries(systemInfo.mathConstants).map(([k, v]) => [
    k, 
    Number(Number(v).toFixed(3))  // Explicit conversion and fixed decimal places
  ])  // Added closing bracket for map
),  // Comma added for object separation

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
  if (typeof value === 'number') return Number(value.toFixed(3));
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
