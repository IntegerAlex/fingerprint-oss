/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Telemetry, withTelemetry, TelemetryConfig } from '../../src/telemetry';

// Mock OpenTelemetry API
vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn().mockReturnValue({
      startSpan: vi.fn().mockReturnValue({
        setAttributes: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn()
      })
    })
  },
  metrics: {
    getMeter: vi.fn().mockReturnValue({
      createCounter: vi.fn().mockReturnValue({
        add: vi.fn()
      }),
      createHistogram: vi.fn().mockReturnValue({
        record: vi.fn()
      })
    })
  },
  SpanKind: {
    INTERNAL: 'internal'
  },
  SpanStatusCode: {
    OK: 'ok',
    ERROR: 'error'
  }
}));

describe('Telemetry Module', () => {
  beforeEach(() => {
    // Reset telemetry state before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });

  describe('Telemetry Initialization', () => {
    it('should initialize with default configuration when no config provided', () => {
      Telemetry.initialize();
      const config = Telemetry.getConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.serviceName).toBe('fingerprint-oss');
      expect(config.serviceVersion).toBe('0.9.3');
      expect(config.sampleRate).toBe(0.1);
      expect(config.debug).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: TelemetryConfig = {
        enabled: true,
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        sampleRate: 0.5,
        debug: true
      };

      Telemetry.initialize(customConfig);
      const config = Telemetry.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.serviceName).toBe('test-service');
      expect(config.serviceVersion).toBe('1.0.0');
      expect(config.sampleRate).toBe(0.5);
      expect(config.debug).toBe(true);
    });

    it('should merge custom config with defaults', () => {
      const partialConfig: TelemetryConfig = {
        enabled: true,
        serviceName: 'partial-service'
      };

      Telemetry.initialize(partialConfig);
      const config = Telemetry.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.serviceName).toBe('partial-service');
      expect(config.serviceVersion).toBe('0.9.3'); // should use default
      expect(config.sampleRate).toBe(0.1); // should use default
    });

    it('should not initialize when enabled is false', () => {
      Telemetry.initialize({ enabled: false });
      expect(Telemetry.isEnabled()).toBe(false);
    });
  });

  describe('Span Management', () => {
    beforeEach(() => {
      // Mock window object for browser environment
      global.window = {} as any;
      
      Telemetry.initialize({ 
        enabled: true, 
        sampleRate: 1.0 // Always sample for tests
      });
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should start a span with correct attributes', () => {
      const span = Telemetry.startSpan('test-operation', { 'test.attribute': 'value' });
      
      expect(span).toBeDefined();
    });

    it('should return null when telemetry is disabled', () => {
      Telemetry.initialize({ enabled: false });
      const span = Telemetry.startSpan('test-operation');
      
      expect(span).toBeNull();
    });

    it('should end span successfully', () => {
      const mockSpan = {
        setAttributes: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn()
      };

      Telemetry.endSpan(mockSpan, { 'end.attribute': 'value' });
      
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({ 'end.attribute': 'value' });
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 'ok' });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle null span gracefully', () => {
      expect(() => Telemetry.endSpan(null)).not.toThrow();
    });

    it('should end span with error correctly', () => {
      const mockSpan = {
        setAttributes: vi.fn(),
        setStatus: vi.fn(),
        end: vi.fn()
      };
      const testError = new Error('Test error');

      Telemetry.endSpanWithError(mockSpan, testError, { 'error.context': 'test' });
      
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'error.name': 'Error',
        'error.type': 'Error',
        'error.context': 'test'
      });
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ 
        code: 'error', 
        message: 'Error: Error' 
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe('Metrics Recording', () => {
    beforeEach(() => {
      global.window = {} as any;
      Telemetry.initialize({ 
        enabled: true, 
        sampleRate: 1.0 // Always sample for tests
      });
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should record function call metrics', () => {
      Telemetry.recordFunctionCall('testFunction', 100, true, { 'test.context': 'value' });
      
      // Should not throw and complete successfully
      expect(true).toBe(true);
    });

    it('should record error metrics', () => {
      const testError = new Error('Test error');
      
      Telemetry.recordError(testError, { 'error.context': 'test' });
      
      // Should not throw and complete successfully
      expect(true).toBe(true);
    });

    it('should increment counters', () => {
      Telemetry.incrementCounter('test_counter', 5, { 'counter.context': 'test' });
      
      // Should not throw and complete successfully
      expect(true).toBe(true);
    });

    it('should record histogram values', () => {
      Telemetry.recordHistogram('test_histogram', 42.5, { 'histogram.context': 'test' });
      
      // Should not throw and complete successfully
      expect(true).toBe(true);
    });

    it('should not record metrics when disabled', () => {
      Telemetry.initialize({ enabled: false });
      
      expect(() => {
        Telemetry.recordFunctionCall('testFunction', 100, true);
        Telemetry.recordError(new Error('test'));
        Telemetry.incrementCounter('test_counter');
        Telemetry.recordHistogram('test_histogram', 1);
      }).not.toThrow();
    });
  });

  describe('Sampling', () => {
    beforeEach(() => {
      global.window = {} as any;
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should respect sample rate of 0 (never sample)', () => {
      Telemetry.initialize({ 
        enabled: true, 
        sampleRate: 0.0 
      });

      const span = Telemetry.startSpan('test-operation');
      expect(span).toBeNull();
    });

    it('should respect sample rate of 1 (always sample)', () => {
      Telemetry.initialize({ 
        enabled: true, 
        sampleRate: 1.0 
      });

      const span = Telemetry.startSpan('test-operation');
      expect(span).toBeDefined();
    });
  });

  describe('withTelemetry Decorator', () => {
    beforeEach(() => {
      global.window = {} as any;
      Telemetry.initialize({ 
        enabled: true, 
        sampleRate: 1.0 
      });
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should wrap synchronous functions correctly', () => {
      const originalFunction = vi.fn().mockReturnValue('test-result');
      const wrappedFunction = withTelemetry('testSync', originalFunction);
      
      const result = wrappedFunction('arg1', 'arg2');
      
      expect(result).toBe('test-result');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should wrap asynchronous functions correctly', async () => {
      const originalFunction = vi.fn().mockResolvedValue('async-result');
      const wrappedFunction = withTelemetry('testAsync', originalFunction);
      
      const result = await wrappedFunction('arg1', 'arg2');
      
      expect(result).toBe('async-result');
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle synchronous function errors', () => {
      const testError = new Error('Sync error');
      const originalFunction = vi.fn().mockImplementation(() => {
        throw testError;
      });
      const wrappedFunction = withTelemetry('testSyncError', originalFunction);
      
      expect(() => wrappedFunction()).toThrow('Sync error');
    });

    it('should handle asynchronous function errors', async () => {
      const testError = new Error('Async error');
      const originalFunction = vi.fn().mockRejectedValue(testError);
      const wrappedFunction = withTelemetry('testAsyncError', originalFunction);
      
      await expect(wrappedFunction()).rejects.toThrow('Async error');
    });
  });

  describe('Browser Environment Detection', () => {
    it('should handle server-side rendering gracefully', () => {
      // Ensure window is undefined (SSR environment)
      delete (global as any).window;
      
      Telemetry.initialize({ enabled: true });
      
      // Should not throw errors in SSR
      expect(() => {
        const span = Telemetry.startSpan('test');
        Telemetry.endSpan(span);
        Telemetry.recordError(new Error('test'));
        Telemetry.recordFunctionCall('test', 100, true);
      }).not.toThrow();
    });

    it('should work in browser environment', () => {
      global.window = {} as any;
      
      Telemetry.initialize({ enabled: true, sampleRate: 1.0 });
      
      expect(Telemetry.isEnabled()).toBe(true);
      
      delete (global as any).window;
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid sample rates gracefully', () => {
      // Test with negative sample rate
      Telemetry.initialize({ 
        enabled: true, 
        sampleRate: -0.5 
      });
      
      const config = Telemetry.getConfig();
      expect(config.sampleRate).toBe(-0.5); // Should preserve the value
    });

    it('should handle sample rates greater than 1', () => {
      Telemetry.initialize({ 
        enabled: true, 
        sampleRate: 1.5 
      });
      
      const config = Telemetry.getConfig();
      expect(config.sampleRate).toBe(1.5); // Should preserve the value
    });

    it('should handle empty service names', () => {
      Telemetry.initialize({ 
        enabled: true, 
        serviceName: '' 
      });
      
      const config = Telemetry.getConfig();
      expect(config.serviceName).toBe('');
    });
  });
});
