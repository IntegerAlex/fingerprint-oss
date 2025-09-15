import { describe, it, expect } from 'vitest';
import { generateId, generateIdWithDebug, HashGeneratorConfig } from '@/src/hash';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo, MimeType } from '@/src/types';

/**
 * Performance Profiling and Bottleneck Analysis Suite
 * 
 * This test suite profiles the hash generation process to identify
 * performance bottlenecks and verify optimization effectiveness.
 * 
 * Requirements covered:
 * - Profile normalization performance and optimize bottlenecks
 */

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Performance profiling utilities
interface PerformanceProfile {
  operation: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
}

class PerformanceProfiler {
  private profiles: Map<string, number[]> = new Map();

  startProfile(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.profiles.has(operation)) {
        this.profiles.set(operation, []);
      }
      
      this.profiles.get(operation)!.push(duration);
    };
  }

  getProfile(operation: string): PerformanceProfile | null {
    const times = this.profiles.get(operation);
    if (!times || times.length === 0) {
      return null;
    }

    const sortedTimes = [...times].sort((a, b) => a - b);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const p95Index = Math.floor(times.length * 0.95);
    const p95Time = sortedTimes[p95Index];

    return {
      operation,
      duration: totalTime,
      iterations: times.length,
      averageTime,
      minTime,
      maxTime,
      p95Time
    };
  }

  getAllProfiles(): PerformanceProfile[] {
    return Array.from(this.profiles.keys())
      .map(operation => this.getProfile(operation))
      .filter((profile): profile is PerformanceProfile => profile !== null);
  }

  clear(): void {
    this.profiles.clear();
  }
}

