import { describe, it, expect, beforeAll } from 'vitest';
import { generateId, generateIdWithDebug, HashGeneratorConfig } from '@/src/hash';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo, MimeType } from '@/src/types';

/**
 * Performance Testing Suite for Hash Generation
 * 
 * This test suite implements comprehensive performance testing to ensure
 * acceptable hash generation speed and identify optimization opportunities.
 * 
 * Requirements covered:
 * - 6.5: Performance testing for normalization overhead
 */

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Performance test configuration
interface PerformanceBenchmark {
  name: string;
  input: SystemInfo;
  maxProcessingTime: number; // milliseconds
  iterations: number;
  description: string;
}

// Baseline system configuration for performance testing
const performanceBaselineSystemInfo: SystemInfo = {
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
  platform: "Win32",
  screenResolution: [1920, 1080],
  colorDepth: 24,
  colorGamut: "srgb",
  os: { os: "Windows", version: "10" },
  webGL: {
    vendor: "Google Inc. (NVIDIA)",
    renderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)",
    imageHash: "mock_webgl_image_hash_v1"
  } as WebGLInfo,
  canvas: {
    winding: true,
    geometry: "canvas-geometry-fingerprint",
    text: "canvas-text-fingerprint"
  } as CanvasInfo,
  audio: 123.456789,
  fontPreferences: {
    detectedFonts: ["Arial", "Calibri", "Courier New", "Times New Roman", "Helvetica"].sort()
  } as FontPreferencesInfo,
  mathConstants: {
    acos: 1.2345,
    acosh: 2.3456,
    asinh: 3.4567,
    atanh: 4.5678,
    expm1: 5.6789,
    sinh: 6.7890,
    cosh: 7.8901,
    tanh: 8.9012,
  } as MathInfo,
  plugins: [
    { name: "Chrome PDF Viewer", description: "Portable Document Format", mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType] },
    { name: "Google Hangouts", description: "Google Talk Plugin", mimeTypes: [] }
  ] as PluginInfo[],
  languages: ["en-US", "en"],
  timezone: "America/New_York",
  incognito: { isPrivate: false, browserName: "Chrome" },
  bot: { isBot: false, signals: [], confidence: 0 },
  cookiesEnabled: true,
  doNotTrack: "1",
  localStorage: true,
  sessionStorage: true,
  indexedDB: true,
  touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
  vendor: "Google Inc.",
  vendorFlavors: ["Google Chrome"],
  confidenceScore: 100,
  deviceMemory: 8,
  hardwareConcurrency: 4,
};

