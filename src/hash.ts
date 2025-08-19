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
 * Enhanced hash generation with predictable fingerprint capabilities.
 * Generates a SHA-256 hash from normalized and validated system info for identification.
 */

import { SystemInfo } from './types';
import { sha256 } from 'hash-wasm';
import { normalizeValue, reliableRound, normalizeStringValue, normalizeArrayValue } from './normalization';
import { FallbackManager, FallbackReason, defaultFallbackManager } from './fallback';
import { ValidationEngine, DEFAULT_VALIDATION_CONFIG } from './validation';
import { EnhancedSerializer, SerializationConfig, SerializationResult, serializeWithNormalization } from './serialization';
import { getDebugLogger, DebugConfig, NormalizationStepType, DebugLogLevel } from './debug';
import { compareSystemInfo } from './comparison';

/**
 * Configuration options for hash generation
 */
export interface HashGeneratorConfig {
  debugMode?: boolean;
  strictMode?: boolean;
  customFallbacks?: Partial<import('./fallback').SystemInfoFallbacks>;
  enableValidation?: boolean;
  serializationConfig?: Partial<SerializationConfig>;
  debugConfig?: Partial<DebugConfig>;
}

/**
 * Debug information collected during hash generation
 */
export interface HashDebugInfo {
  originalInput: SystemInfo;
  normalizedInput: any;
  appliedFallbacks: Record<string, import('./fallback').FallbackInfo>;
  validationErrors: import('./validation').ValidationError[];
  hashInput: string;
  processingTime: number;
  serializationResult?: SerializationResult;
  debugSession?: import('./debug').DebugSession;
}

/**
 * Result of hash generation with optional debug information
 */
export interface HashGenerationResult {
  hash: string;
  debugInfo?: HashDebugInfo;
}

/**
 * Result of comparing two SystemInfo inputs
 */
export interface InputComparisonResult {
  identical: boolean;
  differences: InputDifference[];
  normalizedInput1: any;
  normalizedInput2: any;
  hashInput1: string;
  hashInput2: string;
}

/**
 * Represents a difference between two SystemInfo inputs
 */
export interface InputDifference {
  property: string;
  value1: any;
  value2: any;
  normalizedValue1: any;
  normalizedValue2: any;
  affectsHash: boolean;
}

/**
 * Enhanced generateId function with improved predictability and stability.
 * Maintains backward compatibility while providing better normalization and error handling.
 * 
 * @param systemInfo - The system information object containing browser, hardware, and environment details
 * @param config - Optional configuration for hash generation behavior
 * @returns A SHA-256 hash string representing the normalized system fingerprint
 */
export async function generateId(systemInfo: SystemInfo, config?: HashGeneratorConfig): Promise<string> {
  // Fast path for non-debug mode to optimize performance
  if (!config?.debugMode) {
    return await generateIdOptimized(systemInfo, config);
  }
  
  const result = await generateIdWithDebug(systemInfo, config);
  return result.hash;
}

/**
 * Optimized version of generateId for performance-critical scenarios.
 * Skips debug information collection to minimize overhead.
 * 
 * @param systemInfo - The system information object
 * @param config - Optional configuration for hash generation behavior
 * @returns A SHA-256 hash string
 */