// Test data configurations for profiling
const profilingConfigurations = {
  minimal: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    platform: "Win32",
    screenResolution: [1920, 1080] as [number, number],
    colorDepth: 24,
    colorGamut: "srgb",
    os: { os: "Windows", version: "10" },
    webGL: {
      vendor: "Google Inc.",
      renderer: "ANGLE",
      imageHash: "test_hash"
    } as WebGLInfo,
    canvas: {
      winding: true,
      geometry: "test_geometry",
      text: "test_text"
    } as CanvasInfo,
    audio: 123.456,
    fontPreferences: {
      detectedFonts: ["Arial", "Times"]
    } as FontPreferencesInfo,
    mathConstants: {
      acos: 1.23,
      acosh: 2.34
    } as MathInfo,
    plugins: [] as PluginInfo[],
    languages: ["en-US"],
    timezone: "UTC",
    incognito: { isPrivate: false, browserName: "Chrome" },
    bot: { isBot: false, signals: [], confidence: 0 },
    cookiesEnabled: true,
    doNotTrack: null,
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
    touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
    vendor: "Google Inc.",
    vendorFlavors: ["Chrome"],
    confidenceScore: 95,
    deviceMemory: 8,
    hardwareConcurrency: 4,
  } as SystemInfo,

  moderate: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "Win32",
    screenResolution: [1920, 1080] as [number, number],
    colorDepth: 24,
    colorGamut: "srgb",
    os: { os: "Windows", version: "10" },
    webGL: {
      vendor: "Google Inc. (NVIDIA)",
      renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      imageHash: "webgl_nvidia_rtx3070_hash_v1"
    } as WebGLInfo,
    canvas: {
      winding: true,
      geometry: "canvas_geometry_nvidia",
      text: "canvas_text_nvidia"
    } as CanvasInfo,
    audio: 124.04344968475198,
    fontPreferences: {
      detectedFonts: Array.from({ length: 20 }, (_, i) => `Font${i}`).sort()
    } as FontPreferencesInfo,
    mathConstants: {
      acos: 1.4455469250725552,
      acosh: 0.8813735870195429,
      asinh: 0.8813735870195429,
      atanh: 0.5493061443340549,
      expm1: 1.718281828459045,
      sinh: 1.1752011936438014,
      cosh: 1.5430806348152437,
      tanh: 0.7615941559557649,
    } as MathInfo,
    plugins: Array.from({ length: 10 }, (_, i) => ({
      name: `Plugin ${i}`,
      description: `Description ${i}`,
      mimeTypes: [{ type: `application/plugin${i}`, suffixes: `ext${i}` } as MimeType]
    })) as PluginInfo[],
    languages: ["en-US", "en", "fr"],
    timezone: "America/New_York",
    incognito: { isPrivate: false, browserName: "Chrome" },
    bot: { isBot: false, signals: [], confidence: 0 },
    cookiesEnabled: true,
    doNotTrack: null,
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
    touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
    vendor: "Google Inc.",
    vendorFlavors: ["Google Chrome"],
    confidenceScore: 95.7,
    deviceMemory: 8,
    hardwareConcurrency: 8,
  } as SystemInfo,

  complex: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "Win32",
    screenResolution: [3840, 2160] as [number, number],
    colorDepth: 32,
    colorGamut: "p3",
    os: { os: "Windows", version: "11" },
    webGL: {
      vendor: "Google Inc. (NVIDIA)",
      renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11-30.0.15.1179)",
      imageHash: "webgl_nvidia_rtx4090_complex_hash_v1"
    } as WebGLInfo,
    canvas: {
      winding: true,
      geometry: "complex_canvas_geometry_nvidia_rtx4090",
      text: "complex_canvas_text_nvidia_rtx4090"
    } as CanvasInfo,
    audio: 124.04344968475198,
    fontPreferences: {
      detectedFonts: Array.from({ length: 100 }, (_, i) => `ComplexFont${i.toString().padStart(3, '0')}`).sort()
    } as FontPreferencesInfo,
    mathConstants: {
      acos: 1.4455469250725552123456789,
      acosh: 0.8813735870195429123456789,
      asinh: 0.8813735870195429123456789,
      atanh: 0.5493061443340549123456789,
      expm1: 1.718281828459045123456789,
      sinh: 1.1752011936438014123456789,
      cosh: 1.5430806348152437123456789,
      tanh: 0.7615941559557649123456789,
    } as MathInfo,
    plugins: Array.from({ length: 50 }, (_, i) => ({
      name: `ComplexPlugin${i.toString().padStart(3, '0')}`,
      description: `Very detailed description for complex plugin ${i} with lots of information about its capabilities and features`,
      mimeTypes: Array.from({ length: 5 }, (_, j) => ({
        type: `application/complex-plugin${i}-type${j}`,
        suffixes: `ext${i}${j}`
      } as MimeType))
    })) as PluginInfo[],
    languages: ["en-US", "en", "fr-FR", "fr", "de-DE", "de", "es-ES", "es"],
    timezone: "America/New_York",
    incognito: { isPrivate: false, browserName: "Chrome" },
    bot: { isBot: false, signals: [], confidence: 0 },
    cookiesEnabled: true,
    doNotTrack: null,
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
    touchSupport: { maxTouchPoints: 10, touchEvent: true, touchStart: true },
    vendor: "Google Inc.",
    vendorFlavors: ["Google Chrome", "Chromium"],
    confidenceScore: 98.5,
    deviceMemory: 32,
    hardwareConcurrency: 16,
  } as SystemInfo
};

