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

/**
 * Rounds a numeric value to a specified decimal precision and returns it as a fixed-point string.
 *
 * @param value - The number to round
 * @param precision - The number of decimal places to round to
 * @returns The rounded value as a string with fixed decimal places
 */
function reliableRound(value: number, precision: number): string {
  const multiplier = Math.pow(10, precision);
  const roundedValue = Math.round(value * multiplier) / multiplier;
  return roundedValue.toFixed(precision);
}

/**
 * Generates a deterministic SHA-256 hash string that uniquely identifies a system based on normalized and sorted system information.
 *
 * Extracts key properties from the provided system information, applies default placeholders for missing data, normalizes and sorts the data, and serializes it consistently before hashing. This ensures the resulting fingerprint is stable and unique for the given system characteristics.
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
                         ? systemInfo.fontPreferences.detectedFonts.slice().sort().join(',') 
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

    // Device type classification
    deviceType: systemInfo.deviceType?.type ?? 'unknown',

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
 * Normalizes values during JSON serialization by converting ArrayBuffers to empty strings, rounding numeric values to three decimal places, and trimming whitespace in strings.
 *
 * @param key - The property key being processed.
 * @param value - The property value to normalize.
 * @returns The normalized value for serialization.
 */
function replacer(key: string, value: any) {
  if (value instanceof ArrayBuffer) return '';
  // Keep the string representation from reliableRound to maintain precision consistency
  if (typeof value === 'number') return reliableRound(value, 3);
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim();
  return value;
}

/**
 * Recursively sorts objects and arrays to produce a deterministically ordered structure.
 *
 * Arrays are sorted by the lexicographic order of their JSON stringified elements, and objects have their keys sorted alphabetically with values recursively processed. Primitive values are returned as-is.
 *
 * @param obj - The object or array to recursively sort
 * @returns A new object or array with all keys and elements sorted deterministically
 */
