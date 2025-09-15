/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ErrorHandler, 
  ErrorCategory, 
  DEFAULT_ERROR_CONFIG,
  ErrorHandlerConfig 
} from '../../src/errorHandler';
import { FallbackManager, FallbackReason } from '../../src/fallback';
import { SystemInfo } from '../../src/types';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let fallbackManager: FallbackManager;

  beforeEach(() => {
    fallbackManager = new FallbackManager();
    errorHandler = new ErrorHandler({}, fallbackManager);
  });

  describe('categorizeError', () => {
    it('should categorize security errors correctly', () => {
      const securityErrors = [
        new Error('Permission denied'),
        new Error('Access denied to WebGL context'),
        new Error('CORS policy blocked request'),
        new Error('Cross-origin request blocked'),
        new Error('Unauthorized access'),
        new Error('Forbidden operation')
      ];

      securityErrors.forEach(error => {
        expect(errorHandler.categorizeError(error)).toBe(ErrorCategory.SECURITY);
      });
    });

    it('should categorize malformed data errors correctly', () => {
      const malformedErrors = [
        new SyntaxError('Unexpected token'),
        new Error('Invalid JSON format'),
        new Error('Malformed data structure'),
        new Error('Parse error in input'),
        new Error('Corrupt data detected')
      ];

      malformedErrors.forEach(error => {
        expect(errorHandler.categorizeError(error)).toBe(ErrorCategory.MALFORMED_DATA);
      });
    });

    it('should categorize temporary errors correctly', () => {
      const temporaryErrors = [
        new Error('Connection timeout'),
        new Error('Network unavailable'),
        new Error('Service temporarily unavailable'),
        new Error('Rate limit exceeded'),
        new Error('Server overloaded'),
        new Error('Resource busy, retry later')
      ];

      temporaryErrors.forEach(error => {
        expect(errorHandler.categorizeError(error)).toBe(ErrorCategory.TEMPORARY);
      });
    });

    it('should categorize permanent errors correctly', () => {
      const permanentErrors = [
        new ReferenceError('Method not defined'),
        new TypeError('Property undefined'),
        new Error('Feature not supported'),
        new Error('API not implemented'),
        new Error('Method not available'),
        new Error('Feature disabled in browser')
      ];

      permanentErrors.forEach(error => {
        expect(errorHandler.categorizeError(error)).toBe(ErrorCategory.PERMANENT);
      });
    });

    it('should categorize unknown errors as UNKNOWN', () => {
      const unknownError = new Error('Some random error message');
      expect(errorHandler.categorizeError(unknownError)).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('shouldRetry', () => {
    it('should retry temporary errors within max attempts', () => {
      const temporaryError = new Error('Connection timeout');
      
      expect(errorHandler.shouldRetry(temporaryError, 1)).toBe(true);
      expect(errorHandler.shouldRetry(temporaryError, 2)).toBe(true);
      expect(errorHandler.shouldRetry(temporaryError, 3)).toBe(true);
    });

    it('should not retry when max attempts reached', () => {
      const temporaryError = new Error('Connection timeout');
      const config: Partial<ErrorHandlerConfig> = { maxRetries: 3 };
      const handler = new ErrorHandler(config);
      
      expect(handler.shouldRetry(temporaryError, 4)).toBe(false);
      expect(handler.shouldRetry(temporaryError, 5)).toBe(false);
    });

    it('should not retry permanent errors', () => {
      const permanentError = new Error('Feature not supported');
      
      expect(errorHandler.shouldRetry(permanentError, 1)).toBe(false);
      expect(errorHandler.shouldRetry(permanentError, 2)).toBe(false);
    });

    it('should not retry security errors', () => {
      const securityError = new Error('Permission denied');
      
      expect(errorHandler.shouldRetry(securityError, 1)).toBe(false);
    });

    it('should not retry malformed data errors', () => {
      const malformedError = new SyntaxError('Invalid JSON');
      
      expect(errorHandler.shouldRetry(malformedError, 1)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should return base delay when exponential backoff disabled', () => {
      const config: Partial<ErrorHandlerConfig> = {
        baseRetryDelay: 100,
        enableExponentialBackoff: false
      };
      const handler = new ErrorHandler(config);
      
      expect(handler.calculateRetryDelay(1)).toBe(100);
      expect(handler.calculateRetryDelay(2)).toBe(100);
      expect(handler.calculateRetryDelay(3)).toBe(100);
    });

    it('should use exponential backoff when enabled', () => {
      const config: Partial<ErrorHandlerConfig> = {
        baseRetryDelay: 100,
        enableExponentialBackoff: true,
        maxRetryDelay: 2000
      };
      const handler = new ErrorHandler(config);
      
      expect(handler.calculateRetryDelay(1)).toBe(100);  // 100 * 2^0
      expect(handler.calculateRetryDelay(2)).toBe(200);  // 100 * 2^1
      expect(handler.calculateRetryDelay(3)).toBe(400);  // 100 * 2^2
    });

    it('should cap delay at maximum', () => {
      const config: Partial<ErrorHandlerConfig> = {
        baseRetryDelay: 100,
        enableExponentialBackoff: true,
        maxRetryDelay: 300
      };
      const handler = new ErrorHandler(config);
      
      expect(handler.calculateRetryDelay(3)).toBe(300); // Capped at maxRetryDelay
      expect(handler.calculateRetryDelay(4)).toBe(300); // Still capped
    });
  });

  describe('handleSystemInfoError', () => {
    it('should handle temporary error with retry recommendation', () => {
      const error = new Error('Connection timeout');
      const result = errorHandler.handleSystemInfoError(error, 'webGL', 1);
      
      expect(result.success).toBe(false);
      expect(result.errorInfo.category).toBe(ErrorCategory.TEMPORARY);
      expect(result.errorInfo.shouldRetry).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.fallbackResult).toBeUndefined();
    });

    it('should handle permanent error with fallback', () => {
      const error = new Error('Feature not supported');
      const result = errorHandler.handleSystemInfoError(error, 'webGL', 1);
      
      expect(result.success).toBe(false);
      expect(result.errorInfo.category).toBe(ErrorCategory.PERMANENT);
      expect(result.errorInfo.shouldRetry).toBe(false);
      expect(result.fallbackResult).toBeDefined();
      expect(result.fallbackResult!.info.reason).toBe(FallbackReason.PERMANENT_FAILURE);
    });

    it('should use fallback when max retries reached', () => {
      const error = new Error('Connection timeout');
      const config: Partial<ErrorHandlerConfig> = { maxRetries: 2 };
      const handler = new ErrorHandler(config, fallbackManager);
      
      const result = handler.handleSystemInfoError(error, 'webGL', 2);
      
      expect(result.success).toBe(false);
      expect(result.fallbackResult).toBeDefined();
      expect(result.retryAfter).toBeUndefined();
    });

    it('should track error history', () => {
      const error = new Error('Test error');
      errorHandler.handleSystemInfoError(error, 'webGL', 1);
      
      const history = errorHandler.getErrorHistory('webGL');
      expect(history).toHaveLength(1);
      expect(history[0].property).toBe('webGL');
      expect(history[0].attemptCount).toBe(1);
    });

    it('should map error categories to correct fallback reasons', () => {
      const testCases = [
        { error: new Error('Connection timeout'), expectedReason: FallbackReason.TEMPORARY_FAILURE },
        { error: new Error('Feature not supported'), expectedReason: FallbackReason.PERMANENT_FAILURE },
        { error: new SyntaxError('Invalid JSON'), expectedReason: FallbackReason.MALFORMED_DATA },
        { error: new Error('Permission denied'), expectedReason: FallbackReason.VALIDATION_FAILED }
      ];

      testCases.forEach(({ error, expectedReason }) => {
        const result = errorHandler.handleSystemInfoError(error, 'webGL', 1);
        expect(result.errorInfo.fallbackReason).toBe(expectedReason);
      });
    });
  });

  describe('error tracking and statistics', () => {
    beforeEach(() => {
      // Generate some test errors
      errorHandler.handleSystemInfoError(new Error('Connection timeout'), 'webGL', 1);
      errorHandler.handleSystemInfoError(new Error('Feature not supported'), 'canvas', 1);
      errorHandler.handleSystemInfoError(new SyntaxError('Invalid JSON'), 'audio', 1);
      errorHandler.handleSystemInfoError(new Error('Permission denied'), 'fontPreferences', 1);
    });

    it('should track properties with errors', () => {
      const properties = errorHandler.getPropertiesWithErrors();
      expect(properties).toContain('webGL');
      expect(properties).toContain('canvas');
      expect(properties).toContain('audio');
      expect(properties).toContain('fontPreferences');
    });

    it('should provide error statistics', () => {
      const stats = errorHandler.getErrorStatistics();
      
      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByCategory[ErrorCategory.TEMPORARY]).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.PERMANENT]).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.MALFORMED_DATA]).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.SECURITY]).toBe(1);
      expect(stats.errorsByProperty['webGL']).toBe(1);
    });

    it('should clear error history', () => {
      expect(errorHandler.getPropertiesWithErrors()).toHaveLength(4);
      
      errorHandler.clearErrorHistory();
      
      expect(errorHandler.getPropertiesWithErrors()).toHaveLength(0);
      expect(errorHandler.getErrorStatistics().totalErrors).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should use default configuration when none provided', () => {
      const handler = new ErrorHandler();
      
      // Test that default config is applied
      expect(handler.calculateRetryDelay(1)).toBe(DEFAULT_ERROR_CONFIG.baseRetryDelay);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig: Partial<ErrorHandlerConfig> = {
        maxRetries: 5,
        baseRetryDelay: 200
      };
      const handler = new ErrorHandler(customConfig);
      
      // Custom values should be used
      expect(handler.calculateRetryDelay(1)).toBe(200);
      
      // Should not retry after max attempts
      const error = new Error('Connection timeout');
      expect(handler.shouldRetry(error, 6)).toBe(false);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle errors with empty messages', () => {
      const error = new Error('');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should handle null/undefined error messages gracefully', () => {
      const error = new Error();
      error.message = null as any;
      
      expect(() => errorHandler.categorizeError(error)).not.toThrow();
    });

    it('should handle very high attempt counts', () => {
      const error = new Error('Connection timeout');
      const result = errorHandler.handleSystemInfoError(error, 'webGL', 999);
      
      expect(result.errorInfo.shouldRetry).toBe(false);
      expect(result.fallbackResult).toBeDefined();
    });

    it('should handle multiple errors for same property', () => {
      const property: keyof SystemInfo = 'webGL';
      
      errorHandler.handleSystemInfoError(new Error('First error'), property, 1);
      errorHandler.handleSystemInfoError(new Error('Second error'), property, 2);
      errorHandler.handleSystemInfoError(new Error('Third error'), property, 3);
      
      const history = errorHandler.getErrorHistory(property);
      expect(history).toHaveLength(3);
      expect(history[0].attemptCount).toBe(1);
      expect(history[1].attemptCount).toBe(2);
      expect(history[2].attemptCount).toBe(3);
    });
  });

  describe('integration with FallbackManager', () => {
    it('should use custom fallback manager when provided', () => {
      const customFallbacks = {
        webGL: {
          vendor: 'custom_vendor',
          renderer: 'custom_renderer',
          imageHash: 'custom_hash'
        }
      };
      const customFallbackManager = new FallbackManager(customFallbacks);
      const handler = new ErrorHandler({}, customFallbackManager);
      
      const error = new Error('Feature not supported');
      const result = handler.handleSystemInfoError(error, 'webGL', 1);
      
      expect(result.fallbackResult?.value.vendor).toBe('custom_vendor');
    });

    it('should pass correct parameters to fallback manager', () => {
      const error = new Error('Connection timeout');
      const originalValue = { some: 'data' };
      
      const result = errorHandler.handleSystemInfoError(error, 'webGL', 1, originalValue);
      
      if (result.fallbackResult) {
        expect(result.fallbackResult.info.originalValue).toBe(originalValue);
        expect(result.fallbackResult.info.property).toBe('webGL');
        expect(result.fallbackResult.info.reason).toBe(FallbackReason.TEMPORARY_FAILURE);
      }
    });
  });
});