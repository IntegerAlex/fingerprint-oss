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
 * Enhanced normalization utilities for predictable fingerprint hash generation.
 * These utilities ensure consistent data formatting across different environments and browser states.
 */

import { getDebugLogger, NormalizationStepType } from './debug';

/**
 * Rounds a numeric value to a specified decimal precision with consistent string formatting.
 * Handles edge cases like NaN, Infinity, and very large/small numbers.
 * 
 * @param value - The number to round
 * @param precision - The number of decimal places to round to (default: 3)
 * @param property - Optional property name for debug logging
 * @returns The rounded value as a string with fixed decimal places
 */
export function reliableRound(value: number, precision: number = 3, property?: string): string {
  const originalValue = value;
  
  // Handle edge cases
  if (!isFinite(value)) {
    const result = isNaN(value) ? 'NaN' : (value > 0 ? 'Infinity' : '-Infinity');
    
    // Log the normalization step if property is provided
    if (property) {
      const debugLogger = getDebugLogger();
      debugLogger.logNormalizationStep(
        NormalizationStepType.NUMERIC_ROUND,
        property,
        originalValue,
        result,
        { precision, reason: 'edge_case' }
      );
    }
    
    return result;
  }
  
  // Clamp precision to reasonable bounds
  const clampedPrecision = Math.max(0, Math.min(precision, 10));
  
  // Use consistent rounding approach that handles negative numbers correctly
  const multiplier = Math.pow(10, clampedPrecision);
  // For negative numbers, we need to handle the epsilon differently
  const epsilon = value >= 0 ? Number.EPSILON : -Number.EPSILON;
  const roundedValue = Math.round((value + epsilon) * multiplier) / multiplier;
  
  // Return with fixed decimal places for consistency
  const result = roundedValue.toFixed(clampedPrecision);
  
  // Log the normalization step if property is provided
  if (property) {
    const debugLogger = getDebugLogger();
    debugLogger.logNormalizationStep(
      NormalizationStepType.NUMERIC_ROUND,
      property,
      originalValue,
      result,
      { precision: clampedPrecision, multiplier }
    );
  }
  
  return result;
}

/**
 * Normalizes string values with consistent whitespace and encoding handling.
 * Removes extra whitespace, trims, and handles special characters consistently.
 * 
 * @param value - The string to normalize
 * @param property - Optional property name for debug logging
 * @returns The normalized string
 */
export function normalizeStringValue(value: string, property?: string): string {
  const originalValue = value;
  
  if (typeof value !== 'string') {
    const result = String(value);
    
    // Log the normalization step if property is provided
    if (property) {
      const debugLogger = getDebugLogger();
      debugLogger.logNormalizationStep(
        NormalizationStepType.STRING_NORMALIZE,
        property,
        originalValue,
        result,
        { reason: 'type_conversion' }
      );
    }
    
    return result;
  }
  
  const result = value
    // Normalize Unicode to composed form (NFC)
    .normalize('NFC')
    // Replace multiple whitespace characters with single space
    .replace(/\s+/g, ' ')
    // Trim leading and trailing whitespace
    .trim()
    // Remove zero-width characters that could cause inconsistencies
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Log the normalization step if property is provided
  if (property) {
    const debugLogger = getDebugLogger();
    debugLogger.logNormalizationStep(
      NormalizationStepType.STRING_NORMALIZE,
      property,
      originalValue,
      result,
      { 
        operations: ['normalize_unicode', 'collapse_whitespace', 'trim', 'remove_zero_width'],
        lengthBefore: originalValue.length,
        lengthAfter: result.length
      }
    );
  }
  
  return result;
}

/**
 * Normalizes array values with deterministic sorting algorithms.
 * Ensures consistent ordering regardless of input order.
 * 
 * @param array - The array to normalize
 * @param property - Optional property name for debug logging
 * @returns The normalized and sorted array
 */
