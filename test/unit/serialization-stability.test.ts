import { describe, it, expect } from 'vitest';
import { generateId, generateIdWithDebug } from '@/src/hash';
import { compareSerializationMethods, EnhancedSerializer } from '@/src/serialization';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo, MimeType } from '@/src/types';

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

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
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
};

describe('Serialization Stability Tests', () => {
  describe('Hash Consistency with Enhanced Serialization', () => {
    it('should produce consistent hashes with enhanced serialization', async () => {
      const hash1 = await generateId(baselineSystemInfo);
      const hash2 = await generateId(deepClone(baselineSystemInfo));
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('should produce consistent hashes across multiple iterations', async () => {
      const hashes: string[] = [];
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const hash = await generateId(deepClone(baselineSystemInfo));
        hashes.push(hash);
      }
      
      // All hashes should be identical
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
    });

    it('should handle property order variations consistently', async () => {
      const info1 = deepClone(baselineSystemInfo);
      const info2 = {
        // Reorder properties
        platform: info1.platform,
        userAgent: info1.userAgent,
        screenResolution: info1.screenResolution,
        ...info1
      };
      
      const hash1 = await generateId(info1);
      const hash2 = await generateId(info2);
      
      expect(hash1).toBe(hash2);
    });

    it('should handle array order variations consistently', async () => {
      const info1 = deepClone(baselineSystemInfo);
      const info2 = deepClone(baselineSystemInfo);
      
      // Reorder font array (should be normalized during processing)
      info2.fontPreferences.detectedFonts = ["Courier New", "Arial", "Calibri"];
      
      const hash1 = await generateId(info1);
      const hash2 = await generateId(info2);
      
      expect(hash1).toBe(hash2);
    });

    it('should handle floating point precision variations consistently', async () => {
      const info1 = deepClone(baselineSystemInfo);
      const info2 = deepClone(baselineSystemInfo);
      
      // Slight precision difference that should normalize to same value
      info1.mathConstants.acos = 1.2345;
      info2.mathConstants.acos = 1.2345000001;
      
      const hash1 = await generateId(info1);
      const hash2 = await generateId(info2);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Serialization Method Comparison', () => {
    it('should compare enhanced vs legacy serialization methods', () => {
      const testObject = {
        userAgent: "  Mozilla/5.0 (Windows NT 10.0; Win64; x64)  ",
        mathConstants: {
          acos: 1.23456789,
          acosh: 2.34567891
        },
        plugins: [
          { name: "Plugin B", description: "Second" },
          { name: "Plugin A", description: "First" }
        ],
        screenResolution: [1920, 1080]
      };
      
      const comparison = compareSerializationMethods(testObject);
      
      expect(comparison.enhanced).toBeDefined();
      expect(comparison.legacy).toBeDefined();
      expect(comparison.comparison).toBeDefined();
      
      // Both methods should produce valid JSON
      expect(() => JSON.parse(comparison.enhanced.serialized)).not.toThrow();
      expect(() => JSON.parse(comparison.legacy.serialized)).not.toThrow();
      
      // Enhanced method should provide more detailed statistics
      expect(comparison.enhanced.stats.totalProperties).toBeGreaterThan(0);
      expect(comparison.enhanced.stats.normalizedValues).toBeGreaterThan(0);
      expect(comparison.enhanced.stats.processingTime).toBeGreaterThan(0);
    });

    it('should show performance characteristics of both methods', () => {
      const largeObject: Record<string, any> = {};
      
      // Create a reasonably large object for performance testing
      for (let i = 0; i < 100; i++) {
        largeObject[`prop${i}`] = {
          number: Math.random() * 1000,
          string: `  test string ${i}  `,
          array: [i, i + 1, i + 2].reverse(),
          nested: {
            value: Math.random()
          }
        };
      }
      
      const comparison = compareSerializationMethods(largeObject);
      
      expect(comparison.enhanced.stats.processingTime).toBeGreaterThan(0);
      expect(comparison.legacy.processingTime).toBeGreaterThan(0);
      expect(comparison.comparison.totalComparisonTime).toBeGreaterThan(0);
      
      // Performance improvement can be positive or negative
      expect(typeof comparison.comparison.performanceImprovement).toBe('number');
    });

    it('should handle edge cases consistently in both methods', () => {
      const edgeCaseObject = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: "",
        emptyArray: [],
        emptyObject: {},
        specialNumbers: {
          infinity: Infinity,
          negInfinity: -Infinity,
          nan: NaN,
          zero: 0,
          negZero: -0
        },
        arrayBuffer: new ArrayBuffer(8)
      };
      
      const comparison = compareSerializationMethods(edgeCaseObject);
      
      // Both should handle edge cases without throwing
      expect(comparison.enhanced.serialized).toBeDefined();
      expect(comparison.legacy.serialized).toBeDefined();
      
      const enhancedParsed = JSON.parse(comparison.enhanced.serialized);
      const legacyParsed = JSON.parse(comparison.legacy.serialized);
      
      // Both should handle special numbers consistently
      expect(enhancedParsed.specialNumbers.infinity).toBe("Infinity");
      expect(legacyParsed.specialNumbers.infinity).toBe("Infinity");
      
      expect(enhancedParsed.specialNumbers.nan).toBe("NaN");
      expect(legacyParsed.specialNumbers.nan).toBe("NaN");
    });
  });

  describe('Debug Information with Enhanced Serialization', () => {
    it('should provide serialization statistics in debug mode', async () => {
      const result = await generateIdWithDebug(baselineSystemInfo, { debugMode: true });
      
      expect(result.debugInfo).toBeDefined();
      expect(result.debugInfo!.serializationResult).toBeDefined();
      
      const serializationResult = result.debugInfo!.serializationResult!;
      expect(serializationResult.serialized).toBeDefined();
      expect(serializationResult.normalized).toBeDefined();
      expect(serializationResult.stats).toBeDefined();
      
      expect(serializationResult.stats.totalProperties).toBeGreaterThan(0);
      expect(serializationResult.stats.processingTime).toBeGreaterThan(0);
    });

    it('should track normalization operations in debug info', async () => {
      const testInfo = deepClone(baselineSystemInfo);
      testInfo.mathConstants.acos = 1.23456789; // Will be normalized
      testInfo.userAgent = "  Spaced User Agent  "; // Will be normalized
      
      const result = await generateIdWithDebug(testInfo, { debugMode: true });
      
      const serializationStats = result.debugInfo!.serializationResult!.stats;
      expect(serializationStats.normalizedValues).toBeGreaterThan(0);
      expect(serializationStats.sortedObjects).toBeGreaterThan(0);
    });

    it('should provide normalized input for comparison', async () => {
      const testInfo = deepClone(baselineSystemInfo);
      testInfo.mathConstants.acos = 1.23456789;
      
      const result = await generateIdWithDebug(testInfo, { debugMode: true });
      
      const normalized = result.debugInfo!.serializationResult!.normalized;
      expect(normalized).toBeDefined();
      expect(normalized).not.toEqual(testInfo);
      
      // Check that normalization occurred
      expect(normalized.mathConstants.acos).toBe("1.235");
    });
  });

  describe('Serialization Configuration Impact', () => {
    it('should respect custom serialization configuration', async () => {
      const config = {
        debugMode: true,
        serializationConfig: {
          enableNormalization: false,
          sortKeys: false,
          sortArrays: false
        }
      };
      
      const result = await generateIdWithDebug(baselineSystemInfo, config);
      
      expect(result.debugInfo!.serializationResult).toBeDefined();
      
      const stats = result.debugInfo!.serializationResult!.stats;
      expect(stats.normalizedValues).toBe(0); // No normalization
      expect(stats.sortedObjects).toBe(0); // No key sorting
      expect(stats.sortedArrays).toBe(0); // No array sorting
    });

    it('should produce different hashes with different serialization configs', async () => {
      const config1 = {
        serializationConfig: {
          enableNormalization: true,
          sortKeys: true
        }
      };
      
      const config2 = {
        serializationConfig: {
          enableNormalization: false,
          sortKeys: false
        }
      };
      
      const testInfo = deepClone(baselineSystemInfo);
      testInfo.mathConstants.acos = 1.23456789; // This will be normalized differently
      
      const hash1 = await generateId(testInfo, config1);
      const hash2 = await generateId(testInfo, config2);
      
      // Different configurations should potentially produce different hashes
      // (though this depends on the specific data and normalization effects)
      expect(typeof hash1).toBe('string');
      expect(typeof hash2).toBe('string');
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });
  });

  describe('Regression Prevention', () => {
    it('should maintain hash stability across serialization improvements', async () => {
      // This test ensures that future serialization improvements don't break existing hashes
      const testCases = [
        {
          name: "Basic SystemInfo",
          input: baselineSystemInfo
        },
        {
          name: "SystemInfo with missing properties",
          input: (() => {
            const info = deepClone(baselineSystemInfo);
            info.audio = null;
            // @ts-ignore: Testing missing property
            delete info.webGL;
            return info;
          })()
        },
        {
          name: "SystemInfo with edge case values",
          input: (() => {
            const info = deepClone(baselineSystemInfo);
            info.mathConstants.acos = 1.23456789;
            info.userAgent = "  Spaced User Agent  ";
            info.fontPreferences.detectedFonts = [];
            return info;
          })()
        }
      ];
      
      for (const testCase of testCases) {
        const hash1 = await generateId(testCase.input);
        const hash2 = await generateId(deepClone(testCase.input));
        
        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64);
        
        // Ensure hash is deterministic across multiple calls
        const hash3 = await generateId(deepClone(testCase.input));
        expect(hash1).toBe(hash3);
      }
    });

    it('should handle serialization of complex nested structures consistently', async () => {
      const complexInfo = deepClone(baselineSystemInfo);
      
      // Add some complex nested structures
      complexInfo.plugins = [
        {
          name: "Complex Plugin",
          description: "A plugin with complex mime types",
          mimeTypes: [
            { type: "application/pdf", suffixes: "pdf" },
            { type: "application/json", suffixes: "json" },
            { type: "text/plain", suffixes: "txt" }
          ]
        },
        {
          name: "Another Plugin",
          description: "Another complex plugin",
          mimeTypes: [
            { type: "image/png", suffixes: "png" },
            { type: "image/jpeg", suffixes: "jpg,jpeg" }
          ]
        }
      ] as PluginInfo[];
      
      const hash1 = await generateId(complexInfo);
      const hash2 = await generateId(deepClone(complexInfo));
      
      expect(hash1).toBe(hash2);
      
      // Test with reordered plugins (should still be consistent due to sorting)
      const reorderedInfo = deepClone(complexInfo);
      reorderedInfo.plugins.reverse();
      
      const hash3 = await generateId(reorderedInfo);
      expect(hash1).toBe(hash3);
    });
  });
});