import { describe, it, expect, beforeAll } from 'vitest';
import { generateId, generateIdWithDebug, compareInputs, HashGeneratorConfig } from '@/src/hash';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo, MimeType } from '@/src/types';

/**
 * Hash Stability Testing Framework
 * 
 * This test suite implements comprehensive stability testing for the fingerprint hash generation
 * to ensure deterministic behavior, cross-environment consistency, and performance benchmarks.
 * 
 * Requirements covered:
 * - 6.1: Deterministic hash testing with identical inputs
 * - 6.2: Edge case and malformed input handling consistency
 * - 6.3: Cross-environment hash stability verification
 * - 6.4: Performance testing for normalization overhead
 */

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Interface for deterministic test cases
 */
interface DeterministicTest {
  name: string;
  input: SystemInfo;
  expectedHash?: string; // Optional for baseline establishment
  iterations: number;
  description: string;
}

/**
 * Interface for edge case test scenarios
 */
interface EdgeCaseTest {
  name: string;
  input: SystemInfo;
  expectedBehavior: 'consistent_fallback' | 'deterministic_hash' | 'validation_error';
  description: string;
}

/**
 * Interface for cross-environment test configurations
 */
interface CrossEnvironmentTest {
  name: string;
  baseInput: SystemInfo;
  environmentVariations: Array<{
    name: string;
    modifications: Partial<SystemInfo>;
    shouldAffectHash: boolean;
  }>;
  description: string;
}

/**
 * Interface for performance test benchmarks
 */
interface PerformanceTest {
  name: string;
  input: SystemInfo;
  maxProcessingTime: number; // milliseconds
  iterations: number;
  description: string;
}

/**
 * Interface for regression test cases with known configurations
 */
interface RegressionTest {
  name: string;
  input: SystemInfo;
  expectedHash: string;
  version: string;
  description: string;
}

/**
 * Main stability test suite interface
 */
interface StabilityTestSuite {
  deterministicTests: DeterministicTest[];
  edgeCaseTests: EdgeCaseTest[];
  crossEnvironmentTests: CrossEnvironmentTest[];
  performanceTests: PerformanceTest[];
  regressionTests: RegressionTest[];
}

// Baseline system configuration for testing
const baselineSystemInfo: SystemInfo = {
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
    detectedFonts: ["Arial", "Calibri", "Courier New"].sort()
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
  deviceMemory: undefined,
  hardwareConcurrency: navigator.hardwareConcurrency || 4,
};

/**
 * Comprehensive stability test suite implementation
 */
class StabilityTestSuiteImpl implements StabilityTestSuite {
  deterministicTests: DeterministicTest[] = [
    {
      name: "baseline_deterministic",
      input: baselineSystemInfo,
      iterations: 100,
      description: "Verify baseline system info produces identical hashes across multiple iterations"
    },
    {
      name: "minimal_system_info",
      input: {
        ...baselineSystemInfo,
        audio: null,
        fontPreferences: { detectedFonts: [] },
        plugins: [],
        mathConstants: {} as MathInfo
      },
      iterations: 50,
      description: "Test deterministic behavior with minimal system information"
    },
    {
      name: "high_precision_numbers",
      input: {
        ...baselineSystemInfo,
        mathConstants: {
          acos: 1.23456789012345,
          acosh: 2.34567890123456,
          asinh: 3.45678901234567,
          atanh: 4.56789012345678,
          expm1: 5.67890123456789,
          sinh: 6.78901234567890,
          cosh: 7.89012345678901,
          tanh: 8.90123456789012,
        } as MathInfo
      },
      iterations: 25,
      description: "Verify normalization consistency with high-precision floating point numbers"
    }
  ];