export function normalizeArrayValue(array: any[], property?: string): any[] {
  const originalArray = array;
  
  if (!Array.isArray(array)) {
    const result: any[] = [];
    
    // Log the normalization step if property is provided
    if (property) {
      const debugLogger = getDebugLogger();
      debugLogger.logNormalizationStep(
        NormalizationStepType.ARRAY_SORT,
        property,
        originalArray,
        result,
        { reason: 'not_array', originalType: typeof array }
      );
    }
    
    return result;
  }
  
  // Early return for empty arrays to optimize performance
  if (array.length === 0) {
    // Log the normalization step if property is provided
    if (property) {
      const debugLogger = getDebugLogger();
      debugLogger.logNormalizationStep(
        NormalizationStepType.ARRAY_SORT,
        property,
        originalArray,
        array,
        { reason: 'empty_array' }
      );
    }
    
    return [];
  }
  
  // Optimize for arrays with only primitive types (common case)
  const hasOnlyPrimitives = array.every(item => 
    typeof item === 'string' || typeof item === 'number' || item === null || item === undefined
  );
  
  let result: any[];
  let metadata: Record<string, any> = {
    originalLength: array.length,
    hasOnlyPrimitives,
    itemTypes: [...new Set(array.map(item => typeof item))]
  };
  
  if (hasOnlyPrimitives) {
    result = array
      .map((item, index) => {
        if (typeof item === 'string') {
          return normalizeStringValue(item, property ? `${property}[${index}]` : undefined);
        } else if (typeof item === 'number') {
          return reliableRound(item, 3, property ? `${property}[${index}]` : undefined);
        }
        return item;
      })
      .sort((a, b) => {
        const strA = String(a);
        const strB = String(b);
        return strA < strB ? -1 : strA > strB ? 1 : 0;
      });
    
    metadata.normalizationPath = 'primitive_optimization';
  } else {
    // Full normalization for complex arrays
    const normalizedArray = array.map((item, index) => {
      if (typeof item === 'string') {
        return normalizeStringValue(item, property ? `${property}[${index}]` : undefined);
      } else if (typeof item === 'number') {
        return reliableRound(item, 3, property ? `${property}[${index}]` : undefined);
      } else if (Array.isArray(item)) {
        return normalizeArrayValue(item, property ? `${property}[${index}]` : undefined);
      } else if (item && typeof item === 'object') {
        return normalizeObjectValue(item, property ? `${property}[${index}]` : undefined);
      }
      return item;
    });
    
    // Sort using deterministic comparison
    result = normalizedArray.sort((a, b) => {
      // Convert to strings for consistent comparison
      const strA = typeof a === 'object' ? JSON.stringify(a) : String(a);
      const strB = typeof b === 'object' ? JSON.stringify(b) : String(b);
      
      // Use locale-independent comparison
      return strA < strB ? -1 : strA > strB ? 1 : 0;
    });
    
    metadata.normalizationPath = 'full_normalization';
  }
  
  metadata.resultLength = result.length;
  
  // Log the normalization step if property is provided
  if (property) {
    const debugLogger = getDebugLogger();
    debugLogger.logNormalizationStep(
      NormalizationStepType.ARRAY_SORT,
      property,
      originalArray,
      result,
      metadata
    );
  }
  
  return result;
}

/**
 * Normalizes object values with consistent key ordering and value normalization.
 * Recursively processes nested objects and arrays.
 * 
 * @param obj - The object to normalize
 * @param property - Optional property name for debug logging
 * @returns The normalized object with sorted keys
 */
