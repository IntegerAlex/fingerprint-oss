/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

import { SystemInfo } from './types';
import { FallbackReason, FallbackResult, FallbackManager } from './fallback';

/**
 * Categories of errors that can occur during system info collection
 */
export enum ErrorCategory {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  MALFORMED_DATA = 'malformed_data',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

/**
 * Configuration for error handling behavior
 */
export interface ErrorHandlerConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  enableExponentialBackoff: boolean;
  temporaryFailureTimeout: number;
}

/**
 * Default configuration for error handling
 */
export const DEFAULT_ERROR_CONFIG: ErrorHandlerConfig = {
  maxRetries: 3,
  baseRetryDelay: 100, // milliseconds
  maxRetryDelay: 2000, // milliseconds
  enableExponentialBackoff: true,
  temporaryFailureTimeout: 5000 // milliseconds
};

/**
 * Information about an error and its handling
 */
export interface ErrorInfo {
  error: Error;
  category: ErrorCategory;
  property: keyof SystemInfo;
  attemptCount: number;
  shouldRetry: boolean;
  retryDelay?: number;
  fallbackReason: FallbackReason;
}

/**
 * Result of error handling operation
 */
export interface ErrorHandlingResult {
  success: boolean;
  value?: any;
  fallbackResult?: FallbackResult;
  errorInfo: ErrorInfo;
  retryAfter?: number;
}