async function generateIdOptimized(systemInfo: SystemInfo, config?: HashGeneratorConfig): Promise<string> {
  const enableValidation = config?.enableValidation ?? true;
  
  // Initialize managers with minimal overhead
  const fallbackManager = new FallbackManager(config?.customFallbacks);
  
  let processedSystemInfo = systemInfo;
  
  // Step 1: Input validation (if enabled) - optimized path
  if (enableValidation) {
    const validationEngine = new ValidationEngine({
      strictMode: config?.strictMode ?? false,
      enableSecurityChecks: true
    });
    
    const validationResult = validationEngine.validateSystemInfo(systemInfo);
    processedSystemInfo = validationResult.sanitizedData;
    
    // In strict mode, reject invalid input
    if (config?.strictMode && !validationResult.isValid) {
      throw new Error(`Invalid system information: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }
  }

  // Step 2: Apply fallbacks - optimized without tracking
  const stableInfo = await buildStableInfoOptimized(processedSystemInfo, fallbackManager);

  // Step 3: Enhanced normalization
  const normalizedInfo = normalizeSystemInfo(stableInfo);

  // Step 4: Enhanced serialization with normalization
  const serializationConfig: Partial<SerializationConfig> = {
    enableNormalization: true,
    sortKeys: true,
    sortArrays: true,
    ...config?.serializationConfig
  };
  
  const hashInput = serializeWithNormalization(normalizedInfo, serializationConfig);
  
  // Step 5: Generate hash
  return await sha256(hashInput);
}

/**
 * Optimized version of buildStableInfo without fallback tracking for better performance
 */
async function buildStableInfoOptimized(
  systemInfo: SystemInfo, 
  fallbackManager: FallbackManager
): Promise<any> {
  const getFallbackValue = (property: keyof SystemInfo, value: any, reason: FallbackReason) => {
    if (value === null || value === undefined || 
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)) {
      return fallbackManager.getFallbackValue(property, reason).value;
    }
    return value;
  };

  return {
    // Core browser identity properties with enhanced fallbacks
    userAgent: getFallbackValue('userAgent', systemInfo.userAgent, FallbackReason.MISSING_PROPERTY),
    platform: getFallbackValue('platform', systemInfo.platform, FallbackReason.MISSING_PROPERTY),
    
    // Graphics capabilities (normalized with fallbacks)
    screenResolution: getFallbackValue('screenResolution', systemInfo.screenResolution, FallbackReason.MISSING_PROPERTY),
    colorDepth: getFallbackValue('colorDepth', systemInfo.colorDepth, FallbackReason.MISSING_PROPERTY),
    colorGamut: getFallbackValue('colorGamut', systemInfo.colorGamut, FallbackReason.MISSING_PROPERTY),
    
    // Platform fundamentals
    os: getFallbackValue('os', systemInfo.os, FallbackReason.MISSING_PROPERTY),
    
    // Enhanced WebGL handling
    webGLImageHash: getFallbackValue('webGL', systemInfo.webGL?.imageHash, FallbackReason.MISSING_PROPERTY),

    // Enhanced font fingerprinting with better normalization
    detectedFontsString: systemInfo.fontPreferences?.detectedFonts && systemInfo.fontPreferences.detectedFonts.length > 0
      ? normalizeArrayValue(systemInfo.fontPreferences.detectedFonts).join(',')
      : getFallbackValue('fontPreferences', null, FallbackReason.MISSING_PROPERTY),

    // Canvas and Audio fingerprints with consistent fallbacks
    canvasFingerprint: getFallbackValue('canvas', systemInfo.canvas?.geometry, FallbackReason.MISSING_PROPERTY),
    audioFingerprint: getFallbackValue('audio', systemInfo.audio, FallbackReason.MISSING_PROPERTY),
    
    // Math constants with enhanced normalization
    mathConstants: systemInfo.mathConstants 
      ? Object.fromEntries(
          Object.entries(systemInfo.mathConstants).map(([k, v]) => [
            normalizeStringValue(k),
            reliableRound(Number(v), 3)
          ])
        )
      : getFallbackValue('mathConstants', null, FallbackReason.MISSING_PROPERTY),

    // Enhanced plugin filtering and normalization
    plugins: systemInfo.plugins && systemInfo.plugins.length > 0
      ? normalizeArrayValue(
          systemInfo.plugins
            .filter(p => p && p.name && !p.name.includes('Brave'))
            .map(p => ({
              name: normalizeStringValue(p.name || ''),
              types: normalizeArrayValue(p.mimeTypes?.map(mt => mt.type) || [])
            }))
        )
      : getFallbackValue('plugins', null, FallbackReason.MISSING_PROPERTY)
  };
}

/**
 * Enhanced generateId function that returns both hash and debug information.
 * Provides detailed information about the normalization and fallback process.
 * 
 * @param systemInfo - The system information object containing browser, hardware, and environment details
 * @param config - Optional configuration for hash generation behavior
 * @returns HashGenerationResult containing the hash and optional debug information
 */
export async function generateIdWithDebug(systemInfo: SystemInfo, config?: HashGeneratorConfig): Promise<HashGenerationResult> {
  const startTime = performance.now();
  const debugMode = config?.debugMode ?? false;
  const enableValidation = config?.enableValidation ?? true;
  
  // Initialize debug logger if in debug mode
  let debugSessionId: string | undefined;
  if (debugMode) {
    const debugLogger = getDebugLogger({
      enabled: true,
      ...config?.debugConfig
    });
    debugSessionId = debugLogger.startSession();
    debugLogger.log(DebugLogLevel.INFO, 'hash_generation', 'Starting hash generation with debug mode');
  }
  
  // Initialize managers
  const fallbackManager = new FallbackManager(config?.customFallbacks);
  const validationEngine = new ValidationEngine({
    strictMode: config?.strictMode ?? false,
    enableSecurityChecks: true
  });

  let debugInfo: HashDebugInfo | undefined;
  let validationErrors: import('./validation').ValidationError[] = [];
  let appliedFallbacks: Record<string, import('./fallback').FallbackInfo> = {};

  // Step 1: Input validation (if enabled)
  let processedSystemInfo = systemInfo;
  if (enableValidation) {
    if (debugMode) {
      const debugLogger = getDebugLogger();
      debugLogger.log(DebugLogLevel.DEBUG, 'validation', 'Starting input validation');
    }
    
    const validationResult = validationEngine.validateSystemInfo(systemInfo);
    validationErrors = validationResult.errors;
    processedSystemInfo = validationResult.sanitizedData;
    
    // Log validation errors if any
    if (debugMode && validationErrors.length > 0) {
      const debugLogger = getDebugLogger();
      validationErrors.forEach(error => {
        debugLogger.logValidation(error.property, error.message, error.originalValue, error.suggestedValue);
      });
    }
    
    // In strict mode, reject invalid input
    if (config?.strictMode && !validationResult.isValid) {
      if (debugMode) {
        const debugLogger = getDebugLogger();
        debugLogger.log(DebugLogLevel.ERROR, 'validation', 'Strict mode validation failed');
      }
      throw new Error(`Invalid system information: ${validationErrors.map(e => e.message).join(', ')}`);
    }
  }

  // Step 2: Apply fallbacks for missing or invalid data with enhanced consistency
  if (debugMode) {
    const debugLogger = getDebugLogger();
    debugLogger.log(DebugLogLevel.DEBUG, 'fallback', 'Applying fallbacks for missing data');
  }
  
  const stableInfo = await buildStableInfo(processedSystemInfo, fallbackManager, appliedFallbacks, debugMode);

  // Step 3: Enhanced normalization using new utilities
  if (debugMode) {
    const debugLogger = getDebugLogger();
    debugLogger.log(DebugLogLevel.DEBUG, 'normalization', 'Starting system info normalization');
  }
  
  const normalizedInfo = normalizeSystemInfo(stableInfo, debugMode);

  // Step 4: Enhanced serialization with normalization and debug info
  if (debugMode) {
    const debugLogger = getDebugLogger();
    debugLogger.log(DebugLogLevel.DEBUG, 'serialization', 'Starting enhanced serialization');
  }
  
  const serializationConfig: Partial<SerializationConfig> = {
    enableNormalization: true,
    sortKeys: true,
    sortArrays: true,
    ...config?.serializationConfig
  };
  
  const serializer = new EnhancedSerializer(serializationConfig);
  const serializationResult = serializer.serialize(normalizedInfo);
  const hashInput = serializationResult.serialized;
  
  if (debugMode) {
    const debugLogger = getDebugLogger();
    debugLogger.logSerialization(
      JSON.stringify(normalizedInfo).length,
      hashInput.length,
      hashInput.length / JSON.stringify(normalizedInfo).length
    );
  }
  
  // Step 5: Generate hash
  if (debugMode) {
    const debugLogger = getDebugLogger();
    debugLogger.log(DebugLogLevel.DEBUG, 'hash', 'Generating SHA-256 hash');
  }
  
  const hash = await sha256(hashInput);
  
  const endTime = performance.now();

  // Collect debug information if requested
  if (debugMode) {
    const debugLogger = getDebugLogger();
    debugLogger.log(DebugLogLevel.INFO, 'hash_generation', 
      `Hash generation completed. Hash: ${hash.substring(0, 16)}...`);
    
    const debugSession = debugLogger.endSession();
    
    debugInfo = {
      originalInput: systemInfo,
      normalizedInput: normalizedInfo,
      appliedFallbacks,
      validationErrors,
      hashInput,
      processingTime: endTime - startTime,
      serializationResult,
      debugSession: debugSession || undefined
    };
  }

  return {
    hash,
    debugInfo
  };
}

/**
 * Compares two SystemInfo inputs and analyzes their differences.
 * Provides detailed information about what differs between the inputs
 * and how those differences affect the final hash.
 * 
 * @param info1 - First SystemInfo object to compare
 * @param info2 - Second SystemInfo object to compare
 * @param config - Optional configuration for comparison behavior
 * @returns InputComparisonResult containing detailed comparison analysis
 */
export async function compareInputs(
  info1: SystemInfo, 
  info2: SystemInfo, 
  config?: HashGeneratorConfig
): Promise<InputComparisonResult> {
  // Use the enhanced comparison utilities for better analysis
  const detailedResult = await compareSystemInfo(info1, info2, config);

  // Convert to legacy format for backward compatibility
  const differences: InputDifference[] = detailedResult.differences.map(diff => ({
    property: diff.property,
    value1: diff.value1,
    value2: diff.value2,
    normalizedValue1: diff.normalizedValue1,
    normalizedValue2: diff.normalizedValue2,
    affectsHash: diff.affectsHash
  }));

  return {
    identical: detailedResult.identical,
    differences,
    normalizedInput1: detailedResult.debugInfo1?.normalizedInput,
    normalizedInput2: detailedResult.debugInfo2?.normalizedInput,
    hashInput1: detailedResult.debugInfo1?.hashInput || '',
    hashInput2: detailedResult.debugInfo2?.hashInput || ''
  };
}

/**
 * Recursively finds differences between two objects
 */
function findObjectDifferences(prefix: string, obj1: any, obj2: any): Array<{property: string, value1: any, value2: any}> {
  const differences: Array<{property: string, value1: any, value2: any}> = [];
  
  // Get all unique keys from both objects
  const keys1 = obj1 && typeof obj1 === 'object' ? Object.keys(obj1) : [];
  const keys2 = obj2 && typeof obj2 === 'object' ? Object.keys(obj2) : [];
  const allKeys = new Set([...keys1, ...keys2]);
  
  for (const key of allKeys) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];
    
    if (val1 !== val2) {
      // If both are objects, recurse
      if (val1 && val2 && typeof val1 === 'object' && typeof val2 === 'object' && !Array.isArray(val1) && !Array.isArray(val2)) {
        differences.push(...findObjectDifferences(currentPath, val1, val2));
      } else {
        // Direct difference
        differences.push({
          property: currentPath,
          value1: val1,
          value2: val2
        });
      }
    }
  }
  
  return differences;
}

/**
 * Gets a nested property value from an object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Builds stable info object with consistent fallback handling
 */
async function buildStableInfo(
  systemInfo: SystemInfo, 
  fallbackManager: FallbackManager, 
  appliedFallbacks: Record<string, import('./fallback').FallbackInfo>,
  debugMode: boolean = false
): Promise<any> {
  const getFallbackValue = (property: keyof SystemInfo, value: any, reason: FallbackReason) => {
    if (value === null || value === undefined || 
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)) {
      const fallbackResult = fallbackManager.getFallbackValue(property, reason);
      appliedFallbacks[property as string] = fallbackResult.info;
      
      // Log fallback application if in debug mode
      if (debugMode) {
        const debugLogger = getDebugLogger();
        debugLogger.logFallback(property as string, reason, value, fallbackResult.value);
      }
      
      return fallbackResult.value;
    }
    return value;
  };

  return {
    // Core browser identity properties with enhanced fallbacks
    userAgent: getFallbackValue('userAgent', systemInfo.userAgent, FallbackReason.MISSING_PROPERTY),
    platform: getFallbackValue('platform', systemInfo.platform, FallbackReason.MISSING_PROPERTY),
    
    // Graphics capabilities (normalized with fallbacks)
    screenResolution: getFallbackValue('screenResolution', systemInfo.screenResolution, FallbackReason.MISSING_PROPERTY),
    colorDepth: getFallbackValue('colorDepth', systemInfo.colorDepth, FallbackReason.MISSING_PROPERTY),
    colorGamut: getFallbackValue('colorGamut', systemInfo.colorGamut, FallbackReason.MISSING_PROPERTY),
    
    // Platform fundamentals
    os: getFallbackValue('os', systemInfo.os, FallbackReason.MISSING_PROPERTY),
    
    // Enhanced WebGL handling
    webGLImageHash: getFallbackValue('webGL', systemInfo.webGL?.imageHash, FallbackReason.MISSING_PROPERTY),

    // Enhanced font fingerprinting with better normalization
    detectedFontsString: systemInfo.fontPreferences?.detectedFonts && systemInfo.fontPreferences.detectedFonts.length > 0
      ? normalizeArrayValue(systemInfo.fontPreferences.detectedFonts).join(',')
      : getFallbackValue('fontPreferences', null, FallbackReason.MISSING_PROPERTY),

    // Canvas and Audio fingerprints with consistent fallbacks
    canvasFingerprint: getFallbackValue('canvas', systemInfo.canvas?.geometry, FallbackReason.MISSING_PROPERTY),
    audioFingerprint: getFallbackValue('audio', systemInfo.audio, FallbackReason.MISSING_PROPERTY),
    
    // Math constants with enhanced normalization
    mathConstants: systemInfo.mathConstants 
      ? Object.fromEntries(
          Object.entries(systemInfo.mathConstants).map(([k, v]) => [
            normalizeStringValue(k),
            reliableRound(Number(v), 3)
          ])
        )
      : getFallbackValue('mathConstants', null, FallbackReason.MISSING_PROPERTY),

    // Enhanced plugin filtering and normalization
    plugins: systemInfo.plugins && systemInfo.plugins.length > 0
      ? normalizeArrayValue(
          systemInfo.plugins
            .filter(p => p && p.name && !p.name.includes('Brave'))
            .map(p => ({
              name: normalizeStringValue(p.name || ''),
              types: normalizeArrayValue(p.mimeTypes?.map(mt => mt.type) || [])
            }))
        )
      : getFallbackValue('plugins', null, FallbackReason.MISSING_PROPERTY)
  };
}

/**
 * Normalizes the entire system info object using enhanced normalization utilities
 */
function normalizeSystemInfo(stableInfo: any, debugMode: boolean = false): any {
  if (debugMode) {
    return normalizeValue(stableInfo, 'systemInfo');
  }
  return normalizeValue(stableInfo);
}

/**
 * Enhanced replacer function for JSON serialization with improved normalization.
 * Handles edge cases and provides consistent formatting across different environments.
 *
 * @param key - The property key being processed.
 * @param value - The property value to normalize.
 * @returns The normalized value for serialization.
 */
function enhancedReplacer(key: string, value: any): any {
  // Handle special cases first
  if (value instanceof ArrayBuffer) return '';
  if (value === null) return null;
  if (value === undefined) return null; // Convert undefined to null for consistency
  
  // Handle different data types with enhanced normalization
  if (typeof value === 'number') {
    return reliableRound(value, 3);
  }
  
  if (typeof value === 'string') {
    return normalizeStringValue(value);
  }
  
  // Arrays and objects are handled by the normalization utilities before this point
  return value;
}

/**
 * Legacy replacer function maintained for backward compatibility.
 * @deprecated Use enhancedReplacer for new implementations
 */
function replacer(key: string, value: any) {
  if (value instanceof ArrayBuffer) return '';
  // Keep the string representation from reliableRound to maintain precision consistency
  if (typeof value === 'number') return reliableRound(value, 3);
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim();
  return value;
}

/**
 * Enhanced recursive sorting function that produces deterministically ordered structures.
 * Uses improved comparison logic for better consistency across different environments.
 *
 * Arrays are sorted using deterministic comparison, and objects have their keys sorted 
 * alphabetically with values recursively processed. Primitive values are returned as-is.
 *
 * @param obj - The object or array to recursively sort
 * @returns A new object or array with all keys and elements sorted deterministically
 */
function deepSortObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj
      .map(deepSortObject)
      .sort((a, b) => {
        // Enhanced comparison for better deterministic sorting
        const strA = typeof a === 'object' ? JSON.stringify(a) : String(a);
        const strB = typeof b === 'object' ? JSON.stringify(b) : String(b);
        
        // Use locale-independent comparison for consistency
        return strA < strB ? -1 : strA > strB ? 1 : 0;
      });
  }
  
  if (obj && typeof obj === 'object' && obj !== null) {
    const sortedKeys = Object.keys(obj).sort();
    const result: Record<string, any> = {};
    
    for (const key of sortedKeys) {
      result[key] = deepSortObject(obj[key]);
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Legacy deepSortObject function maintained for backward compatibility.
 * @deprecated Use the enhanced version above for new implementations
 */
function legacyDeepSortObject(obj: Record<string, any>): any {
  if (Array.isArray(obj)) {
    return obj
      .map(legacyDeepSortObject)
      .sort((a, b) => {
        const strA = JSON.stringify(a); 
        const strB = JSON.stringify(b);
        return strA.localeCompare(strB);
      });
  }
  
  if (obj && typeof obj === 'object' && obj !== null) {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = legacyDeepSortObject(obj[key]);
        return acc;
      }, {} as Record<string, any>);
  }
  
  return obj;
}
