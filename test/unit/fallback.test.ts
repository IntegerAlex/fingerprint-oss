import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  FallbackManager, 
  FallbackReason, 
  CONSISTENT_FALLBACKS,
  SystemInfoFallbacks,
  defaultFallbackManager,
  ErrorCategory,
  DEFAULT_RETRY_CONFIG,
  RetryConfig
} from '../../src/fallback';
import { SystemInfo } from '../../src/types';

describe('FallbackManager', () => {
  let fallbackManager: FallbackManager;

  beforeEach(() => {
    fallbackManager = new FallbackManager();
  });

  describe('Constructor', () => {
    it('should create instance with default fallbacks', () => {
      expect(fallbackManager).toBeInstanceOf(FallbackManager);
    });

    it('should accept custom fallbacks', () => {
      const customFallbacks: Partial<SystemInfoFallbacks> = {
        userAgent: 'custom_ua',
        platform: 'custom_platform'
      };
      
      const customManager = new FallbackManager(customFallbacks);
      const result = customManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
      
      expect(result.value).toBe('custom_ua');
    });
  });

  describe('getFallbackValue', () => {
    it('should return consistent fallback values for the same property', () => {
      const result1 = fallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
      const result2 = fallbackManager.getFallbackValue('userAgent', FallbackReason.TEMPORARY_FAILURE);
      
      expect(result1.value).toBe(result2.value);
      expect(result1.value).toBe(CONSISTENT_FALLBACKS.userAgent);
    });

    it('should track fallback usage with metadata', () => {
      const originalValue = 'original_ua';
      const result = fallbackManager.getFallbackValue(
        'userAgent', 
        FallbackReason.MALFORMED_DATA, 
        originalValue
      );
      
      expect(result.info.property).toBe('userAgent');
      expect(result.info.reason).toBe(FallbackReason.MALFORMED_DATA);
      expect(result.info.originalValue).toBe(originalValue);
      expect(result.info.fallbackValue).toBe(CONSISTENT_FALLBACKS.userAgent);
      expect(result.info.timestamp).toBeTypeOf('number');
    });

    it('should maintain fallback history', () => {
      fallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
      fallbackManager.getFallbackValue('userAgent', FallbackReason.TEMPORARY_FAILURE);
      
      const history = fallbackManager.getFallbackHistory('userAgent');
      expect(history).toHaveLength(2);
      expect(history[0].reason).toBe(FallbackReason.MISSING_PROPERTY);
      expect(history[1].reason).toBe(FallbackReason.TEMPORARY_FAILURE);
    });

    it('should handle all SystemInfo properties', () => {
      const properties: (keyof SystemInfo)[] = [
        'incognito', 'bot', 'userAgent', 'platform', 'languages', 'cookiesEnabled', 'doNotTrack',
        'screenResolution', 'colorDepth', 'colorGamut', 'hardwareConcurrency',
        'deviceMemory', 'os', 'audio', 'localStorage', 'sessionStorage',
        'indexedDB', 'webGL', 'canvas', 'plugins', 'timezone', 'touchSupport',
        'vendor', 'vendorFlavors', 'mathConstants', 'fontPreferences', 'confidenceScore'
      ];

      properties.forEach(property => {
        const result = fallbackManager.getFallbackValue(property, FallbackReason.MISSING_PROPERTY);
        // deviceMemory can be undefined as it's optional in SystemInfo
        if (property !== 'deviceMemory') {
          expect(result.value).toBeDefined();
        } else {
          expect(result.value).toBeUndefined();
        }
        expect(result.info.property).toBe(property);
      });
    });
  });

  describe('generateConsistentFallback', () => {
    it('should return the same value for multiple calls', () => {
      const value1 = fallbackManager.generateConsistentFallback('userAgent');
      const value2 = fallbackManager.generateConsistentFallback('userAgent');
      
      expect(value1).toBe(value2);
      expect(value1).toBe(CONSISTENT_FALLBACKS.userAgent);
    });

    it('should prefer custom fallbacks over defaults', () => {
      const customFallbacks: Partial<SystemInfoFallbacks> = {
        userAgent: 'custom_ua_value'
      };
      
      const customManager = new FallbackManager(customFallbacks);
      const value = customManager.generateConsistentFallback('userAgent');
      
      expect(value).toBe('custom_ua_value');
    });

    it('should return complex objects consistently', () => {
      const webGLFallback1 = fallbackManager.generateConsistentFallback('webGL');
      const webGLFallback2 = fallbackManager.generateConsistentFallback('webGL');
      
      expect(webGLFallback1).toEqual(webGLFallback2);
      expect(webGLFallback1).toEqual(CONSISTENT_FALLBACKS.webGL);
    });
  });

  describe('isTemporaryFailure', () => {
    it('should identify temporary failures by error message', () => {
      const temporaryErrors = [
        new Error('Connection timeout'),
        new Error('Network unavailable'),
        new Error('Temporary failure'),
        new Error('Service temporarily unavailable')
      ];

      temporaryErrors.forEach(error => {
        const isTemporary = fallbackManager.isTemporaryFailure(error, 'webGL');
        expect(isTemporary).toBe(true);
      });
    });

    it('should identify permanent failures', () => {
      const permanentErrors = [
        new Error('Invalid configuration'),
        new Error('Method not supported'),
        new Error('Permission denied')
      ];

      permanentErrors.forEach(error => {
        const isTemporary = fallbackManager.isTemporaryFailure(error, 'userAgent');
        expect(isTemporary).toBe(false);
      });
    });

    it('should consider certain properties more prone to temporary failures', () => {
      const error = new Error('Generic error');
      
      // Properties prone to temporary failures
      expect(fallbackManager.isTemporaryFailure(error, 'webGL')).toBe(true);
      expect(fallbackManager.isTemporaryFailure(error, 'canvas')).toBe(true);
      expect(fallbackManager.isTemporaryFailure(error, 'audio')).toBe(true);
      expect(fallbackManager.isTemporaryFailure(error, 'fontPreferences')).toBe(true);
      
      // Properties less prone to temporary failures
      expect(fallbackManager.isTemporaryFailure(error, 'userAgent')).toBe(false);
      expect(fallbackManager.isTemporaryFailure(error, 'platform')).toBe(false);
    });
  });

  describe('getFallbackHistory', () => {
    it('should return empty array for properties with no history', () => {
      const history = fallbackManager.getFallbackHistory('userAgent');
      expect(history).toEqual([]);
    });

    it('should return complete history for a property', () => {
      fallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY, 'original1');
      fallbackManager.getFallbackValue('userAgent', FallbackReason.TEMPORARY_FAILURE, 'original2');
      
      const history = fallbackManager.getFallbackHistory('userAgent');
      expect(history).toHaveLength(2);
      expect(history[0].originalValue).toBe('original1');
      expect(history[1].originalValue).toBe('original2');
    });
  });

  describe('clearHistory', () => {
    it('should clear all fallback history', () => {
      fallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
      fallbackManager.getFallbackValue('platform', FallbackReason.TEMPORARY_FAILURE);
      
      expect(fallbackManager.getFallbackHistory('userAgent')).toHaveLength(1);
      expect(fallbackManager.getFallbackHistory('platform')).toHaveLength(1);
      
      fallbackManager.clearHistory();
      
      expect(fallbackManager.getFallbackHistory('userAgent')).toHaveLength(0);
      expect(fallbackManager.getFallbackHistory('platform')).toHaveLength(0);
    });
  });

  describe('getPropertiesWithFallbacks', () => {
    it('should return empty array when no fallbacks used', () => {
      const properties = fallbackManager.getPropertiesWithFallbacks();
      expect(properties).toEqual([]);
    });

    it('should return properties that have used fallbacks', () => {
      fallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
      fallbackManager.getFallbackValue('platform', FallbackReason.TEMPORARY_FAILURE);
      
      const properties = fallbackManager.getPropertiesWithFallbacks();
      expect(properties).toContain('userAgent');
      expect(properties).toContain('platform');
      expect(properties).toHaveLength(2);
    });
  });

  describe('validateFallbackConsistency', () => {
    it('should validate that fallbacks are consistent', () => {
      const expectedValue = CONSISTENT_FALLBACKS.userAgent;
      const isConsistent = fallbackManager.validateFallbackConsistency('userAgent', expectedValue);
      expect(isConsistent).toBe(true);
    });

    it('should detect inconsistent fallbacks', () => {
      const wrongValue = 'wrong_value';
      const isConsistent = fallbackManager.validateFallbackConsistency('userAgent', wrongValue);
      expect(isConsistent).toBe(false);
    });

    it('should validate complex object fallbacks', () => {
      const expectedWebGL = CONSISTENT_FALLBACKS.webGL;
      const isConsistent = fallbackManager.validateFallbackConsistency('webGL', expectedWebGL);
      expect(isConsistent).toBe(true);
      
      const wrongWebGL = { ...expectedWebGL, vendor: 'wrong_vendor' };
      const isInconsistent = fallbackManager.validateFallbackConsistency('webGL', wrongWebGL);
      expect(isInconsistent).toBe(false);
    });
  });
});

