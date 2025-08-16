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
 * Enhanced serialization utilities for deterministic object serialization with normalization.
 * Provides consistent, predictable serialization across different environments and browser states.
 */

import { normalizeValue, reliableRound, normalizeStringValue } from './normalization';

/**
 * Configuration options for serialization behavior
 */
export interface SerializationConfig {
  /** Whether to apply normalization during serialization */
  enableNormalization: boolean;
  /** Whether to sort object keys deterministically */
  sortKeys: boolean;
  /** Whether to sort array elements deterministically */
  sortArrays: boolean;
  /** Maximum depth for recursive serialization (prevents infinite recursion) */
  maxDepth: number;
  /** Whether to include null values in serialization */
  includeNulls: boolean;
  /** Whether to include undefined values (converted to null) */
  includeUndefined: boolean;
  /** Custom replacer function for special value handling */
  customReplacer?: (key: string, value: any) => any;
}

/**
 * Default serialization configuration
 */
export const DEFAULT_SERIALIZATION_CONFIG: SerializationConfig = {
  enableNormalization: true,
  sortKeys: true,
  sortArrays: true,
  maxDepth: 10,
  includeNulls: true,
  includeUndefined: true,
  customReplacer: undefined
};

/**
 * Result of serialization operation
 */
export interface SerializationResult {
  /** The serialized JSON string */
  serialized: string;
  /** The normalized object before serialization */
  normalized: any;
  /** Statistics about the serialization process */
  stats: SerializationStats;
}

/**
 * Statistics collected during serialization
 */
export interface SerializationStats {
  /** Total number of properties processed */
  totalProperties: number;
  /** Number of values that were normalized */
  normalizedValues: number;
  /** Number of arrays that were sorted */
  sortedArrays: number;
  /** Number of objects that had keys sorted */
  sortedObjects: number;
  /** Maximum depth reached during serialization */
  maxDepthReached: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Enhanced serializer class for deterministic object serialization
 */
export class EnhancedSerializer {
  private config: SerializationConfig;
  private stats!: SerializationStats;

  constructor(config: Partial<SerializationConfig> = {}) {
    this.config = { ...DEFAULT_SERIALIZATION_CONFIG, ...config };
    this.resetStats();
  }

  /**
   * Serializes an object with enhanced normalization and deterministic ordering
   * @param obj - The object to serialize
   * @param config - Optional configuration overrides
   * @returns SerializationResult containing the serialized string and metadata
   */
  serialize(obj: any, config?: Partial<SerializationConfig>): SerializationResult {
    const startTime = performance.now();
    this.resetStats();
    
    const effectiveConfig = config ? { ...this.config, ...config } : this.config;
    
    // Step 1: Deep normalize and sort the object
    const normalized = this.deepNormalizeAndSort(obj, effectiveConfig, 0);
    
    // Step 2: Serialize with enhanced replacer
    const serialized = JSON.stringify(normalized, (key, value) => {
      this.stats.totalProperties++;
      
      // Apply custom replacer if provided
      if (effectiveConfig.customReplacer) {
        value = effectiveConfig.customReplacer(key, value);
      }
      
      return this.enhancedReplacer(key, value, effectiveConfig);
    });
    
    const endTime = performance.now();
    this.stats.processingTime = endTime - startTime;
    
    return {
      serialized,
      normalized,
      stats: { ...this.stats }
    };
  }

  /**
   * Serializes an object using the legacy method for comparison
   * @param obj - The object to serialize
   * @returns The serialized JSON string using legacy approach
   */
  serializeLegacy(obj: any): string {
    const sorted = this.legacyDeepSort(obj);
    return JSON.stringify(sorted, this.legacyReplacer);
  }

  /**
   * Compares serialization results between enhanced and legacy methods
   * @param obj - The object to compare serialization for
   * @returns Comparison result showing differences and compatibility
   */
  compareSerializationMethods(obj: any): SerializationComparisonResult {
    const startTime = performance.now();
    
    // Enhanced serialization
    const enhancedResult = this.serialize(obj);
    
    // Legacy serialization
    const legacyStart = performance.now();
    const legacySerialized = this.serializeLegacy(obj);
    const legacyTime = performance.now() - legacyStart;
    
    const totalTime = performance.now() - startTime;
    
    return {
      enhanced: enhancedResult,
      legacy: {
        serialized: legacySerialized,
        processingTime: legacyTime
      },
      comparison: {
        identical: enhancedResult.serialized === legacySerialized,
        lengthDifference: enhancedResult.serialized.length - legacySerialized.length,
        performanceImprovement: legacyTime - enhancedResult.stats.processingTime,
        totalComparisonTime: totalTime
      }
    };
  }