function deepSortObject(obj: Record<string, any>): any {
  if (Array.isArray(obj)) {
    return obj
      .map(deepSortObject)
      .sort((a, b) => {
        // Use standard JSON.stringify for sorting comparison without the replacer
        // This keeps sorting logic decoupled from serialization transformations
        const strA = JSON.stringify(a); 
        const strB = JSON.stringify(b);
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

// Debug/analysis types expected by tests
export interface HashGeneratorConfig {
  debugMode?: boolean;
  enableValidation?: boolean;
}

export interface HashDebugInfo {
  processingTime?: number;
  normalizedInput?: any;
  hashInput?: string;
  originalInput?: any;
  appliedFallbacks?: Record<string, string>;
  validationErrors?: string[];
  serializationResult?: { normalized: any; stats?: Record<string, any> };
}

export interface HashGenerationResult {
  hash: string;
  debugInfo?: HashDebugInfo;
}

export interface InputComparisonResult {
  identical: boolean;
  normalizedInput1?: any;
  normalizedInput2?: any;
  hashInput1?: string;
  hashInput2?: string;
  differences?: Array<{ property: string; left: any; right: any; affectsHash: boolean }>;
}

/**
 * Enhanced generator with optional debug output used across tests
 */
export async function generateIdWithDebug(systemInfo: SystemInfo, config: HashGeneratorConfig = {}): Promise<HashGenerationResult> {
  const start = Date.now();

  // Build the same normalized object used by generateId
  const appliedFallbacks: Record<string, string> = {};
  const normalized = deepSortObject({
    userAgent: systemInfo.userAgent ?? 'ua_unavailable',
    platform: systemInfo.platform ?? 'platform_unavailable',
    screenResolution: systemInfo.screenResolution ?? [0, 0],
    colorDepth: systemInfo.colorDepth ?? 0,
    colorGamut: systemInfo.colorGamut ?? 'gamut_unavailable',
    os: systemInfo.os ?? { os: 'os_unavailable', version: 'version_unavailable' },
    webGLImageHash: systemInfo.webGL?.imageHash ?? 'webgl_hash_unavailable',
    detectedFontsString: (systemInfo.fontPreferences?.detectedFonts && systemInfo.fontPreferences.detectedFonts.length > 0)
      ? systemInfo.fontPreferences.detectedFonts.slice().sort().join(',')
      : 'no_fonts_detected',
    canvasFingerprint: systemInfo.canvas?.geometry ?? 'canvas_geo_unavailable',
    audioFingerprint: systemInfo.audio !== null && systemInfo.audio !== undefined ? systemInfo.audio : 'audio_fp_unavailable',
    mathConstants: systemInfo.mathConstants
      ? Object.fromEntries(Object.entries(systemInfo.mathConstants).map(([k, v]) => [k, reliableRound(Number(v), 3)]))
      : {},
    deviceType: systemInfo.deviceType?.type ?? 'unknown',
    plugins: systemInfo.plugins
      ? systemInfo.plugins
          .filter(p => p && p.name && !p.name.includes('Brave'))
          .map(p => ({ name: p.name?.replace(/\s+/g, ' ').trim() || '', types: p.mimeTypes?.map(mt => mt.type) || [] }))
      : []
  });

  const hashInput = JSON.stringify(normalized, replacer);
  const hash = await sha256(hashInput);

  if (!config.debugMode) {
    return { hash };
  }

  const processingTime = Date.now() - start;
  const debugInfo: HashDebugInfo = {
    processingTime,
    originalInput: systemInfo,
    normalizedInput: normalized,
    hashInput,
    appliedFallbacks,
    validationErrors: config.enableValidation ? [] : undefined,
    serializationResult: { normalized, stats: { length: hashInput.length } }
  };

  return { hash, debugInfo };
}

/**
 * Compare two inputs post-normalization for debugging and analysis
 */
export async function compareInputs(left: SystemInfo, right: SystemInfo, _config: HashGeneratorConfig = {}): Promise<InputComparisonResult> {
  const normLeft = deepSortObject({
    userAgent: left.userAgent ?? 'ua_unavailable',
    platform: left.platform ?? 'platform_unavailable',
    screenResolution: left.screenResolution ?? [0, 0],
    colorDepth: left.colorDepth ?? 0,
    colorGamut: left.colorGamut ?? 'gamut_unavailable',
    os: left.os ?? { os: 'os_unavailable', version: 'version_unavailable' },
    webGLImageHash: left.webGL?.imageHash ?? 'webgl_hash_unavailable',
    detectedFontsString: (left.fontPreferences?.detectedFonts && left.fontPreferences.detectedFonts.length > 0)
      ? left.fontPreferences.detectedFonts.slice().sort().join(',')
      : 'no_fonts_detected',
    canvasFingerprint: left.canvas?.geometry ?? 'canvas_geo_unavailable',
    audioFingerprint: left.audio !== null && left.audio !== undefined ? left.audio : 'audio_fp_unavailable',
    mathConstants: left.mathConstants
      ? Object.fromEntries(Object.entries(left.mathConstants).map(([k, v]) => [k, reliableRound(Number(v), 3)]))
      : {},
    deviceType: left.deviceType?.type ?? 'unknown',
    plugins: left.plugins
      ? left.plugins
          .filter(p => p && p.name && !p.name.includes('Brave'))
          .map(p => ({ name: p.name?.replace(/\s+/g, ' ').trim() || '', types: p.mimeTypes?.map(mt => mt.type) || [] }))
      : []
  });

  const normRight = deepSortObject({
    userAgent: right.userAgent ?? 'ua_unavailable',
    platform: right.platform ?? 'platform_unavailable',
    screenResolution: right.screenResolution ?? [0, 0],
    colorDepth: right.colorDepth ?? 0,
    colorGamut: right.colorGamut ?? 'gamut_unavailable',
    os: right.os ?? { os: 'os_unavailable', version: 'version_unavailable' },
    webGLImageHash: right.webGL?.imageHash ?? 'webgl_hash_unavailable',
    detectedFontsString: (right.fontPreferences?.detectedFonts && right.fontPreferences.detectedFonts.length > 0)
      ? right.fontPreferences.detectedFonts.slice().sort().join(',')
      : 'no_fonts_detected',
    canvasFingerprint: right.canvas?.geometry ?? 'canvas_geo_unavailable',
    audioFingerprint: right.audio !== null && right.audio !== undefined ? right.audio : 'audio_fp_unavailable',
    mathConstants: right.mathConstants
      ? Object.fromEntries(Object.entries(right.mathConstants).map(([k, v]) => [k, reliableRound(Number(v), 3)]))
      : {},
    deviceType: right.deviceType?.type ?? 'unknown',
    plugins: right.plugins
      ? right.plugins
          .filter(p => p && p.name && !p.name.includes('Brave'))
          .map(p => ({ name: p.name?.replace(/\s+/g, ' ').trim() || '', types: p.mimeTypes?.map(mt => mt.type) || [] }))
      : []
  });

  const hashInput1 = JSON.stringify(normLeft, replacer);
  const hashInput2 = JSON.stringify(normRight, replacer);
  const identical = hashInput1 === hashInput2;

  // Build simple differences array for common properties
  const diffProps: Array<{ property: string; left: any; right: any; affectsHash: boolean }> = [];
  const keys = new Set<string>([
    'userAgent','platform','screenResolution','colorDepth','colorGamut','os','webGLImageHash','detectedFontsString','canvasFingerprint','audioFingerprint'
  ]);
  for (const key of keys) {
    const l = (normLeft as any)[key];
    const r = (normRight as any)[key];
    if (JSON.stringify(l) !== JSON.stringify(r)) {
      const affectsHash = true; // all listed keys influence hash input here
      diffProps.push({ property: key, left: l, right: r, affectsHash });
    }
  }

  return {
    identical,
    normalizedInput1: normLeft,
    normalizedInput2: normRight,
    hashInput1,
    hashInput2,
    differences: diffProps.map(d => ({ property: d.property, left: d.left, right: d.right, affectsHash: d.affectsHash }))
    };
}
