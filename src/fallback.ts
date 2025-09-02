/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo } from './types';

/**
 * Enum defining the reasons why fallback values are used
 */
export enum FallbackReason {
  TEMPORARY_FAILURE = 'temporary_failure',
  PERMANENT_FAILURE = 'permanent_failure',
  MALFORMED_DATA = 'malformed_data',
  MISSING_PROPERTY = 'missing_property',
  VALIDATION_FAILED = 'validation_failed'
}

/**
 * Enum defining error categories for better error handling
 */
export enum ErrorCategory {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  MALFORMED = 'malformed',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCategory[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorCategory.TEMPORARY]
};

/**
 * Interface defining fallback values for all SystemInfo properties
 */
export interface SystemInfoFallbacks {
  incognito: { isPrivate: boolean; browserName: string };
  bot: {
    isBot: boolean;
    signals: string[];
    confidence: number;
  };
  userAgent: string;
  platform: string;
  languages: string[];
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  screenResolution: [number, number];
  colorDepth: number;
  colorGamut: string;
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  os: { os: string; version: string };
  audio: number | null;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webGL: WebGLInfo;
  canvas: CanvasInfo;
  plugins: PluginInfo[];
  timezone: string;
  touchSupport: {
    maxTouchPoints: number;
    touchEvent: boolean;
    touchStart: boolean;
  };
  vendor: string;
  vendorFlavors: string[];
  mathConstants: MathInfo;
  fontPreferences: FontPreferencesInfo;
  confidenceScore: number;
}

/**
 * Default fallback constants for consistent fallback value generation
 */
export const CONSISTENT_FALLBACKS: SystemInfoFallbacks = {
  incognito: { isPrivate: false, browserName: 'incognito_unavailable_v2' },
  bot: {
    isBot: false,
    signals: ['bot_signals_unavailable_v2'],
    confidence: 0
  },
  userAgent: 'ua_unavailable_v2',
  platform: 'platform_unavailable_v2',
  languages: ['lang_unavailable_v2'],
  cookiesEnabled: false,
  doNotTrack: null,
  screenResolution: [0, 0],
  colorDepth: 0,
  colorGamut: 'gamut_unavailable_v2',
  hardwareConcurrency: 0,
  deviceMemory: undefined,
  os: { os: 'os_unavailable_v2', version: 'version_unavailable_v2' },
  audio: null,
  localStorage: false,
  sessionStorage: false,
  indexedDB: false,
  webGL: {
    vendor: 'webgl_vendor_unavailable_v2',
    renderer: 'webgl_renderer_unavailable_v2',
    imageHash: 'webgl_hash_unavailable_v2'
  },
  canvas: {
    winding: false,
    geometry: 'canvas_geo_unavailable_v2',
    text: 'canvas_text_unavailable_v2'
  },
  plugins: [],
  timezone: 'timezone_unavailable_v2',
  touchSupport: {
    maxTouchPoints: 0,
    touchEvent: false,
    touchStart: false
  },
  vendor: 'vendor_unavailable_v2',
  vendorFlavors: ['vendor_flavor_unavailable_v2'],
  mathConstants: {
    acos: 0,
    acosh: 0,
    asinh: 0,
    atanh: 0,
    expm1: 0,
    sinh: 0,
    cosh: 0,
    tanh: 0
  },
  fontPreferences: {
    detectedFonts: ['no_fonts_detected_v2']
  },
  confidenceScore: 0.1
};

/**
 * Information about why a fallback value was used
 */
export interface FallbackInfo {
  property: string;
  reason: FallbackReason;
  originalValue: any;
  fallbackValue: any;
  timestamp: number;
}

/**
 * Result of a fallback value generation
 */
export interface FallbackResult {
  value: any;
  info: FallbackInfo;
}

/**
 * Manages consistent fallback values for SystemInfo properties
 */
export class FallbackManager {
  private customFallbacks: Partial<SystemInfoFallbacks>;
  private fallbackHistory: Map<string, FallbackInfo[]>;
  private retryConfig: RetryConfig;
  private errorHistory: Map<string, Array<{ error: Error; category: ErrorCategory; timestamp: number }>>;

  constructor(customFallbacks: Partial<SystemInfoFallbacks> = {}, retryConfig: Partial<RetryConfig> = {}) {
    this.customFallbacks = customFallbacks;
    this.fallbackHistory = new Map();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.errorHistory = new Map();
  }