// Performance benchmarks
const performanceBenchmarks: PerformanceBenchmark[] = [
  {
    name: "baseline_performance",
    input: performanceBaselineSystemInfo,
    maxProcessingTime: 25, // 25ms max for baseline
    iterations: 100,
    description: "Baseline performance test for standard system info"
  },
  {
    name: "minimal_data_performance",
    input: {
      ...performanceBaselineSystemInfo,
      audio: null,
      fontPreferences: { detectedFonts: [] },
      plugins: [],
      mathConstants: {} as MathInfo
    },
    maxProcessingTime: 20, // Should be faster with less data
    iterations: 100,
    description: "Performance test with minimal system information"
  },
  {
    name: "large_font_list_performance",
    input: {
      ...performanceBaselineSystemInfo,
      fontPreferences: {
        detectedFonts: Array.from({ length: 200 }, (_, i) => `Font${i.toString().padStart(3, '0')}`).sort()
      }
    },
    maxProcessingTime: 40, // Allow more time for large font lists
    iterations: 50,
    description: "Performance test with large font list (200 fonts)"
  },
  {
    name: "many_plugins_performance",
    input: {
      ...performanceBaselineSystemInfo,
      plugins: Array.from({ length: 100 }, (_, i) => ({
        name: `Plugin ${i.toString().padStart(3, '0')}`,
        description: `Description for plugin ${i}`,
        mimeTypes: [
          { type: `application/plugin${i}`, suffixes: `ext${i}` } as MimeType,
          { type: `text/plugin${i}`, suffixes: `txt${i}` } as MimeType
        ]
      })) as PluginInfo[]
    },
    maxProcessingTime: 60, // Allow more time for many plugins
    iterations: 50,
    description: "Performance test with many plugins (100 plugins)"
  },
  {
    name: "high_precision_math_performance",
    input: {
      ...performanceBaselineSystemInfo,
      mathConstants: {
        acos: 1.23456789012345678901234567890,
        acosh: 2.34567890123456789012345678901,
        asinh: 3.45678901234567890123456789012,
        atanh: 4.56789012345678901234567890123,
        expm1: 5.67890123456789012345678901234,
        sinh: 6.78901234567890123456789012345,
        cosh: 7.89012345678901234567890123456,
        tanh: 8.90123456789012345678901234567,
      } as MathInfo
    },
    maxProcessingTime: 30, // High precision numbers need more processing
    iterations: 100,
    description: "Performance test with high-precision mathematical constants"
  },
  {
    name: "fallback_heavy_performance",
    input: (() => {
      const info = deepClone(performanceBaselineSystemInfo);
      info.audio = null;
      info.fontPreferences.detectedFonts = [];
      info.plugins = [];
      // Simulate missing properties that trigger fallbacks
      return {
        ...info,
        webGL: undefined as any,
        canvas: undefined as any,
        mathConstants: undefined as any
      } as SystemInfo;
    })(),
    maxProcessingTime: 35, // Fallback processing takes a bit more time
    iterations: 50,
    description: "Performance test when many fallback values are needed"
  }
];

/**
 * Executes a performance benchmark
 */
async function executePerformanceBenchmark(benchmark: PerformanceBenchmark): Promise<{
  passed: boolean;
  averageTime: number;
  maxTime: number;
  minTime: number;
  times: number[];
  p95Time: number;
  p99Time: number;
}> {
  const times: number[] = [];

  for (let i = 0; i < benchmark.iterations; i++) {
    const config: HashGeneratorConfig = { debugMode: true };
    const result = await generateIdWithDebug(deepClone(benchmark.input), config);
    times.push(result.debugInfo!.processingTime);
  }

  times.sort((a, b) => a - b);
  
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  const p95Index = Math.floor(times.length * 0.95);
  const p99Index = Math.floor(times.length * 0.99);
  const p95Time = times[p95Index];
  const p99Time = times[p99Index];
  
  const passed = averageTime <= benchmark.maxProcessingTime;

  return { passed, averageTime, maxTime, minTime, times, p95Time, p99Time };
}