describe('CONSISTENT_FALLBACKS', () => {
  it('should have fallbacks for all SystemInfo properties', () => {
    const requiredProperties: (keyof SystemInfo)[] = [
      'incognito', 'bot', 'userAgent', 'platform', 'languages', 'cookiesEnabled', 'doNotTrack',
      'screenResolution', 'colorDepth', 'colorGamut', 'hardwareConcurrency',
      'deviceMemory', 'os', 'audio', 'localStorage', 'sessionStorage',
      'indexedDB', 'webGL', 'canvas', 'plugins', 'timezone', 'touchSupport',
      'vendor', 'vendorFlavors', 'mathConstants', 'fontPreferences', 'confidenceScore'
    ];

    requiredProperties.forEach(property => {
      expect(CONSISTENT_FALLBACKS).toHaveProperty(property);
      // deviceMemory can be undefined as it's optional in SystemInfo
      if (property !== 'deviceMemory') {
        expect(CONSISTENT_FALLBACKS[property]).toBeDefined();
      }
    });
  });

  it('should have consistent string fallbacks with v2 suffix', () => {
    expect(CONSISTENT_FALLBACKS.userAgent).toBe('ua_unavailable_v2');
    expect(CONSISTENT_FALLBACKS.platform).toBe('platform_unavailable_v2');
    expect(CONSISTENT_FALLBACKS.colorGamut).toBe('gamut_unavailable_v2');
    expect(CONSISTENT_FALLBACKS.timezone).toBe('timezone_unavailable_v2');
    expect(CONSISTENT_FALLBACKS.vendor).toBe('vendor_unavailable_v2');
  });

  it('should have proper structure for complex objects', () => {
    expect(CONSISTENT_FALLBACKS.webGL).toEqual({
      vendor: 'webgl_vendor_unavailable_v2',
      renderer: 'webgl_renderer_unavailable_v2',
      imageHash: 'webgl_hash_unavailable_v2'
    });

    expect(CONSISTENT_FALLBACKS.canvas).toEqual({
      winding: false,
      geometry: 'canvas_geo_unavailable_v2',
      text: 'canvas_text_unavailable_v2'
    });

    expect(CONSISTENT_FALLBACKS.touchSupport).toEqual({
      maxTouchPoints: 0,
      touchEvent: false,
      touchStart: false
    });
  });

  it('should have proper array fallbacks', () => {
    expect(CONSISTENT_FALLBACKS.languages).toEqual(['lang_unavailable_v2']);
    expect(CONSISTENT_FALLBACKS.vendorFlavors).toEqual(['vendor_flavor_unavailable_v2']);
    expect(CONSISTENT_FALLBACKS.plugins).toEqual([]);
    expect(CONSISTENT_FALLBACKS.fontPreferences.detectedFonts).toEqual(['no_fonts_detected_v2']);
  });
});