/**
 * Enhanced error handler for system info collection with categorization and retry logic
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private fallbackManager: FallbackManager;
  private errorHistory: Map<string, ErrorInfo[]>;

  constructor(config: Partial<ErrorHandlerConfig> = {}, fallbackManager?: FallbackManager) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    this.fallbackManager = fallbackManager || new FallbackManager();
    this.errorHistory = new Map();
  }

  /**
   * Handles an error that occurred during system info collection
   * @param error - The error that occurred
   * @param property - The SystemInfo property that failed
   * @param attemptCount - Current attempt number (1-based)
   * @param originalValue - The original value that caused the error
   * @returns ErrorHandlingResult with handling decision and fallback if needed
   */
  handleSystemInfoError(
    error: Error, 
    property: keyof SystemInfo, 
    attemptCount: number = 1,
    originalValue?: any
  ): ErrorHandlingResult {
    const category = this.categorizeError(error);
    const shouldRetry = this.shouldRetry(error, attemptCount);
    const fallbackReason = this.mapCategoryToFallbackReason(category);
    
    const errorInfo: ErrorInfo = {
      error,
      category,
      property,
      attemptCount,
      shouldRetry,
      fallbackReason
    };

    // Calculate retry delay if retry is recommended
    if (shouldRetry) {
      errorInfo.retryDelay = this.calculateRetryDelay(attemptCount);
    }

    // Track error history
    this.trackError(property, errorInfo);

    // For permanent failures or max retries reached, use fallback
    if (!shouldRetry || attemptCount >= this.config.maxRetries) {
      const fallbackResult = this.fallbackManager.getFallbackValue(
        property, 
        fallbackReason, 
        originalValue
      );

      return {
        success: false,
        fallbackResult,
        errorInfo
      };
    }

    // For temporary failures within retry limit, suggest retry
    return {
      success: false,
      errorInfo,
      retryAfter: errorInfo.retryDelay
    };
  }

  /**
   * Categorizes an error based on its characteristics
   * @param error - The error to categorize
   * @returns ErrorCategory representing the type of error
   */
  categorizeError(error: Error): ErrorCategory {
    const message = (error.message || '').toLowerCase();
    const name = (error.name || '').toLowerCase();

    // Security-related errors
    if (this.isSecurityError(error)) {
      return ErrorCategory.SECURITY;
    }

    // Malformed data errors
    if (this.isMalformedDataError(error)) {
      return ErrorCategory.MALFORMED_DATA;
    }

    // Temporary failure patterns
    if (this.isTemporaryError(error)) {
      return ErrorCategory.TEMPORARY;
    }

    // Permanent failure patterns
    if (this.isPermanentError(error)) {
      return ErrorCategory.PERMANENT;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determines if an error should be retried based on category and attempt count
   * @param error - The error that occurred
   * @param attemptCount - Current attempt number (1-based)
   * @returns true if the error should be retried
   */
  shouldRetry(error: Error, attemptCount: number): boolean {
    // Don't retry if we've exceeded the max retry limit
    // maxRetries represents the maximum number of retry attempts allowed
    // So if maxRetries is 3, we can make attempts 1, 2, 3, and 4 (original + 3 retries)
    if (attemptCount > this.config.maxRetries) {
      return false;
    }

    const category = this.categorizeError(error);

    // Only retry temporary failures
    if (category === ErrorCategory.TEMPORARY) {
      return true;
    }

    // Don't retry permanent failures, malformed data, or security errors
    return false;
  }

  /**
   * Calculates the delay before the next retry attempt
   * @param attemptCount - Current attempt number
   * @returns Delay in milliseconds
   */
  calculateRetryDelay(attemptCount: number): number {
    if (!this.config.enableExponentialBackoff) {
      return this.config.baseRetryDelay;
    }

    // Exponential backoff: baseDelay * 2^(attempt-1)
    const delay = this.config.baseRetryDelay * Math.pow(2, attemptCount - 1);
    
    // Cap at maximum delay
    return Math.min(delay, this.config.maxRetryDelay);
  }

  /**
   * Checks if an error is security-related
   * @param error - The error to check
   * @returns true if the error is security-related
   */
  private isSecurityError(error: Error): boolean {
    const securityPatterns = [
      /security/i,
      /permission/i,
      /access.*denied/i,
      /blocked/i,
      /cors/i,
      /cross.origin/i,
      /unauthorized/i,
      /forbidden/i
    ];

    const message = (error.message || '').toLowerCase();
    return securityPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Checks if an error is due to malformed data
   * @param error - The error to check
   * @returns true if the error is due to malformed data
   */
  private isMalformedDataError(error: Error): boolean {
    const malformedPatterns = [
      /invalid/i,
      /malformed/i,
      /parse.*error/i,
      /syntax.*error/i,
      /unexpected.*token/i,
      /json/i,
      /format/i,
      /corrupt/i
    ];

    const message = (error.message || '').toLowerCase();
    const name = (error.name || '').toLowerCase();
    
    return malformedPatterns.some(pattern => 
      pattern.test(message) || pattern.test(name)
    ) || error instanceof SyntaxError;
  }

  /**
   * Checks if an error represents a temporary failure
   * @param error - The error to check
   * @returns true if the error is likely temporary
   */
  private isTemporaryError(error: Error): boolean {
    const temporaryPatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /temporary/i,
      /unavailable/i,
      /busy/i,
      /retry/i,
      /rate.*limit/i,
      /throttle/i,
      /overload/i
    ];

    const message = (error.message || '').toLowerCase();
    return temporaryPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Checks if an error represents a permanent failure
   * @param error - The error to check
   * @returns true if the error is likely permanent
   */
  private isPermanentError(error: Error): boolean {
    const permanentPatterns = [
      /not.*supported/i,
      /not.*implemented/i,
      /not.*available/i,
      /not.*found/i,
      /missing/i,
      /undefined.*method/i,
      /undefined.*property/i,
      /feature.*disabled/i,
      /api.*disabled/i
    ];

    const message = (error.message || '').toLowerCase();
    const name = (error.name || '').toLowerCase();
    
    return permanentPatterns.some(pattern => 
      pattern.test(message) || pattern.test(name)
    ) || error instanceof ReferenceError || error instanceof TypeError;
  }

  /**
   * Maps error category to appropriate fallback reason
   * @param category - The error category
   * @returns Corresponding FallbackReason
   */
  private mapCategoryToFallbackReason(category: ErrorCategory): FallbackReason {
    switch (category) {
      case ErrorCategory.TEMPORARY:
        return FallbackReason.TEMPORARY_FAILURE;
      case ErrorCategory.PERMANENT:
        return FallbackReason.PERMANENT_FAILURE;
      case ErrorCategory.MALFORMED_DATA:
        return FallbackReason.MALFORMED_DATA;
      case ErrorCategory.SECURITY:
        return FallbackReason.VALIDATION_FAILED;
      default:
        return FallbackReason.PERMANENT_FAILURE;
    }
  }

  /**
   * Tracks error occurrence for debugging and analysis
   * @param property - The property that failed
   * @param errorInfo - Information about the error
   */
  private trackError(property: keyof SystemInfo, errorInfo: ErrorInfo): void {
    const propertyKey = property as string;
    
    if (!this.errorHistory.has(propertyKey)) {
      this.errorHistory.set(propertyKey, []);
    }
    
    this.errorHistory.get(propertyKey)!.push({
      ...errorInfo,
      // Add timestamp for tracking
      error: new Error(`${errorInfo.error.message} [${new Date().toISOString()}]`)
    });
  }

  /**
   * Gets error history for a specific property
   * @param property - The property to get error history for
   * @returns Array of ErrorInfo entries
   */
  getErrorHistory(property: keyof SystemInfo): ErrorInfo[] {
    return this.errorHistory.get(property as string) || [];
  }

  /**
   * Gets all properties that have experienced errors
   * @returns Array of property names with error history
   */
  getPropertiesWithErrors(): string[] {
    return Array.from(this.errorHistory.keys());
  }

  /**
   * Clears error history
   */
  clearErrorHistory(): void {
    this.errorHistory.clear();
  }

  /**
   * Gets statistics about error patterns
   * @returns Object with error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsByProperty: Record<string, number>;
    retrySuccessRate: number;
  } {
    let totalErrors = 0;
    const errorsByCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.TEMPORARY]: 0,
      [ErrorCategory.PERMANENT]: 0,
      [ErrorCategory.MALFORMED_DATA]: 0,
      [ErrorCategory.SECURITY]: 0,
      [ErrorCategory.UNKNOWN]: 0
    };
    const errorsByProperty: Record<string, number> = {};
    let totalRetries = 0;
    let successfulRetries = 0;

    for (const [property, errors] of this.errorHistory.entries()) {
      errorsByProperty[property] = errors.length;
      
      for (const errorInfo of errors) {
        totalErrors++;
        errorsByCategory[errorInfo.category]++;
        
        if (errorInfo.attemptCount > 1) {
          totalRetries++;
          // Consider it successful if it was retried (implies previous attempt failed)
          if (errorInfo.shouldRetry) {
            successfulRetries++;
          }
        }
      }
    }

    return {
      totalErrors,
      errorsByCategory,
      errorsByProperty,
      retrySuccessRate: totalRetries > 0 ? successfulRetries / totalRetries : 0
    };
  }
}

/**
 * Default error handler instance for general use
 */
export const defaultErrorHandler = new ErrorHandler();