describe('Performance Testing Suite', () => {
  describe('Hash Generation Performance Benchmarks', () => {
    it.each(performanceBenchmarks)('$name: $description', async (benchmark) => {
      const result = await executePerformanceBenchmark(benchmark);
      
      // Log detailed performance metrics
      console.log(`Performance Benchmark "${benchmark.name}":`, {
        averageTime: `${result.averageTime.toFixed(2)}ms`,
        maxTime: `${result.maxTime.toFixed(2)}ms`,
        minTime: `${result.minTime.toFixed(2)}ms`,
        p95Time: `${result.p95Time.toFixed(2)}ms`,
        p99Time: `${result.p99Time.toFixed(2)}ms`,
        iterations: benchmark.iterations,
        threshold: `${benchmark.maxProcessingTime}ms`,
        passed: result.passed
      });
      
      expect(result.passed, 
        `Performance benchmark failed: average time ${result.averageTime.toFixed(2)}ms exceeds maximum ${benchmark.maxProcessingTime}ms`
      ).toBe(true);
      
      expect(result.averageTime).toBeLessThanOrEqual(benchmark.maxProcessingTime);
      expect(result.times).toHaveLength(benchmark.iterations);
      
      // Additional performance quality checks
      expect(result.minTime).toBeGreaterThan(0);
      expect(result.maxTime).toBeGreaterThanOrEqual(result.averageTime);
      expect(result.p95Time).toBeLessThanOrEqual(benchmark.maxProcessingTime * 2); // P95 should be within 2x threshold
    });

    it('should have consistent performance across multiple runs', async () => {
      const testInput = performanceBaselineSystemInfo;
      const runs = 5;
      const iterationsPerRun = 20;
      
      const runAverages: number[] = [];
      
      for (let run = 0; run < runs; run++) {
        const times: number[] = [];
        
        for (let i = 0; i < iterationsPerRun; i++) {
          const config: HashGeneratorConfig = { debugMode: true };
          const result = await generateIdWithDebug(deepClone(testInput), config);
          times.push(result.debugInfo!.processingTime);
        }
        
        const average = times.reduce((sum, time) => sum + time, 0) / times.length;
        runAverages.push(average);
      }
      
      const overallAverage = runAverages.reduce((sum, avg) => sum + avg, 0) / runAverages.length;
      const maxDeviation = Math.max(...runAverages.map(avg => Math.abs(avg - overallAverage)));
      
      // Performance should be consistent across runs (within 50% deviation)
      expect(maxDeviation / overallAverage).toBeLessThan(0.5);
      
      console.log('Performance Consistency Test:', {
        runs,
        iterationsPerRun,
        overallAverage: `${overallAverage.toFixed(2)}ms`,
        maxDeviation: `${maxDeviation.toFixed(2)}ms`,
        deviationPercentage: `${((maxDeviation / overallAverage) * 100).toFixed(1)}%`
      });
    });

    it('should scale linearly with data complexity', async () => {
      const fontCounts = [10, 50, 100, 200];
      const results: Array<{ fontCount: number; averageTime: number }> = [];
      
      for (const fontCount of fontCounts) {
        const testInput = {
          ...performanceBaselineSystemInfo,
          fontPreferences: {
            detectedFonts: Array.from({ length: fontCount }, (_, i) => `Font${i}`).sort()
          }
        };
        
        const times: number[] = [];
        const iterations = 20;
        
        for (let i = 0; i < iterations; i++) {
          const config: HashGeneratorConfig = { debugMode: true };
          const result = await generateIdWithDebug(deepClone(testInput), config);
          times.push(result.debugInfo!.processingTime);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        results.push({ fontCount, averageTime });
      }
      
      // Check that performance scales reasonably (not exponentially)
      const firstResult = results[0];
      const lastResult = results[results.length - 1];
      const scalingFactor = lastResult.averageTime / firstResult.averageTime;
      const dataScalingFactor = lastResult.fontCount / firstResult.fontCount;
      
      // Performance should not scale worse than O(n log n)
      expect(scalingFactor).toBeLessThan(dataScalingFactor * Math.log2(dataScalingFactor));
      
      console.log('Performance Scaling Test:', {
        results: results.map(r => ({ fontCount: r.fontCount, averageTime: `${r.averageTime.toFixed(2)}ms` })),
        scalingFactor: scalingFactor.toFixed(2),
        dataScalingFactor: dataScalingFactor.toFixed(2)
      });
    });
  });

  describe('Memory Usage and Efficiency', () => {
    it('should not leak memory during repeated hash generation', async () => {
      const testInput = performanceBaselineSystemInfo;
      const iterations = 1000;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage();
      
      // Generate many hashes
      for (let i = 0; i < iterations; i++) {
        await generateId(deepClone(testInput));
        
        // Occasionally force garbage collection
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }
      
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be minimal (less than 10MB for 1000 iterations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      console.log('Memory Usage Test:', {
        iterations,
        initialHeapUsed: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        finalHeapUsed: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      });
    });

    it('should handle large objects efficiently', async () => {
      const largeTestInput = {
        ...performanceBaselineSystemInfo,
        fontPreferences: {
          detectedFonts: Array.from({ length: 1000 }, (_, i) => `Font${i.toString().padStart(4, '0')}`).sort()
        },
        plugins: Array.from({ length: 500 }, (_, i) => ({
          name: `Plugin ${i.toString().padStart(3, '0')}`,
          description: `Very long description for plugin ${i} that contains a lot of text to test memory efficiency with large objects`,
          mimeTypes: Array.from({ length: 5 }, (_, j) => ({
            type: `application/plugin${i}-type${j}`,
            suffixes: `ext${i}${j}`
          } as MimeType))
        })) as PluginInfo[]
      };
      
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(deepClone(largeTestInput), config);
        times.push(result.debugInfo!.processingTime);
      }
      
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      // Should handle large objects within reasonable time (under 200ms)
      expect(averageTime).toBeLessThan(200);
      
      console.log('Large Object Efficiency Test:', {
        fontCount: largeTestInput.fontPreferences.detectedFonts.length,
        pluginCount: largeTestInput.plugins.length,
        averageTime: `${averageTime.toFixed(2)}ms`,
        iterations
      });
    });
  });

  describe('Optimization Verification', () => {
    it('should benefit from object reuse optimizations', async () => {
      const testInput = performanceBaselineSystemInfo;
      const iterations = 50;
      
      // Test with fresh objects each time (no reuse)
      const freshObjectTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(deepClone(testInput), config);
        freshObjectTimes.push(result.debugInfo!.processingTime);
      }
      
      // Test with same object reference (potential for optimization)
      const sameObjectTimes: number[] = [];
      const reusableInput = deepClone(testInput);
      for (let i = 0; i < iterations; i++) {
        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(reusableInput, config);
        sameObjectTimes.push(result.debugInfo!.processingTime);
      }
      
      const freshAverage = freshObjectTimes.reduce((sum, time) => sum + time, 0) / freshObjectTimes.length;
      const sameAverage = sameObjectTimes.reduce((sum, time) => sum + time, 0) / sameObjectTimes.length;
      
      console.log('Object Reuse Optimization Test:', {
        freshObjectAverage: `${freshAverage.toFixed(2)}ms`,
        sameObjectAverage: `${sameAverage.toFixed(2)}ms`,
        difference: `${(freshAverage - sameAverage).toFixed(2)}ms`,
        iterations
      });
      
      // Both should be within acceptable performance bounds
      expect(freshAverage).toBeLessThan(50);
      expect(sameAverage).toBeLessThan(50);
    });

    it('should have optimized normalization performance', async () => {
      const testCases = [
        {
          name: 'simple_strings',
          input: { ...performanceBaselineSystemInfo, userAgent: 'Simple User Agent' }
        },
        {
          name: 'complex_strings',
          input: { 
            ...performanceBaselineSystemInfo, 
            userAgent: '   Mozilla/5.0   (Windows NT 10.0; Win64; x64)   AppleWebKit/537.36   (KHTML, like Gecko)   Chrome/90.0.4430.93   Safari/537.36   '
          }
        },
        {
          name: 'simple_arrays',
          input: { 
            ...performanceBaselineSystemInfo, 
            fontPreferences: { detectedFonts: ['Arial', 'Times'] }
          }
        },
        {
          name: 'complex_arrays',
          input: { 
            ...performanceBaselineSystemInfo, 
            fontPreferences: { 
              detectedFonts: Array.from({ length: 50 }, (_, i) => `  Font ${i}  `).reverse()
            }
          }
        }
      ];
      
      for (const testCase of testCases) {
        const iterations = 100;
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
          const config: HashGeneratorConfig = { debugMode: true };
          const result = await generateIdWithDebug(deepClone(testCase.input), config);
          times.push(result.debugInfo!.processingTime);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        
        // All normalization should be efficient
        expect(averageTime).toBeLessThan(30);
        
        console.log(`Normalization Performance (${testCase.name}):`, {
          averageTime: `${averageTime.toFixed(2)}ms`,
          iterations
        });
      }
    });
  });
});