describe('defaultFallbackManager', () => {
  it('should be a singleton instance', () => {
    expect(defaultFallbackManager).toBeInstanceOf(FallbackManager);
  });

  it('should provide consistent fallback values', () => {
    const result1 = defaultFallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
    const result2 = defaultFallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
    
    expect(result1.value).toBe(result2.value);
    expect(result1.value).toBe(CONSISTENT_FALLBACKS.userAgent);
  });
});

describe('FallbackReason enum', () => {
  it('should have all required reason types', () => {
    expect(FallbackReason.TEMPORARY_FAILURE).toBe('temporary_failure');
    expect(FallbackReason.PERMANENT_FAILURE).toBe('permanent_failure');
    expect(FallbackReason.MALFORMED_DATA).toBe('malformed_data');
    expect(FallbackReason.MISSING_PROPERTY).toBe('missing_property');
    expect(FallbackReason.VALIDATION_FAILED).toBe('validation_failed');
  });
});

describe('Error Categorization and Handling', () => {
  let fallbackManager: FallbackManager;

  beforeEach(() => {
    fallbackManager = new FallbackManager();
  });

  describe('categorizeError', () => {
    it('should categorize security errors correctly', () => {
      const securityErrors = [
        new Error('Permission denied'),
        new Error('Security error occurred'),
        new Error('Cross-origin request blocked'),
        new Error('CORS policy violation'),
        new Error('Unauthorized access')
      ];

      securityErrors.forEach(error => {
        const category = fallbackManager.categorizeError(error, 'webGL');
        expect(category).toBe(ErrorCategory.SECURITY);
      });
    });

    it('should categorize malformed data errors correctly', () => {
      const malformedErrors = [
        new Error('Invalid JSON format'),
        new Error('Malformed data structure'),
        new Error('Parse error in input'),
        new Error('Syntax error detected'),
        new Error('Corrupt data received')
      ];

      malformedErrors.forEach(error => {
        const category = fallbackManager.categorizeError(error, 'canvas');
        expect(category).toBe(ErrorCategory.MALFORMED);
      });
    });

    it('should categorize temporary errors correctly', () => {
      const temporaryErrors = [
        new Error('Connection timeout'),
        new Error('Network unavailable'),
        new Error('Service temporarily unavailable'),
        new Error('Server busy, retry later'),
        new Error('Request throttled')
      ];

      temporaryErrors.forEach(error => {
        const category = fallbackManager.categorizeError(error, 'audio');
        expect(category).toBe(ErrorCategory.TEMPORARY);
      });
    });

    it('should categorize permanent errors correctly', () => {
      const permanentErrors = [
        new Error('Feature not supported'),
        new Error('Method not implemented'),
        new Error('API not available'),
        new Error('Service disabled'),
        new Error('Property missing from browser')
      ];

      permanentErrors.forEach(error => {
        const category = fallbackManager.categorizeError(error, 'userAgent');
        expect(category).toBe(ErrorCategory.PERMANENT);
      });
    });

    it('should use property-specific categorization for unknown errors', () => {
      const genericError = new Error('Generic error message');
      
      // Properties prone to temporary failures
      expect(fallbackManager.categorizeError(genericError, 'webGL')).toBe(ErrorCategory.TEMPORARY);
      expect(fallbackManager.categorizeError(genericError, 'canvas')).toBe(ErrorCategory.TEMPORARY);
      expect(fallbackManager.categorizeError(genericError, 'audio')).toBe(ErrorCategory.TEMPORARY);
      expect(fallbackManager.categorizeError(genericError, 'fontPreferences')).toBe(ErrorCategory.TEMPORARY);
      
      // Other properties should be unknown
      expect(fallbackManager.categorizeError(genericError, 'userAgent')).toBe(ErrorCategory.UNKNOWN);
      expect(fallbackManager.categorizeError(genericError, 'platform')).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('shouldRetry', () => {
    it('should not retry if max attempts exceeded', () => {
      const error = new Error('Connection timeout');
      const maxAttempts = fallbackManager.getRetryConfig().maxAttempts;
      
      const shouldRetry = fallbackManager.shouldRetry(error, 'webGL', maxAttempts + 1);
      expect(shouldRetry).toBe(false);
    });

    it('should retry temporary errors within attempt limit', () => {
      const error = new Error('Connection timeout');
      
      const shouldRetry = fallbackManager.shouldRetry(error, 'webGL', 1);
      expect(shouldRetry).toBe(true);
    });

    it('should not retry non-retryable error categories', () => {
      const securityError = new Error('Permission denied');
      const malformedError = new Error('Invalid data format');
      const permanentError = new Error('Feature not supported');
      
      expect(fallbackManager.shouldRetry(securityError, 'webGL', 1)).toBe(false);
      expect(fallbackManager.shouldRetry(malformedError, 'canvas', 1)).toBe(false);
      expect(fallbackManager.shouldRetry(permanentError, 'audio', 1)).toBe(false);
    });

    it('should track errors when determining retry eligibility', () => {
      const error = new Error('Connection timeout');
      
      fallbackManager.shouldRetry(error, 'webGL', 1);
      
      const errorHistory = fallbackManager.getErrorHistory('webGL');
      expect(errorHistory).toHaveLength(1);
      expect(errorHistory[0].error).toBe(error);
      expect(errorHistory[0].category).toBe(ErrorCategory.TEMPORARY);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delays', () => {
      const config = fallbackManager.getRetryConfig();
      
      const delay1 = fallbackManager.calculateRetryDelay(1);
      const delay2 = fallbackManager.calculateRetryDelay(2);
      const delay3 = fallbackManager.calculateRetryDelay(3);
      
      expect(delay1).toBe(config.baseDelayMs);
      expect(delay2).toBe(config.baseDelayMs * config.backoffMultiplier);
      expect(delay3).toBe(config.baseDelayMs * Math.pow(config.backoffMultiplier, 2));
    });

    it('should cap delays at maximum configured value', () => {
      const config = fallbackManager.getRetryConfig();
      
      const largeAttempt = 10;
      const delay = fallbackManager.calculateRetryDelay(largeAttempt);
      
      expect(delay).toBeLessThanOrEqual(config.maxDelayMs);
    });
  });

  describe('executeWithRetry', () => {
    it('should return result on first success', async () => {
      const expectedResult = 'success';
      const mockFn = vi.fn().mockResolvedValue(expectedResult);
      
      const result = await fallbackManager.executeWithRetry(mockFn, 'webGL');
      
      expect(result).toBe(expectedResult);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on temporary failures and eventually succeed', async () => {
      const expectedResult = 'success';
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Network unavailable'))
        .mockResolvedValue(expectedResult);
      
      const result = await fallbackManager.executeWithRetry(mockFn, 'webGL');
      
      expect(result).toBe(expectedResult);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use fallback after all retries fail', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Connection timeout'));
      
      const result = await fallbackManager.executeWithRetry(mockFn, 'webGL');
      
      expect(result).toBe(CONSISTENT_FALLBACKS.webGL);
      expect(mockFn).toHaveBeenCalledTimes(DEFAULT_RETRY_CONFIG.maxAttempts);
    });

    it('should not retry permanent failures', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Feature not supported'));
      
      const result = await fallbackManager.executeWithRetry(mockFn, 'webGL');
      
      expect(result).toBe(CONSISTENT_FALLBACKS.webGL);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle synchronous functions', async () => {
      const expectedResult = 'sync success';
      const mockFn = vi.fn().mockReturnValue(expectedResult);
      
      const result = await fallbackManager.executeWithRetry(mockFn, 'userAgent');
      
      expect(result).toBe(expectedResult);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle synchronous functions that throw', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      
      const result = await fallbackManager.executeWithRetry(mockFn, 'userAgent');
      
      expect(result).toBe(CONSISTENT_FALLBACKS.userAgent);
    });
  });

  describe('error tracking and statistics', () => {
    it('should track error history by property', () => {
      const error1 = new Error('Connection timeout');
      const error2 = new Error('Network unavailable');
      
      fallbackManager.shouldRetry(error1, 'webGL', 1);
      fallbackManager.shouldRetry(error2, 'webGL', 2);
      
      const history = fallbackManager.getErrorHistory('webGL');
      expect(history).toHaveLength(2);
      expect(history[0].error).toBe(error1);
      expect(history[1].error).toBe(error2);
    });

    it('should generate error statistics by category', () => {
      const temporaryError = new Error('Connection timeout');
      const permanentError = new Error('Feature not supported');
      const securityError = new Error('Permission denied');
      
      fallbackManager.shouldRetry(temporaryError, 'webGL', 1);
      fallbackManager.shouldRetry(permanentError, 'webGL', 1);
      fallbackManager.shouldRetry(securityError, 'canvas', 1);
      
      const stats = fallbackManager.getErrorStatistics();
      
      expect(stats.webGL[ErrorCategory.TEMPORARY]).toBe(1);
      expect(stats.webGL[ErrorCategory.PERMANENT]).toBe(1);
      expect(stats.canvas[ErrorCategory.SECURITY]).toBe(1);
    });

    it('should clear error history', () => {
      const error = new Error('Test error');
      fallbackManager.shouldRetry(error, 'webGL', 1);
      
      expect(fallbackManager.getErrorHistory('webGL')).toHaveLength(1);
      
      fallbackManager.clearErrorHistory();
      
      expect(fallbackManager.getErrorHistory('webGL')).toHaveLength(0);
    });

    it('should limit error history size per property', () => {
      const error = new Error('Test error');
      
      // Add more than 100 errors
      for (let i = 0; i < 150; i++) {
        fallbackManager.shouldRetry(error, 'webGL', 1);
      }
      
      const history = fallbackManager.getErrorHistory('webGL');
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('retry configuration', () => {
    it('should use default retry configuration', () => {
      const config = fallbackManager.getRetryConfig();
      
      expect(config.maxAttempts).toBe(DEFAULT_RETRY_CONFIG.maxAttempts);
      expect(config.baseDelayMs).toBe(DEFAULT_RETRY_CONFIG.baseDelayMs);
      expect(config.maxDelayMs).toBe(DEFAULT_RETRY_CONFIG.maxDelayMs);
      expect(config.backoffMultiplier).toBe(DEFAULT_RETRY_CONFIG.backoffMultiplier);
      expect(config.retryableErrors).toEqual(DEFAULT_RETRY_CONFIG.retryableErrors);
    });

    it('should accept custom retry configuration', () => {
      const customConfig: Partial<RetryConfig> = {
        maxAttempts: 5,
        baseDelayMs: 200,
        retryableErrors: [ErrorCategory.TEMPORARY, ErrorCategory.UNKNOWN]
      };
      
      const customManager = new FallbackManager({}, customConfig);
      const config = customManager.getRetryConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.baseDelayMs).toBe(200);
      expect(config.retryableErrors).toEqual([ErrorCategory.TEMPORARY, ErrorCategory.UNKNOWN]);
      expect(config.maxDelayMs).toBe(DEFAULT_RETRY_CONFIG.maxDelayMs); // Should keep default
    });

    it('should update retry configuration', () => {
      const newConfig: Partial<RetryConfig> = {
        maxAttempts: 2,
        baseDelayMs: 50
      };
      
      fallbackManager.updateRetryConfig(newConfig);
      const config = fallbackManager.getRetryConfig();
      
      expect(config.maxAttempts).toBe(2);
      expect(config.baseDelayMs).toBe(50);
      expect(config.backoffMultiplier).toBe(DEFAULT_RETRY_CONFIG.backoffMultiplier); // Should keep existing
    });
  });
});

describe('ErrorCategory enum', () => {
  it('should have all required error categories', () => {
    expect(ErrorCategory.TEMPORARY).toBe('temporary');
    expect(ErrorCategory.PERMANENT).toBe('permanent');
    expect(ErrorCategory.MALFORMED).toBe('malformed');
    expect(ErrorCategory.SECURITY).toBe('security');
    expect(ErrorCategory.UNKNOWN).toBe('unknown');
  });
});

describe('DEFAULT_RETRY_CONFIG', () => {
  it('should have sensible default values', () => {
    expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(100);
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(2000);
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
    expect(DEFAULT_RETRY_CONFIG.retryableErrors).toEqual([ErrorCategory.TEMPORARY]);
  });
});

describe('Fallback Value Consistency', () => {
  let testFallbackManager: FallbackManager;

  beforeEach(() => {
    testFallbackManager = new FallbackManager();
  });

  it('should generate identical fallback values across multiple manager instances', () => {
    const manager1 = new FallbackManager();
    const manager2 = new FallbackManager();
    
    const result1 = manager1.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
    const result2 = manager2.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
    
    expect(result1.value).toBe(result2.value);
  });

  it('should maintain consistency across different reason types', () => {
    const reasons = [
      FallbackReason.TEMPORARY_FAILURE,
      FallbackReason.PERMANENT_FAILURE,
      FallbackReason.MALFORMED_DATA,
      FallbackReason.MISSING_PROPERTY,
      FallbackReason.VALIDATION_FAILED
    ];

    const values = reasons.map(reason => 
      testFallbackManager.getFallbackValue('userAgent', reason).value
    );

    // All values should be identical
    const uniqueValues = [...new Set(values)];
    expect(uniqueValues).toHaveLength(1);
    expect(uniqueValues[0]).toBe(CONSISTENT_FALLBACKS.userAgent);
  });

  it('should maintain consistency over time', async () => {
    const initialValue = testFallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
    
    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const laterValue = testFallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY);
    
    expect(initialValue.value).toBe(laterValue.value);
    expect(initialValue.info.timestamp).not.toBe(laterValue.info.timestamp);
  });

  it('should handle concurrent fallback requests consistently', async () => {
    const promises = Array.from({ length: 10 }, () =>
      Promise.resolve(testFallbackManager.getFallbackValue('userAgent', FallbackReason.MISSING_PROPERTY))
    );

    const results = await Promise.all(promises);
    const values = results.map(r => r.value);
    const uniqueValues = [...new Set(values)];
    
    expect(uniqueValues).toHaveLength(1);
    expect(uniqueValues[0]).toBe(CONSISTENT_FALLBACKS.userAgent);
  });
});