describe('Performance Profiling and Bottleneck Analysis', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
  });

  describe('Hash Generation Performance Profiling', () => {
    it('should profile hash generation with different data complexities', async () => {
      const iterations = 100;
      const configurations = Object.entries(profilingConfigurations);

      for (const [name, config] of configurations) {
        // Profile regular hash generation
        for (let i = 0; i < iterations; i++) {
          const endProfile = profiler.startProfile(`hash_generation_${name}`);
          await generateId(deepClone(config));
          endProfile();
        }

        // Profile debug hash generation
        for (let i = 0; i < Math.floor(iterations / 2); i++) {
          const endProfile = profiler.startProfile(`hash_generation_debug_${name}`);
          await generateIdWithDebug(deepClone(config), { debugMode: true });
          endProfile();
        }
      }

      // Analyze results
      const profiles = profiler.getAllProfiles();
      
      for (const profile of profiles) {
        console.log(`Performance Profile "${profile.operation}":`, {
          iterations: profile.iterations,
          averageTime: `${profile.averageTime.toFixed(2)}ms`,
          minTime: `${profile.minTime.toFixed(2)}ms`,
          maxTime: `${profile.maxTime.toFixed(2)}ms`,
          p95Time: `${profile.p95Time.toFixed(2)}ms`
        });

        // Performance expectations
        if (profile.operation.includes('minimal')) {
          expect(profile.averageTime).toBeLessThan(15); // Minimal should be very fast
        } else if (profile.operation.includes('moderate')) {
          expect(profile.averageTime).toBeLessThan(25); // Moderate complexity
        } else if (profile.operation.includes('complex')) {
          expect(profile.averageTime).toBeLessThan(50); // Complex data allowed more time
        }

        // Debug mode should not be more than 2x slower
        if (profile.operation.includes('debug')) {
          const regularProfile = profiles.find(p => 
            p.operation === profile.operation.replace('_debug', '')
          );
          if (regularProfile) {
            expect(profile.averageTime).toBeLessThan(regularProfile.averageTime * 2.5);
          }
        }
      }
    });

    it('should identify performance bottlenecks in normalization', async () => {
      const iterations = 50;
      const testData = profilingConfigurations.complex;

      // Profile different aspects of the hash generation
      for (let i = 0; i < iterations; i++) {
        // Profile with validation enabled
        const endValidationProfile = profiler.startProfile('with_validation');
        await generateId(deepClone(testData), { enableValidation: true });
        endValidationProfile();

        // Profile with validation disabled
        const endNoValidationProfile = profiler.startProfile('without_validation');
        await generateId(deepClone(testData), { enableValidation: false });
        endNoValidationProfile();

        // Profile with strict mode
        const endStrictProfile = profiler.startProfile('strict_mode');
        await generateId(deepClone(testData), { strictMode: true, enableValidation: true });
        endStrictProfile();
      }

      const validationProfile = profiler.getProfile('with_validation')!;
      const noValidationProfile = profiler.getProfile('without_validation')!;
      const strictProfile = profiler.getProfile('strict_mode')!;

      console.log('Normalization Bottleneck Analysis:', {
        withValidation: `${validationProfile.averageTime.toFixed(2)}ms`,
        withoutValidation: `${noValidationProfile.averageTime.toFixed(2)}ms`,
        strictMode: `${strictProfile.averageTime.toFixed(2)}ms`,
        validationOverhead: `${(validationProfile.averageTime - noValidationProfile.averageTime).toFixed(2)}ms`,
        strictModeOverhead: `${(strictProfile.averageTime - validationProfile.averageTime).toFixed(2)}ms`
      });

      // Validation overhead should be reasonable
      const validationOverhead = validationProfile.averageTime - noValidationProfile.averageTime;
      expect(validationOverhead).toBeLessThan(20); // Max 20ms overhead for validation

      // Strict mode should not add significant overhead
      const strictOverhead = strictProfile.averageTime - validationProfile.averageTime;
      expect(strictOverhead).toBeLessThan(10); // Max 10ms additional overhead for strict mode
    });

    it('should measure optimization effectiveness', async () => {
      const iterations = 100;
      const testConfigurations = [
        { name: 'small_array', data: { ...profilingConfigurations.minimal, fontPreferences: { detectedFonts: ['Arial', 'Times'] } } },
        { name: 'medium_array', data: { ...profilingConfigurations.moderate, fontPreferences: { detectedFonts: Array.from({ length: 20 }, (_, i) => `Font${i}`) } } },
        { name: 'large_array', data: { ...profilingConfigurations.complex, fontPreferences: { detectedFonts: Array.from({ length: 100 }, (_, i) => `Font${i}`) } } }
      ];

      for (const config of testConfigurations) {
        for (let i = 0; i < iterations; i++) {
          const endProfile = profiler.startProfile(`optimization_${config.name}`);
          await generateId(deepClone(config.data));
          endProfile();
        }
      }

      const smallProfile = profiler.getProfile('optimization_small_array')!;
      const mediumProfile = profiler.getProfile('optimization_medium_array')!;
      const largeProfile = profiler.getProfile('optimization_large_array')!;

      console.log('Optimization Effectiveness Analysis:', {
        smallArray: `${smallProfile.averageTime.toFixed(2)}ms`,
        mediumArray: `${mediumProfile.averageTime.toFixed(2)}ms`,
        largeArray: `${largeProfile.averageTime.toFixed(2)}ms`,
        scalingFactor: (largeProfile.averageTime / smallProfile.averageTime).toFixed(2)
      });

      // Performance should scale reasonably with data size
      const scalingFactor = largeProfile.averageTime / smallProfile.averageTime;
      expect(scalingFactor).toBeLessThan(5); // Should not be more than 5x slower for 50x more data

      // Medium should be between small and large
      expect(mediumProfile.averageTime).toBeGreaterThan(smallProfile.averageTime);
      expect(mediumProfile.averageTime).toBeLessThan(largeProfile.averageTime);
    });
  });

  describe('Memory Usage Profiling', () => {
    it('should profile memory usage during hash generation', async () => {
      const iterations = 1000;
      const testData = profilingConfigurations.moderate;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage();

      // Generate many hashes to test memory usage
      for (let i = 0; i < iterations; i++) {
        await generateId(deepClone(testData));
        
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
      const memoryPerHash = memoryIncrease / iterations;

      console.log('Memory Usage Profile:', {
        iterations,
        initialHeapUsed: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        finalHeapUsed: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        memoryPerHash: `${(memoryPerHash / 1024).toFixed(2)}KB`
      });

      // Memory usage should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      expect(memoryPerHash).toBeLessThan(50 * 1024); // Less than 50KB per hash
    });

    it('should profile memory usage with different configurations', async () => {
      const iterations = 200;
      const configurations = Object.entries(profilingConfigurations);
      const memoryProfiles: Array<{ name: string; memoryPerHash: number }> = [];

      for (const [name, config] of configurations) {
        if (global.gc) {
          global.gc();
        }

        const initialMemory = process.memoryUsage();

        for (let i = 0; i < iterations; i++) {
          await generateId(deepClone(config));
        }

        if (global.gc) {
          global.gc();
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryPerHash = memoryIncrease / iterations;

        memoryProfiles.push({ name, memoryPerHash });
      }

      console.log('Memory Usage by Configuration:', 
        memoryProfiles.map(p => ({ 
          name: p.name, 
          memoryPerHash: `${(p.memoryPerHash / 1024).toFixed(2)}KB` 
        }))
      );

      // Memory usage should scale reasonably with data complexity
      const minimalMemory = memoryProfiles.find(p => p.name === 'minimal')!.memoryPerHash;
      const complexMemory = memoryProfiles.find(p => p.name === 'complex')!.memoryPerHash;
      
      expect(complexMemory).toBeGreaterThan(minimalMemory);
      expect(complexMemory / minimalMemory).toBeLessThan(10); // Should not be more than 10x
    });
  });

  describe('Concurrent Performance Profiling', () => {
    it('should profile concurrent hash generation performance', async () => {
      const concurrentCount = 20;
      const iterations = 10;
      const testData = profilingConfigurations.moderate;

      const endProfile = profiler.startProfile('concurrent_generation');

      // Generate hashes concurrently
      const promises = Array.from({ length: concurrentCount }, async () => {
        const hashes: string[] = [];
        for (let i = 0; i < iterations; i++) {
          const hash = await generateId(deepClone(testData));
          hashes.push(hash);
        }
        return hashes;
      });

      const results = await Promise.all(promises);
      endProfile();

      const profile = profiler.getProfile('concurrent_generation')!;
      const totalHashes = results.flat().length;
      const averageTimePerHash = profile.duration / totalHashes;

      console.log('Concurrent Performance Profile:', {
        concurrentCount,
        iterationsPerConcurrent: iterations,
        totalHashes,
        totalTime: `${profile.duration.toFixed(2)}ms`,
        averageTimePerHash: `${averageTimePerHash.toFixed(2)}ms`
      });

      // Concurrent performance should be efficient
      expect(averageTimePerHash).toBeLessThan(30); // 30ms average per hash in concurrent scenario
      expect(profile.duration).toBeLessThan(5000); // Total time should be reasonable

      // All results should be valid
      results.flat().forEach(hash => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });
    });
  });
});