export function normalizeObjectValue(obj: Record<string, any>, property?: string): Record<string, any> {
  const originalObj = obj;
  
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    const result = {};
    
    // Log the normalization step if property is provided
    if (property) {
      const debugLogger = getDebugLogger();
      debugLogger.logNormalizationStep(
        NormalizationStepType.OBJECT_KEY_SORT,
        property,
        originalObj,
        result,
        { reason: 'invalid_object', originalType: typeof obj, isArray: Array.isArray(obj) }
      );
    }
    
    return result;
  }
  
  const keys = Object.keys(obj);
  
  // Early return for empty objects to optimize performance
  if (keys.length === 0) {
    // Log the normalization step if property is provided
    if (property) {
      const debugLogger = getDebugLogger();
      debugLogger.logNormalizationStep(
        NormalizationStepType.OBJECT_KEY_SORT,
        property,
        originalObj,
        obj,
        { reason: 'empty_object' }
      );
    }
    
    return {};
  }
  
  const normalizedObj: Record<string, any> = {};
  
  // Sort keys alphabetically for consistent ordering
  const sortedKeys = keys.sort();
  
  // Optimize for objects with only primitive values (common case)
  const hasOnlyPrimitives = sortedKeys.every(key => {
    const value = obj[key];
    return typeof value === 'string' || typeof value === 'number' || 
           value === null || value === undefined || typeof value === 'boolean';
  });
  
  let metadata: Record<string, any> = {
    originalKeyCount: keys.length,
    hasOnlyPrimitives,
    keyTypes: [...new Set(sortedKeys.map(key => typeof obj[key]))],
    keysReordered: !keys.every((key, index) => key === sortedKeys[index])
  };
  
  if (hasOnlyPrimitives) {
    for (const key of sortedKeys) {
      const value = obj[key];
      const normalizedKey = normalizeStringValue(key, property ? `${property}.${key}` : undefined);
      
      if (typeof value === 'string') {
        normalizedObj[normalizedKey] = normalizeStringValue(value, property ? `${property}.${key}` : undefined);
      } else if (typeof value === 'number') {
        normalizedObj[normalizedKey] = reliableRound(value, 3, property ? `${property}.${key}` : undefined);
      } else {
        normalizedObj[normalizedKey] = value;
      }
    }
    
    metadata.normalizationPath = 'primitive_optimization';
  } else {
    // Full normalization for complex objects
    for (const key of sortedKeys) {
      const value = obj[key];
      const normalizedKey = normalizeStringValue(key, property ? `${property}.${key}` : undefined);
      
      if (typeof value === 'string') {
        normalizedObj[normalizedKey] = normalizeStringValue(value, property ? `${property}.${key}` : undefined);
      } else if (typeof value === 'number') {
        normalizedObj[normalizedKey] = reliableRound(value, 3, property ? `${property}.${key}` : undefined);
      } else if (Array.isArray(value)) {
        normalizedObj[normalizedKey] = normalizeArrayValue(value, property ? `${property}.${key}` : undefined);
      } else if (value && typeof value === 'object') {
        normalizedObj[normalizedKey] = normalizeObjectValue(value, property ? `${property}.${key}` : undefined);
      } else {
        normalizedObj[normalizedKey] = value;
      }
    }
    
    metadata.normalizationPath = 'full_normalization';
  }
  
  metadata.resultKeyCount = Object.keys(normalizedObj).length;
  
  // Log the normalization step if property is provided
  if (property) {
    const debugLogger = getDebugLogger();
    debugLogger.logNormalizationStep(
      NormalizationStepType.OBJECT_KEY_SORT,
      property,
      originalObj,
      normalizedObj,
      metadata
    );
  }
  
  return normalizedObj;
}

/**
 * Comprehensive normalization function that handles any data type.
 * This is the main entry point for normalizing system information.
 * 
 * @param value - The value to normalize (can be any type)
 * @param property - Optional property name for debug logging
 * @returns The normalized value
 */
export function normalizeValue(value: any, property?: string): any {
  if (typeof value === 'string') {
    return normalizeStringValue(value, property);
  } else if (typeof value === 'number') {
    return reliableRound(value, 3, property);
  } else if (Array.isArray(value)) {
    return normalizeArrayValue(value, property);
  } else if (value && typeof value === 'object') {
    return normalizeObjectValue(value, property);
  }
  
  return value;
}