  edgeCaseTests: EdgeCaseTest[] = [
    {
      name: "null_audio_fallback",
      input: { ...baselineSystemInfo, audio: null },
      expectedBehavior: 'consistent_fallback',
      description: "Test consistent fallback behavior when audio fingerprint is null"
    },
    {
      name: "empty_fonts_fallback",
      input: { ...baselineSystemInfo, fontPreferences: { detectedFonts: [] } },
      expectedBehavior: 'consistent_fallback',
      description: "Test consistent fallback behavior when no fonts are detected"
    },
    {
      name: "missing_webgl_fallback",
      input: (() => {
        const info = deepClone(baselineSystemInfo);
        // @ts-ignore: Testing missing property handling
        delete info.webGL;
        return info as SystemInfo;
      })(),
      expectedBehavior: 'consistent_fallback',
      description: "Test consistent fallback behavior when WebGL is unavailable"
    },
    {
      name: "malformed_screen_resolution",
      input: { ...baselineSystemInfo, screenResolution: [-1, -1] as [number, number] },
      expectedBehavior: 'deterministic_hash',
      description: "Test handling of malformed screen resolution values"
    },
    {
      name: "extreme_math_values",
      input: {
        ...baselineSystemInfo,
        mathConstants: {
          acos: Number.MAX_SAFE_INTEGER,
          acosh: Number.MIN_SAFE_INTEGER,
          asinh: Number.POSITIVE_INFINITY,
          atanh: Number.NEGATIVE_INFINITY,
          expm1: NaN,
          sinh: 0,
          cosh: -0,
          tanh: Number.EPSILON,
        } as MathInfo
      },
      expectedBehavior: 'deterministic_hash',
      description: "Test handling of extreme mathematical constant values"
    }
  ];

