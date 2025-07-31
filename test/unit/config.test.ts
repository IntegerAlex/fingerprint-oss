/**
 * Unit tests for the configuration module
 * Testing Framework: Vitest (following project conventions)
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { Config, setConfig, getConfig, isTestEnv, isVerboseLogging, logger } from '../../src/config';

describe('Config Module', () => {
  // Store original console methods for restoration
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };

  // Mock console methods
  let mockConsoleLog: any;
  let mockConsoleWarn: any;
  let mockConsoleError: any;

  beforeEach(() => {
    // Reset config to default state before each test
    setConfig({});
    
    // Mock console methods using Vitest
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  afterAll(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('Default Configuration', () => {
    it('should have correct default values', () => {
      const config = getConfig();
      expect(config.env).toBe('PROD');
      expect(config.verbose).toBe(false);
    });

    it('should return a new object instance each time getConfig is called', () => {
      const config1 = getConfig();
      const config2 = getConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object references
    });
  });

  describe('setConfig', () => {
    it('should update env configuration', () => {
      setConfig({ env: 'TEST' });
      const config = getConfig();
      expect(config.env).toBe('TEST');
      expect(config.verbose).toBe(false); // Should maintain default
    });

    it('should update verbose configuration', () => {
      setConfig({ verbose: true });
      const config = getConfig();
      expect(config.env).toBe('PROD'); // Should maintain default
      expect(config.verbose).toBe(true);
    });

    it('should update multiple configuration values', () => {
      setConfig({ env: 'TEST', verbose: true });
      const config = getConfig();
      expect(config.env).toBe('TEST');
      expect(config.verbose).toBe(true);
    });

    it('should handle partial config updates correctly', () => {
      // Set initial config
      setConfig({ env: 'TEST', verbose: true });
      
      // Update only one field - this should merge with defaults, not previous state
      setConfig({ verbose: false });
      
      const config = getConfig();
      expect(config.env).toBe('PROD'); // Should reset to default
      expect(config.verbose).toBe(false);
    });

    it('should handle empty config object', () => {
      setConfig({ env: 'TEST', verbose: true });
      setConfig({});
      
      const config = getConfig();
      expect(config.env).toBe('PROD');
      expect(config.verbose).toBe(false);
    });

    it('should preserve immutability of defaultConfig', () => {
      const originalDefault = { env: 'PROD' as const, verbose: false };
      setConfig({ env: 'TEST', verbose: true });
      
      // Verify default wasn't mutated by resetting and checking
      setConfig({});
      const newConfig = getConfig();
      expect(newConfig).toEqual(originalDefault);
    });

    it('should handle invalid env values gracefully', () => {
      // TypeScript should prevent this, but testing runtime behavior
      setConfig({ env: 'INVALID' as any });
      const config = getConfig();
      expect(config.env).toBe('INVALID'); // Should still work at runtime
    });
  });

  describe('isTestEnv', () => {
    it('should return true when env is TEST', () => {
      setConfig({ env: 'TEST' });
      expect(isTestEnv()).toBe(true);
    });

    it('should return false when env is PROD', () => {
      setConfig({ env: 'PROD' });
      expect(isTestEnv()).toBe(false);
    });

    it('should return false by default', () => {
      expect(isTestEnv()).toBe(false);
    });
  });

  describe('isVerboseLogging', () => {
    it('should return true when verbose is true', () => {
      setConfig({ verbose: true });
      expect(isVerboseLogging()).toBe(true);
    });

    it('should return true when env is TEST (even if verbose is false)', () => {
      setConfig({ env: 'TEST', verbose: false });
      expect(isVerboseLogging()).toBe(true);
    });

    it('should return true when both env is TEST and verbose is true', () => {
      setConfig({ env: 'TEST', verbose: true });
      expect(isVerboseLogging()).toBe(true);
    });

    it('should return false when env is PROD and verbose is false', () => {
      setConfig({ env: 'PROD', verbose: false });
      expect(isVerboseLogging()).toBe(false);
    });

    it('should return false by default', () => {
      expect(isVerboseLogging()).toBe(false);
    });

    it('should prioritize TEST env over verbose setting', () => {
      setConfig({ env: 'TEST', verbose: false });
      expect(isVerboseLogging()).toBe(true);
      
      setConfig({ env: 'PROD', verbose: true });
      expect(isVerboseLogging()).toBe(true);
    });
  });

  describe('Logger', () => {
    describe('log method', () => {
      it('should log when verbose is true', () => {
        setConfig({ verbose: true });
        logger.log('test message', 'additional arg');
        
        expect(mockConsoleLog).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'test message',
          'additional arg'
        );
      });

      it('should log when env is TEST', () => {
        setConfig({ env: 'TEST' });
        logger.log('test message');
        
        expect(mockConsoleLog).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'test message'
        );
      });

      it('should not log when verbose is false and env is PROD', () => {
        setConfig({ env: 'PROD', verbose: false });
        logger.log('test message');
        
        expect(mockConsoleLog).not.toHaveBeenCalled();
      });

      it('should handle multiple arguments', () => {
        setConfig({ verbose: true });
        logger.log('arg1', 'arg2', { key: 'value' }, 123);
        
        expect(mockConsoleLog).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'arg1',
          'arg2',
          { key: 'value' },
          123
        );
      });

      it('should handle no arguments', () => {
        setConfig({ verbose: true });
        logger.log();
        
        expect(mockConsoleLog).toHaveBeenCalledWith('[fingerprint-oss]');
      });

      it('should handle null and undefined arguments', () => {
        setConfig({ verbose: true });
        logger.log(null, undefined, 'valid arg');
        
        expect(mockConsoleLog).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          null,
          undefined,
          'valid arg'
        );
      });
    });

    describe('warn method', () => {
      it('should warn when verbose is true', () => {
        setConfig({ verbose: true });
        logger.warn('warning message', 'additional arg');
        
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'warning message',
          'additional arg'
        );
      });

      it('should warn when env is TEST', () => {
        setConfig({ env: 'TEST' });
        logger.warn('warning message');
        
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'warning message'
        );
      });

      it('should not warn when verbose is false and env is PROD', () => {
        setConfig({ env: 'PROD', verbose: false });
        logger.warn('warning message');
        
        expect(mockConsoleWarn).not.toHaveBeenCalled();
      });

      it('should handle multiple arguments', () => {
        setConfig({ verbose: true });
        logger.warn('warn1', 'warn2', { error: true });
        
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'warn1',
          'warn2',
          { error: true }
        );
      });

      it('should handle empty warnings', () => {
        setConfig({ verbose: true });
        logger.warn();
        
        expect(mockConsoleWarn).toHaveBeenCalledWith('[fingerprint-oss]');
      });
    });

    describe('error method', () => {
      it('should always log errors with full detail when verbose is true', () => {
        setConfig({ verbose: true });
        logger.error('error message', 'stack trace', { errorCode: 500 });
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'error message',
          'stack trace',
          { errorCode: 500 }
        );
      });

      it('should always log errors with full detail when env is TEST', () => {
        setConfig({ env: 'TEST', verbose: false });
        logger.error('error message', 'additional info');
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'error message',
          'additional info'
        );
      });

      it('should log only first argument when verbose is false and env is PROD', () => {
        setConfig({ env: 'PROD', verbose: false });
        logger.error('error message', 'hidden details', { secret: 'data' });
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'error message'
        );
      });

      it('should handle single argument in non-verbose mode', () => {
        setConfig({ env: 'PROD', verbose: false });
        logger.error('single error');
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'single error'
        );
      });

      it('should handle no arguments gracefully', () => {
        setConfig({ verbose: true });
        logger.error();
        
        expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]');
      });

      it('should handle undefined first argument in non-verbose mode', () => {
        setConfig({ env: 'PROD', verbose: false });
        logger.error(undefined, 'hidden details');
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          undefined
        );
      });

      it('should always log errors regardless of verbose setting (key difference from log/warn)', () => {
        // Even in PROD with verbose=false, errors should be logged (but truncated)
        setConfig({ env: 'PROD', verbose: false });
        logger.error('critical error', 'sensitive info');
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'critical error'
        );
        expect(mockConsoleError).toHaveBeenCalledTimes(1);
      });

      it('should handle Error objects properly', () => {
        setConfig({ verbose: true });
        const error = new Error('Test error');
        logger.error('Error occurred:', error);
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[fingerprint-oss]',
          'Error occurred:',
          error
        );
      });
    });
  });

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce Config interface constraints', () => {
      // These should compile without errors
      const validConfigs: Partial<Config>[] = [
        { env: 'TEST' },
        { env: 'PROD' },
        { verbose: true },
        { verbose: false },
        { env: 'TEST', verbose: true },
        {}
      ];

      validConfigs.forEach(config => {
        expect(() => setConfig(config)).not.toThrow();
      });
    });

    it('should return Config type from getConfig', () => {
      const config = getConfig();
      expect(typeof config.env).toBe('string');
      expect(typeof config.verbose).toBe('boolean');
      expect(['TEST', 'PROD']).toContain(config.env);
    });

    it('should maintain type safety with partial updates', () => {
      // Verify that partial config updates maintain type safety
      setConfig({ env: 'TEST' });
      let config = getConfig();
      expect(config).toEqual({ env: 'TEST', verbose: false });

      setConfig({ verbose: true });
      config = getConfig();
      expect(config).toEqual({ env: 'PROD', verbose: true });
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly in typical TEST environment setup', () => {
      setConfig({ env: 'TEST' });
      
      expect(isTestEnv()).toBe(true);
      expect(isVerboseLogging()).toBe(true);
      
      logger.log('test log');
      logger.warn('test warn');
      logger.error('test error', 'with details');
      
      expect(mockConsoleLog).toHaveBeenCalledWith('[fingerprint-oss]', 'test log');
      expect(mockConsoleWarn).toHaveBeenCalledWith('[fingerprint-oss]', 'test warn');
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', 'test error', 'with details');
    });

    it('should work correctly in typical PROD environment setup', () => {
      setConfig({ env: 'PROD', verbose: false });
      
      expect(isTestEnv()).toBe(false);
      expect(isVerboseLogging()).toBe(false);
      
      logger.log('prod log');
      logger.warn('prod warn');
      logger.error('prod error', 'hidden details');
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', 'prod error');
    });

    it('should work correctly in PROD with verbose logging', () => {
      setConfig({ env: 'PROD', verbose: true });
      
      expect(isTestEnv()).toBe(false);
      expect(isVerboseLogging()).toBe(true);
      
      logger.log('verbose prod log');
      logger.error('verbose prod error', 'with details');
      
      expect(mockConsoleLog).toHaveBeenCalledWith('[fingerprint-oss]', 'verbose prod log');
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', 'verbose prod error', 'with details');
    });

    it('should demonstrate logger behavior differences by method', () => {
      setConfig({ env: 'PROD', verbose: false });
      
      // log and warn should be silent
      logger.log('should not appear');
      logger.warn('should not appear');
      
      // error should always appear (but truncated)
      logger.error('should appear', 'but this should not');
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', 'should appear');
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle rapid config changes', () => {
      setConfig({ env: 'TEST' });
      setConfig({ env: 'PROD' });
      setConfig({ verbose: true });
      setConfig({ env: 'TEST', verbose: false });
      
      const finalConfig = getConfig();
      expect(finalConfig.env).toBe('TEST');
      expect(finalConfig.verbose).toBe(false);
    });

    it('should maintain consistent behavior with repeated calls', () => {
      setConfig({ env: 'TEST', verbose: true });
      
      const config1 = getConfig();
      const config2 = getConfig();
      const isTest1 = isTestEnv();
      const isTest2 = isTestEnv();
      const isVerbose1 = isVerboseLogging();
      const isVerbose2 = isVerboseLogging();
      
      expect(config1).toEqual(config2);
      expect(isTest1).toBe(isTest2);
      expect(isVerbose1).toBe(isVerbose2);
    });

    it('should handle logger calls with complex objects', () => {
      setConfig({ verbose: true });
      
      const complexObject = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, { inner: 'object' }],
        func: () => 'function',
        circular: null as any
      };
      complexObject.circular = complexObject;
      
      expect(() => {
        logger.log('Complex object:', complexObject);
        logger.warn('Complex warning:', complexObject);
        logger.error('Complex error:', complexObject);
      }).not.toThrow();
      
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle concurrent logging correctly', () => {
      setConfig({ verbose: true });
      
      // Simulate rapid logging
      for (let i = 0; i < 5; i++) {
        logger.log(`Message ${i}`);
        logger.warn(`Warning ${i}`);
        logger.error(`Error ${i}`);
      }
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(5);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(5);
      expect(mockConsoleError).toHaveBeenCalledTimes(5);
    });

    it('should handle extremely long messages', () => {
      setConfig({ verbose: true });
      const longMessage = 'A'.repeat(10000);
      
      expect(() => {
        logger.log(longMessage);
        logger.warn(longMessage);
        logger.error(longMessage);
      }).not.toThrow();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('[fingerprint-oss]', longMessage);
      expect(mockConsoleWarn).toHaveBeenCalledWith('[fingerprint-oss]', longMessage);
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', longMessage);
    });

    it('should maintain config isolation between test runs', () => {
      // This test verifies that our beforeEach reset is working
      setConfig({ env: 'TEST', verbose: true });
      const config1 = getConfig();
      
      // Simulate a new test run (beforeEach should reset)
      setConfig({});
      const config2 = getConfig();
      
      expect(config1).toEqual({ env: 'TEST', verbose: true });
      expect(config2).toEqual({ env: 'PROD', verbose: false });
    });

    it('should handle special characters in log messages', () => {
      setConfig({ verbose: true });
      const specialMessage = '🎉 Success! <script>alert("test")</script> \n\t\r';
      
      logger.log(specialMessage);
      logger.warn(specialMessage);
      logger.error(specialMessage);
      
      expect(mockConsoleLog).toHaveBeenCalledWith('[fingerprint-oss]', specialMessage);
      expect(mockConsoleWarn).toHaveBeenCalledWith('[fingerprint-oss]', specialMessage);
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', specialMessage);
    });
  });

  describe('Logger Method Consistency', () => {
    it('should use consistent prefixing across all logger methods', () => {
      setConfig({ verbose: true });
      
      logger.log('test');
      logger.warn('test');
      logger.error('test');
      
      expect(mockConsoleLog).toHaveBeenCalledWith('[fingerprint-oss]', 'test');
      expect(mockConsoleWarn).toHaveBeenCalledWith('[fingerprint-oss]', 'test');
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', 'test');
    });

    it('should handle argument spreading consistently', () => {
      setConfig({ verbose: true });
      const args = ['arg1', 'arg2', { key: 'value' }];
      
      logger.log(...args);
      logger.warn(...args);
      logger.error(...args);
      
      expect(mockConsoleLog).toHaveBeenCalledWith('[fingerprint-oss]', ...args);
      expect(mockConsoleWarn).toHaveBeenCalledWith('[fingerprint-oss]', ...args);
      expect(mockConsoleError).toHaveBeenCalledWith('[fingerprint-oss]', ...args);
    });
  });
});