  /**
   * Gets a fallback value for a specific SystemInfo property
   * @param property - The property name that needs a fallback value
   * @param reason - The reason why a fallback is needed
   * @param originalValue - The original value that failed or was missing
   * @returns FallbackResult containing the fallback value and metadata
   */
  getFallbackValue(property: keyof SystemInfo, reason: FallbackReason, originalValue?: any): FallbackResult {
    const fallbackValue = this.generateConsistentFallback(property);
    
    const info: FallbackInfo = {
      property: property as string,
      reason,
      originalValue,
      fallbackValue,
      timestamp: Date.now()
    };

    // Track fallback usage for debugging and consistency verification
    if (!this.fallbackHistory.has(property as string)) {
      this.fallbackHistory.set(property as string, []);
    }
    this.fallbackHistory.get(property as string)!.push(info);

    return {
      value: fallbackValue,
      info
    };
  }

  /**
   * Generates a consistent fallback value for a given property
   * @param property - The SystemInfo property to generate a fallback for
   * @returns The consistent fallback value
   */
  generateConsistentFallback(property: keyof SystemInfo): any {
    // Check if custom fallback is provided
    if (this.customFallbacks[property] !== undefined) {
      return this.customFallbacks[property];
    }

    // Return default consistent fallback
    return CONSISTENT_FALLBACKS[property];
  }

  /**
   * Categorizes an error to determine appropriate handling strategy
   * @param error - The error that occurred
   * @param property - The property that failed
   * @returns ErrorCategory indicating the type of error
   */
  categorizeError(error: Error, property: keyof SystemInfo): ErrorCategory {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Security-related errors
    const securityPatterns = [
      /permission/i,
      /security/i,
      /blocked/i,
      /cors/i,
      /cross-origin/i,
      /unauthorized/i
    ];

    if (securityPatterns.some(pattern => pattern.test(errorMessage) || pattern.test(errorName))) {
      return ErrorCategory.SECURITY;
    }

    // Malformed data errors
    const malformedPatterns = [
      /invalid/i,
      /malformed/i,
      /parse/i,
      /syntax/i,
      /format/i,
      /corrupt/i
    ];

    if (malformedPatterns.some(pattern => pattern.test(errorMessage) || pattern.test(errorName))) {
      return ErrorCategory.MALFORMED;
    }

    // Temporary failure patterns
    const temporaryPatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /temporary/i,
      /unavailable/i,
      /busy/i,
      /retry/i,
      /throttle/i
    ];

    if (temporaryPatterns.some(pattern => pattern.test(errorMessage) || pattern.test(errorName))) {
      return ErrorCategory.TEMPORARY;
    }

    // Permanent failure patterns
    const permanentPatterns = [
      /not supported/i,
      /not implemented/i,
      /not available/i,
      /disabled/i,
      /missing/i,
      /undefined/i
    ];

    if (permanentPatterns.some(pattern => pattern.test(errorMessage) || pattern.test(errorName))) {
      return ErrorCategory.PERMANENT;
    }

    // Property-specific categorization
    const temporaryProneProperties: (keyof SystemInfo)[] = [
      'webGL',
      'canvas',
      'audio',
      'fontPreferences'
    ];

    if (temporaryProneProperties.includes(property)) {
      return ErrorCategory.TEMPORARY;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determines if an error represents a temporary failure that might be retried
   * @param error - The error that occurred
   * @param property - The property that failed
   * @returns true if the failure is likely temporary
   */
  isTemporaryFailure(error: Error, property: keyof SystemInfo): boolean {
    const category = this.categorizeError(error, property);
    return category === ErrorCategory.TEMPORARY;
  }

  /**
   * Determines if an error should be retried based on configuration and error history
   * @param error - The error that occurred
   * @param property - The property that failed
   * @param attemptCount - Current attempt number (1-based)
   * @returns true if the error should be retried
   */
  shouldRetry(error: Error, property: keyof SystemInfo, attemptCount: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attemptCount >= this.retryConfig.maxAttempts) {
      return false;
    }

    const category = this.categorizeError(error, property);
    
    // Track error for analysis (always track, regardless of retry decision)
    this.trackError(error, property, category);
    
    // Only retry errors in the retryable categories
    if (!this.retryConfig.retryableErrors.includes(category)) {
      return false;
    }

    return true;
  }

  /**
   * Calculates the delay before the next retry attempt using exponential backoff
   * @param attemptCount - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  calculateRetryDelay(attemptCount: number): number {
    const delay = this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attemptCount - 1);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Executes a function with retry logic for temporary failures
   * @param fn - The function to execute
   * @param property - The property being processed
   * @param context - Optional context for debugging
   * @returns Promise resolving to the function result or fallback value
   */
  async executeWithRetry<T>(
    fn: () => Promise<T> | T,
    property: keyof SystemInfo,
    context?: string
  ): Promise<T | any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const result = await fn();
        