  /**
   * Deep normalizes and sorts an object recursively
   * @param obj - The object to process
   * @param config - Serialization configuration
   * @param depth - Current recursion depth
   * @returns The normalized and sorted object
   */
  private deepNormalizeAndSort(obj: any, config: SerializationConfig, depth: number): any {
    // Prevent infinite recursion
    if (depth > config.maxDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    this.stats.maxDepthReached = Math.max(this.stats.maxDepthReached, depth);

    // Handle null and undefined
    if (obj === null) {
      return config.includeNulls ? null : undefined;
    }
    if (obj === undefined) {
      return config.includeUndefined ? null : undefined;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      let processedArray = obj.map(item => 
        this.deepNormalizeAndSort(item, config, depth + 1)
      );

      // Apply normalization if enabled
      if (config.enableNormalization) {
        processedArray = processedArray.map(item => {
          if (typeof item === 'string' || typeof item === 'number') {
            this.stats.normalizedValues++;
            return normalizeValue(item);
          }
          return item;
        });
      }

      // Sort arrays if enabled
      if (config.sortArrays) {
        this.stats.sortedArrays++;
        processedArray.sort((a, b) => {
          const strA = typeof a === 'object' ? JSON.stringify(a) : String(a);
          const strB = typeof b === 'object' ? JSON.stringify(b) : String(b);
          return strA < strB ? -1 : strA > strB ? 1 : 0;
        });
      }

      return processedArray;
    }

    // Handle objects
    if (obj && typeof obj === 'object') {
      const result: Record<string, any> = {};
      let keys = Object.keys(obj);

      // Sort keys if enabled
      if (config.sortKeys) {
        this.stats.sortedObjects++;
        keys = keys.sort();
      }

      for (const key of keys) {
        const value = obj[key];
        let processedKey = key;
        let processedValue = this.deepNormalizeAndSort(value, config, depth + 1);

        // Apply normalization to key and value if enabled
        if (config.enableNormalization) {
          if (typeof key === 'string') {
            processedKey = normalizeStringValue(key);
            this.stats.normalizedValues++;
          }
          
          if (typeof processedValue === 'string' || typeof processedValue === 'number') {
            processedValue = normalizeValue(processedValue);
            this.stats.normalizedValues++;
          }
        }

        // Only include the property if it meets inclusion criteria
        if (processedValue !== undefined || config.includeUndefined) {
          result[processedKey] = processedValue;
        }
      }

      return result;
    }

    // Handle special cases before normalization
    if (obj instanceof ArrayBuffer) {
      return '';
    }

    // Handle primitive values
    if (config.enableNormalization) {
      if (typeof obj === 'string' || typeof obj === 'number') {
        this.stats.normalizedValues++;
        return normalizeValue(obj);
      }
    }

    return obj;
  }

  /**
   * Enhanced replacer function for JSON serialization
   * @param key - The property key
   * @param value - The property value
   * @param config - Serialization configuration
   * @returns The processed value for serialization
   */
  private enhancedReplacer(key: string, value: any, config: SerializationConfig): any {
    // Handle special cases
    if (value instanceof ArrayBuffer) return '';
    if (value === undefined) return config.includeUndefined ? null : undefined;
    if (value === null) return config.includeNulls ? null : undefined;

    // Handle different data types with enhanced normalization
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        if (isNaN(value)) return 'NaN';
        return value > 0 ? 'Infinity' : '-Infinity';
      }
      return config.enableNormalization ? reliableRound(value, 3) : value;
    }

    if (typeof value === 'string') {
      return config.enableNormalization ? normalizeStringValue(value) : value;
    }

    // Handle functions (convert to string representation)
    if (typeof value === 'function') {
      return '[Function]';
    }

    // Handle symbols
    if (typeof value === 'symbol') {
      return value.toString();
    }

    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }

    return value;
  }

  /**
   * Legacy replacer function for backward compatibility
   * @param key - The property key
   * @param value - The property value
   * @returns The processed value for serialization
   */
  private legacyReplacer(key: string, value: any): any {
    if (value instanceof ArrayBuffer) return '';
    if (typeof value === 'number') return reliableRound(value, 3);
    if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim();
    return value;
  }

  /**
   * Legacy deep sort function for backward compatibility
   * @param obj - The object to sort
   * @returns The sorted object
   */
  private legacyDeepSort(obj: any): any {
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.legacyDeepSort(item))
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
          acc[key] = this.legacyDeepSort(obj[key]);
          return acc;
        }, {} as Record<string, any>);
    }

    return obj;
  }

  /**
   * Resets serialization statistics
   */
  private resetStats(): void {
    this.stats = {
      totalProperties: 0,
      normalizedValues: 0,
      sortedArrays: 0,
      sortedObjects: 0,
      maxDepthReached: 0,
      processingTime: 0
    };
  }

  /**
   * Gets the current serialization configuration
   * @returns Current SerializationConfig
   */
  getConfig(): SerializationConfig {
    return { ...this.config };
  }

  /**
   * Updates the serialization configuration
   * @param newConfig - Partial configuration to merge with current config
   */
  updateConfig(newConfig: Partial<SerializationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Result of comparing serialization methods
 */
export interface SerializationComparisonResult {
  enhanced: SerializationResult;
  legacy: {
    serialized: string;
    processingTime: number;
  };
  comparison: {
    identical: boolean;
    lengthDifference: number;
    performanceImprovement: number;
    totalComparisonTime: number;
  };
}

/**
 * Default instance of EnhancedSerializer for general use
 */
export const defaultSerializer = new EnhancedSerializer();

/**
 * Convenience function for quick serialization with default settings
 * @param obj - The object to serialize
 * @param config - Optional configuration overrides
 * @returns The serialized JSON string
 */
export function serializeWithNormalization(obj: any, config?: Partial<SerializationConfig>): string {
  return defaultSerializer.serialize(obj, config).serialized;
}

/**
 * Convenience function for serialization with detailed results
 * @param obj - The object to serialize
 * @param config - Optional configuration overrides
 * @returns Complete SerializationResult with metadata
 */
export function serializeWithDetails(obj: any, config?: Partial<SerializationConfig>): SerializationResult {
  return defaultSerializer.serialize(obj, config);
}

/**
 * Convenience function for comparing serialization methods
 * @param obj - The object to compare serialization for
 * @returns Comparison result between enhanced and legacy methods
 */
export function compareSerializationMethods(obj: any): SerializationComparisonResult {
  return defaultSerializer.compareSerializationMethods(obj);
}