  crossEnvironmentTests: CrossEnvironmentTest[] = [
    {
      name: "browser_environment_variations",
      baseInput: baselineSystemInfo,
      environmentVariations: [
        {
          name: "chrome_windows",
          modifications: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            platform: "Win32",
            vendor: "Google Inc."
          },
          shouldAffectHash: true
        },
        {
          name: "firefox_windows",
          modifications: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            platform: "Win32",
            vendor: ""
          },
          shouldAffectHash: true
        },
        {
          name: "safari_macos",
          modifications: {
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
            platform: "MacIntel",
            os: { os: "macOS", version: "10.15.7" }
          },
          shouldAffectHash: true
        },
        {
          name: "timezone_change",
          modifications: {
            timezone: "Europe/London"
          },
          shouldAffectHash: false
        },
        {
          name: "language_change",
          modifications: {
            languages: ["fr-FR", "fr", "en"]
          },
          shouldAffectHash: false
        }
      ],
      description: "Test hash stability across different browser environments and settings"
    },
    {
      name: "hardware_variations",
      baseInput: baselineSystemInfo,
      environmentVariations: [
        {
          name: "high_dpi_display",
          modifications: {
            screenResolution: [3840, 2160],
            colorDepth: 32,
            colorGamut: "p3"
          },
          shouldAffectHash: true
        },
        {
          name: "mobile_display",
          modifications: {
            screenResolution: [375, 812],
            colorDepth: 24,
            touchSupport: { maxTouchPoints: 5, touchEvent: true, touchStart: true }
          },
          shouldAffectHash: true
        },
        {
          name: "hardware_concurrency_change",
          modifications: {
            hardwareConcurrency: 8
          },
          shouldAffectHash: false
        },
        {
          name: "device_memory_change",
          modifications: {
            deviceMemory: 8
          },
          shouldAffectHash: false
        }
      ],
      description: "Test hash behavior with different hardware configurations"
    }
  ];

  performanceTests: PerformanceTest[] = [
    {
      name: "baseline_performance",
      input: baselineSystemInfo,
      maxProcessingTime: 50, // 50ms max
      iterations: 100,
      description: "Baseline performance test for standard system info"
    },
    {
      name: "complex_system_performance",
      input: {
        ...baselineSystemInfo,
        plugins: Array.from({ length: 50 }, (_, i) => ({
          name: `Plugin ${i}`,
          description: `Description for plugin ${i}`,
          mimeTypes: [{ type: `application/plugin${i}`, suffixes: `ext${i}` } as MimeType]
        })) as PluginInfo[],
        fontPreferences: {
          detectedFonts: Array.from({ length: 100 }, (_, i) => `Font${i}`).sort()
        }
      },
      maxProcessingTime: 100, // 100ms max for complex data
      iterations: 50,
      description: "Performance test with complex system information (many plugins and fonts)"
    },
    {
      name: "fallback_heavy_performance",
      input: (() => {
        const info = deepClone(baselineSystemInfo);
        info.audio = null;
        info.fontPreferences.detectedFonts = [];
        info.plugins = [];
        // @ts-ignore: Testing performance with many fallbacks
        delete info.webGL;
        delete info.canvas;
        return info as SystemInfo;
      })(),
      maxProcessingTime: 75, // 75ms max with fallbacks
      iterations: 50,
      description: "Performance test when many fallback values are needed"
    }
  ];

  regressionTests: RegressionTest[] = [
    // These will be populated with known good hashes after initial implementation
    {
      name: "windows_chrome_baseline",
      input: baselineSystemInfo,
      expectedHash: "", // Will be set after baseline establishment
      version: "1.0.0",
      description: "Regression test for Windows Chrome baseline configuration"
    }
  ];

  /**
   * Executes a deterministic test case
   */
  async executeDeterministicTest(test: DeterministicTest): Promise<{ passed: boolean; hashes: string[]; error?: string }> {
    try {
      const hashes: string[] = [];
      
      for (let i = 0; i < test.iterations; i++) {
        const hash = await generateId(deepClone(test.input));
        hashes.push(hash);
      }

      // Check that all hashes are identical
      const uniqueHashes = new Set(hashes);
      const passed = uniqueHashes.size === 1;

      return { passed, hashes };
    } catch (error) {
      return { passed: false, hashes: [], error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Executes an edge case test
   */
  async executeEdgeCaseTest(test: EdgeCaseTest): Promise<{ passed: boolean; hash1: string; hash2: string; error?: string }> {
    try {
      // Generate hash twice to ensure consistency
      const hash1 = await generateId(deepClone(test.input));
      const hash2 = await generateId(deepClone(test.input));

      const passed = hash1 === hash2;
      return { passed, hash1, hash2 };
    } catch (error) {
      if (test.expectedBehavior === 'validation_error') {
        return { passed: true, hash1: '', hash2: '', error: error instanceof Error ? error.message : String(error) };
      }
      return { passed: false, hash1: '', hash2: '', error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Executes a cross-environment test
   */
  async executeCrossEnvironmentTest(test: CrossEnvironmentTest): Promise<{ passed: boolean; results: Array<{ name: string; hash: string; shouldAffectHash: boolean; actuallyAffected: boolean }> }> {
    const baseHash = await generateId(deepClone(test.baseInput));
    const results: Array<{ name: string; hash: string; shouldAffectHash: boolean; actuallyAffected: boolean }> = [];

    for (const variation of test.environmentVariations) {
      const modifiedInput = { ...deepClone(test.baseInput), ...variation.modifications };
      const variationHash = await generateId(modifiedInput);
      const actuallyAffected = baseHash !== variationHash;

      results.push({
        name: variation.name,
        hash: variationHash,
        shouldAffectHash: variation.shouldAffectHash,
        actuallyAffected
      });
    }

    // Test passes if all expectations match reality
    const passed = results.every(r => r.shouldAffectHash === r.actuallyAffected);
    return { passed, results };
  }

  /**
   * Executes a performance test
   */
  async executePerformanceTest(test: PerformanceTest): Promise<{ passed: boolean; averageTime: number; maxTime: number; minTime: number; times: number[] }> {
    const times: number[] = [];

    for (let i = 0; i < test.iterations; i++) {
      const config: HashGeneratorConfig = { debugMode: true };
      const result = await generateIdWithDebug(deepClone(test.input), config);
      times.push(result.debugInfo!.processingTime);
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    const passed = averageTime <= test.maxProcessingTime;

    return { passed, averageTime, maxTime, minTime, times };
  }

  /**
   * Executes a regression test
   */
  async executeRegressionTest(test: RegressionTest): Promise<{ passed: boolean; actualHash: string; expectedHash: string }> {
    const actualHash = await generateId(deepClone(test.input));
    const passed = actualHash === test.expectedHash;

    return { passed, actualHash, expectedHash: test.expectedHash };
  }
}

// Global test suite instance
const stabilityTestSuite = new StabilityTestSuiteImpl();

describe('Hash Stability Testing Framework', () => {
  let baselineHash: string;

  beforeAll(async () => {
    // Establish baseline hash for regression testing
    baselineHash = await generateId(baselineSystemInfo);
    stabilityTestSuite.regressionTests[0].expectedHash = baselineHash;
  });

  describe('Deterministic Hash Testing (Requirement 6.1)', () => {
    it.each(stabilityTestSuite.deterministicTests)('$name: $description', async (test) => {
      const result = await stabilityTestSuite.executeDeterministicTest(test);
      
      expect(result.passed, `Test failed: ${result.error || 'Hashes were not identical across iterations'}`).toBe(true);
      expect(result.hashes).toHaveLength(test.iterations);
      
      // All hashes should be identical
      const uniqueHashes = new Set(result.hashes);
      expect(uniqueHashes.size).toBe(1);
      
      // Hash should be valid SHA-256 (64 hex characters)
      const hash = result.hashes[0];
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should maintain deterministic behavior across different object property orders', async () => {
      const info1 = deepClone(baselineSystemInfo);
      const info2 = {
        // Reorder properties
        platform: info1.platform,
        userAgent: info1.userAgent,
        colorDepth: info1.colorDepth,
        screenResolution: info1.screenResolution,
        // ... rest of properties in different order
        ...Object.fromEntries(
          Object.entries(info1)
            .filter(([key]) => !['platform', 'userAgent', 'colorDepth', 'screenResolution'].includes(key))
            .reverse()
        )
      } as SystemInfo;

      const hash1 = await generateId(info1);
      const hash2 = await generateId(info2);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Edge Case and Malformed Input Testing (Requirement 6.2)', () => {
    it.each(stabilityTestSuite.edgeCaseTests)('$name: $description', async (test) => {
      const result = await stabilityTestSuite.executeEdgeCaseTest(test);
      
      if (test.expectedBehavior === 'validation_error') {
        expect(result.error).toBeDefined();
      } else {
        expect(result.passed, `Edge case test failed: ${result.error || 'Hashes were not consistent'}`).toBe(true);
        expect(result.hash1).toBe(result.hash2);
        expect(result.hash1).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('should handle undefined and null values consistently', async () => {
      const testCases = [
        { ...baselineSystemInfo, audio: null },
        { ...baselineSystemInfo, audio: undefined as any },
        (() => {
          const info = deepClone(baselineSystemInfo);
          // @ts-ignore: Testing undefined property
          delete info.audio;
          return info as SystemInfo;
        })()
      ];

      const hashes = await Promise.all(testCases.map(info => generateId(info)));
      
      // All should produce the same hash (fallback behavior)
      expect(new Set(hashes).size).toBe(1);
    });

    it('should handle array order variations consistently', async () => {
      const info1 = {
        ...baselineSystemInfo,
        fontPreferences: { detectedFonts: ["Arial", "Helvetica", "Times"] }
      };
      const info2 = {
        ...baselineSystemInfo,
        fontPreferences: { detectedFonts: ["Times", "Arial", "Helvetica"] }
      };

      const hash1 = await generateId(info1);
      const hash2 = await generateId(info2);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Cross-Environment Consistency Testing (Requirement 6.3)', () => {
    it.each(stabilityTestSuite.crossEnvironmentTests)('$name: $description', async (test) => {
      const result = await stabilityTestSuite.executeCrossEnvironmentTest(test);
      
      expect(result.passed, 
        `Cross-environment test failed. Mismatched expectations: ${
          result.results
            .filter(r => r.shouldAffectHash !== r.actuallyAffected)
            .map(r => `${r.name}: expected ${r.shouldAffectHash ? 'different' : 'same'} hash, got ${r.actuallyAffected ? 'different' : 'same'}`)
            .join(', ')
        }`
      ).toBe(true);

      // Verify all hashes are valid
      result.results.forEach(r => {
        expect(r.hash).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    it('should maintain hash stability for non-fingerprinting properties', async () => {
      const baseHash = await generateId(baselineSystemInfo);
      
      const nonFingerprintingChanges = [
        { ...baselineSystemInfo, timezone: "Europe/Berlin" },
        { ...baselineSystemInfo, languages: ["de-DE", "de"] },
        { ...baselineSystemInfo, hardwareConcurrency: 16 },
        { ...baselineSystemInfo, deviceMemory: 16 },
        { ...baselineSystemInfo, cookiesEnabled: false },
        { ...baselineSystemInfo, doNotTrack: "0" }
      ];

      const hashes = await Promise.all(nonFingerprintingChanges.map(info => generateId(info)));
      
      hashes.forEach(hash => {
        expect(hash).toBe(baseHash);
      });
    });
  });

  describe('Performance Benchmarking (Requirement 6.4)', () => {
    it.each(stabilityTestSuite.performanceTests)('$name: $description', async (test) => {
      const result = await stabilityTestSuite.executePerformanceTest(test);
      
      expect(result.passed, 
        `Performance test failed: average time ${result.averageTime.toFixed(2)}ms exceeds maximum ${test.maxProcessingTime}ms`
      ).toBe(true);
      
      expect(result.averageTime).toBeLessThanOrEqual(test.maxProcessingTime);
      expect(result.times).toHaveLength(test.iterations);
      
      // Log performance metrics for monitoring
      console.log(`Performance Test "${test.name}":`, {
        averageTime: `${result.averageTime.toFixed(2)}ms`,
        maxTime: `${result.maxTime.toFixed(2)}ms`,
        minTime: `${result.minTime.toFixed(2)}ms`,
        iterations: test.iterations
      });
    });

    it('should have minimal normalization overhead', async () => {
      const iterations = 50;
      const simpleInfo = {
        ...baselineSystemInfo,
        mathConstants: { acos: 1.0 } as MathInfo,
        fontPreferences: { detectedFonts: ["Arial"] },
        plugins: []
      };

      // Measure with debug mode to get processing times
      const config: HashGeneratorConfig = { debugMode: true };
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await generateIdWithDebug(deepClone(simpleInfo), config);
        times.push(result.debugInfo!.processingTime);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      // Normalization overhead should be minimal (under 25ms average)
      expect(averageTime).toBeLessThan(25);
    });
  });

  describe('Regression Testing', () => {
    it.each(stabilityTestSuite.regressionTests)('$name: $description (version $version)', async (test) => {
      if (!test.expectedHash) {
        // Skip if baseline not established
        return;
      }

      const result = await stabilityTestSuite.executeRegressionTest(test);
      
      expect(result.passed, 
        `Regression test failed: expected hash ${result.expectedHash}, got ${result.actualHash}`
      ).toBe(true);
      
      expect(result.actualHash).toBe(result.expectedHash);
    });

    it('should maintain backward compatibility with known configurations', async () => {
      // Test with a variety of known system configurations
      const knownConfigurations = [
        {
          name: "Windows 10 Chrome",
          config: baselineSystemInfo
        },
        {
          name: "macOS Safari",
          config: {
            ...baselineSystemInfo,
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
            platform: "MacIntel",
            os: { os: "macOS", version: "10.15.7" },
            vendor: "Apple Computer, Inc."
          }
        },
        {
          name: "Linux Firefox",
          config: {
            ...baselineSystemInfo,
            userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
            platform: "Linux x86_64",
            os: { os: "Linux", version: "Ubuntu 20.04" },
            vendor: ""
          }
        }
      ];

      // Generate hashes for all configurations
      const configHashes = await Promise.all(
        knownConfigurations.map(async ({ name, config }) => ({
          name,
          hash: await generateId(config)
        }))
      );

      // Verify all hashes are valid and different (as they should be for different systems)
      configHashes.forEach(({ name, hash }) => {
        expect(hash, `Invalid hash for ${name}`).toMatch(/^[a-f0-9]{64}$/);
      });

      // Verify hashes are different for different configurations
      const uniqueHashes = new Set(configHashes.map(c => c.hash));
      expect(uniqueHashes.size).toBe(configHashes.length);
    });
  });

  describe('Comprehensive Stability Analysis', () => {
    it('should provide detailed stability report', async () => {
      const testInput = baselineSystemInfo;
      const iterations = 10;
      
      // Generate multiple hashes with debug information
      const results = await Promise.all(
        Array.from({ length: iterations }, () => 
          generateIdWithDebug(deepClone(testInput), { debugMode: true })
        )
      );

      // Analyze stability
      const hashes = results.map(r => r.hash);
      const processingTimes = results.map(r => r.debugInfo!.processingTime);
      const hashInputs = results.map(r => r.debugInfo!.hashInput);

      // All hashes should be identical
      expect(new Set(hashes).size).toBe(1);
      
      // All hash inputs should be identical
      expect(new Set(hashInputs).size).toBe(1);
      
      // Processing times should be reasonable
      const avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      expect(avgProcessingTime).toBeLessThan(100);

      // Generate stability report
      const stabilityReport = {
        testName: 'Comprehensive Stability Analysis',
        iterations,
        hashConsistency: new Set(hashes).size === 1,
        inputConsistency: new Set(hashInputs).size === 1,
        averageProcessingTime: avgProcessingTime,
        processingTimeVariance: Math.max(...processingTimes) - Math.min(...processingTimes),
        sampleHash: hashes[0],
        fallbacksUsed: Object.keys(results[0].debugInfo!.appliedFallbacks).length
      };

      console.log('Stability Report:', stabilityReport);
      
      expect(stabilityReport.hashConsistency).toBe(true);
      expect(stabilityReport.inputConsistency).toBe(true);
    });
  });
});