        // If we succeeded after previous failures, log the recovery
        if (attempt > 1) {
          console.debug(`Property ${property} recovered after ${attempt} attempts${context ? ` (${context})` : ''}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (!this.shouldRetry(lastError, property, attempt)) {
          break;
        }

        // Calculate delay for next attempt
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = this.calculateRetryDelay(attempt);
          console.debug(`Retrying ${property} after ${delay}ms (attempt ${attempt}/${this.retryConfig.maxAttempts})${context ? ` (${context})` : ''}`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed, use fallback
    const category = this.categorizeError(lastError!, property);
    const reason = category === ErrorCategory.TEMPORARY ? FallbackReason.TEMPORARY_FAILURE : FallbackReason.PERMANENT_FAILURE;
    
    console.warn(`All retry attempts failed for ${property}, using fallback. Last error:`, lastError?.message);
    
    const fallbackResult = this.getFallbackValue(property, reason, lastError?.message);
    return fallbackResult.value;
  }

  /**
   * Tracks error occurrences for analysis and debugging
   * @param error - The error that occurred
   * @param property - The property that failed
   * @param category - The categorized error type
   */
  private trackError(error: Error, property: keyof SystemInfo, category: ErrorCategory): void {
    const propertyKey = property as string;
    
    if (!this.errorHistory.has(propertyKey)) {
      this.errorHistory.set(propertyKey, []);
    }
    
    this.errorHistory.get(propertyKey)!.push({
      error,
      category,
      timestamp: Date.now()
    });

    // Keep only recent errors (last 100 per property)
    const errors = this.errorHistory.get(propertyKey)!;
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
    }
  }

  /**
   * Utility function to sleep for a specified duration
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets the fallback history for a specific property
   * @param property - The property to get history for
   * @returns Array of FallbackInfo entries for the property
   */
  getFallbackHistory(property: keyof SystemInfo): FallbackInfo[] {
    return this.fallbackHistory.get(property as string) || [];
  }

  /**
   * Clears the fallback history
   */
  clearHistory(): void {
    this.fallbackHistory.clear();
  }

  /**
   * Gets all properties that have used fallback values
   * @returns Array of property names that have fallback history
   */
  getPropertiesWithFallbacks(): string[] {
    return Array.from(this.fallbackHistory.keys());
  }

  /**
   * Validates that a fallback value is consistent across multiple calls
   * @param property - The property to validate
   * @param expectedValue - The expected fallback value
   * @returns true if the fallback is consistent
   */
  validateFallbackConsistency(property: keyof SystemInfo, expectedValue: any): boolean {
    const generatedValue = this.generateConsistentFallback(property);
    return JSON.stringify(generatedValue) === JSON.stringify(expectedValue);
  }

  /**
   * Gets error history for a specific property
   * @param property - The property to get error history for
   * @returns Array of error entries for the property
   */
  getErrorHistory(property: keyof SystemInfo): Array<{ error: Error; category: ErrorCategory; timestamp: number }> {
    return this.errorHistory.get(property as string) || [];
  }

  /**
   * Gets error statistics for all properties
   * @returns Object containing error statistics by property and category
   */
  getErrorStatistics(): Record<string, Record<ErrorCategory, number>> {
    const stats: Record<string, Record<ErrorCategory, number>> = {};
    
    for (const [property, errors] of this.errorHistory.entries()) {
      stats[property] = {
        [ErrorCategory.TEMPORARY]: 0,
        [ErrorCategory.PERMANENT]: 0,
        [ErrorCategory.MALFORMED]: 0,
        [ErrorCategory.SECURITY]: 0,
        [ErrorCategory.UNKNOWN]: 0
      };
      
      for (const errorEntry of errors) {
        stats[property][errorEntry.category]++;
      }
    }
    
    return stats;
  }

  /**
   * Clears error history for all properties
   */
  clearErrorHistory(): void {
    this.errorHistory.clear();
  }

  /**
   * Gets the current retry configuration
   * @returns Current RetryConfig
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Updates the retry configuration
   * @param newConfig - Partial retry configuration to merge with current config
   */
  updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
  }
}

/**
 * Default instance of FallbackManager for general use
 */
export const defaultFallbackManager = new FallbackManager();