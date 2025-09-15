import { describe, it, expect } from 'vitest';
import {
  EnhancedSerializer,
  SerializationConfig,
  serializeWithNormalization,
  serializeWithDetails,
  compareSerializationMethods,
  DEFAULT_SERIALIZATION_CONFIG
} from '@/src/serialization';
import { SystemInfo } from '@/src/types';

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const testSystemInfo: Partial<SystemInfo> = {
  userAgent: "  Mozilla/5.0 (Windows NT 10.0; Win64; x64)  ",
  platform: "Win32",
  screenResolution: [1920, 1080],
  colorDepth: 24.000001, // Will be normalized
  colorGamut: "srgb",
  mathConstants: {
    acos: 1.23456789, // Will be normalized to 3 decimal places
    acosh: 2.34567891,
    asinh: 3.45678912
  },
  plugins: [
    { name: "Plugin B", description: "Second plugin", mimeTypes: [] },
    { name: "Plugin A", description: "First plugin", mimeTypes: [] }
  ]
};

const complexNestedObject = {
  level1: {
    level2: {
      level3: {
        array: [3, 1, 2],
        string: "  test string  ",
        number: 1.23456789,
        nested: {
          prop: "value"
        }
      }
    }
  },
  topLevelArray: ["c", "a", "b"],
  topLevelNumber: 9.87654321
};

describe('EnhancedSerializer', () => {
  describe('Basic Serialization', () => {
    it('should serialize simple objects deterministically', () => {
      const serializer = new EnhancedSerializer();
      const obj = { b: 2, a: 1, c: 3 };

      const result1 = serializer.serialize(obj);
      const result2 = serializer.serialize(obj);

      expect(result1.serialized).toBe(result2.serialized);
      expect(result1.serialized).toContain('"a":"1.000"');
      expect(result1.serialized).toContain('"b":"2.000"');
      expect(result1.serialized).toContain('"c":"3.000"');
    });

    it('should sort object keys alphabetically by default', () => {
      const serializer = new EnhancedSerializer();
      const obj = { zebra: 1, alpha: 2, beta: 3 };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);
      const keys = Object.keys(parsed);

      expect(keys).toEqual(['alpha', 'beta', 'zebra']);
    });

    it('should sort arrays deterministically by default', () => {
      const serializer = new EnhancedSerializer();
      const obj = { array: [3, 1, 2, "c", "a", "b"] };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      // Numbers and strings should be sorted as strings for consistency
      expect(parsed.array).toEqual(["1.000", "2.000", "3.000", "a", "b", "c"]);
    });

    it('should normalize numeric values to consistent precision', () => {
      const serializer = new EnhancedSerializer();
      const obj = {
        precise: 1.23456789,
        imprecise: 1.23456789123456789
      };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.precise).toBe("1.235");
      expect(parsed.imprecise).toBe("1.235");
    });

    it('should normalize string values consistently', () => {
      const serializer = new EnhancedSerializer();
      const obj = {
        spaced: "  multiple   spaces  ",
        normal: "normal string"
      };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.spaced).toBe("multiple spaces");
      expect(parsed.normal).toBe("normal string");
    });
  });

  describe('Configuration Options', () => {
    it('should respect enableNormalization setting', () => {
      const serializer = new EnhancedSerializer({ enableNormalization: false });
      const obj = {
        number: 1.23456789,
        string: "  spaced  "
      };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.number).toBe(1.23456789);
      expect(parsed.string).toBe("  spaced  ");
    });

    it('should respect sortKeys setting', () => {
      const serializer = new EnhancedSerializer({ sortKeys: false });
      const obj = { zebra: 1, alpha: 2, beta: 3 };

      const result = serializer.serialize(obj);

      // Keys should maintain original order when sorting is disabled
      expect(result.serialized).toBe('{"zebra":"1.000","alpha":"2.000","beta":"3.000"}');
    });

    it('should respect sortArrays setting', () => {
      const serializer = new EnhancedSerializer({
        sortArrays: false,
        enableNormalization: false
      });
      const obj = { array: [3, 1, 2] };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.array).toEqual([3, 1, 2]);
    });

    it('should respect maxDepth setting', () => {
      const serializer = new EnhancedSerializer({ maxDepth: 2 });
      const deepObj = {
        level1: {
          level2: {
            level3: {
              level4: "too deep"
            }
          }
        }
      };

      const result = serializer.serialize(deepObj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.level1.level2.level3).toBe('[MAX_DEPTH_EXCEEDED]');
    });

    it('should handle includeNulls and includeUndefined settings', () => {
      const serializer = new EnhancedSerializer({
        includeNulls: false,
        includeUndefined: false
      });
      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        normalValue: "test"
      };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.nullValue).toBeUndefined();
      expect(parsed.undefinedValue).toBeUndefined();
      expect(parsed.normalValue).toBe("test");
    });

    it('should use custom replacer when provided', () => {
      const customReplacer = (key: string, value: any) => {
        if (key === 'secret') return '[REDACTED]';
        return value;
      };

      const serializer = new EnhancedSerializer({ customReplacer });
      const obj = {
        public: "visible",
        secret: "hidden"
      };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.public).toBe("visible");
      expect(parsed.secret).toBe("[REDACTED]");
    });
  });

  describe('Complex Object Handling', () => {
    it('should handle deeply nested objects correctly', () => {
      const serializer = new EnhancedSerializer();

      const result = serializer.serialize(complexNestedObject);

      expect(result.serialized).toBeDefined();
      expect(result.stats.maxDepthReached).toBeGreaterThan(1);
      expect(result.stats.sortedObjects).toBeGreaterThan(0);
      expect(result.stats.sortedArrays).toBeGreaterThan(0);
    });

    it('should handle SystemInfo objects correctly', () => {
      const serializer = new EnhancedSerializer();

      const result = serializer.serialize(testSystemInfo);

      expect(result.serialized).toBeDefined();
      expect(result.stats.normalizedValues).toBeGreaterThan(0);

      const parsed = JSON.parse(result.serialized);
      expect(parsed.userAgent).toBe("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
      expect(parsed.colorDepth).toBe("24.000");
    });

    it('should handle arrays of objects consistently', () => {
      const serializer = new EnhancedSerializer();
      const obj = {
        items: [
          { name: "Item B", value: 2 },
          { name: "Item A", value: 1 }
        ]
      };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      // Objects in array should be sorted by their string representation
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0].name).toBe("Item A");
      expect(parsed.items[1].name).toBe("Item B");
    });

    it('should handle special values correctly', () => {
      const serializer = new EnhancedSerializer();
      const obj = {
        infinity: Infinity,
        negInfinity: -Infinity,
        nan: NaN,
        arrayBuffer: new ArrayBuffer(8),
        func: () => "test",
        symbol: Symbol('test'),
        bigint: BigInt(123)
      };

      const result = serializer.serialize(obj);
      const parsed = JSON.parse(result.serialized);

      expect(parsed.infinity).toBe("Infinity");
      expect(parsed.negInfinity).toBe("-Infinity");
      expect(parsed.nan).toBe("NaN");
      expect(parsed.arrayBuffer).toBe("");
      expect(parsed.func).toBe("[Function]");
      expect(parsed.symbol).toContain("Symbol");
      expect(parsed.bigint).toBe("123");
    });
  });

  describe('Statistics Collection', () => {
    it('should collect accurate statistics during serialization', () => {
      const serializer = new EnhancedSerializer();

      const result = serializer.serialize(complexNestedObject);

      expect(result.stats.totalProperties).toBeGreaterThan(0);
      expect(result.stats.normalizedValues).toBeGreaterThan(0);
      expect(result.stats.sortedArrays).toBeGreaterThan(0);
      expect(result.stats.sortedObjects).toBeGreaterThan(0);
      expect(result.stats.processingTime).toBeGreaterThan(0);
      expect(result.stats.maxDepthReached).toBeGreaterThan(0);
    });

    it('should track normalization operations correctly', () => {
      const serializer = new EnhancedSerializer();
      const obj = {
        numbers: [1.23456, 2.34567, 3.45678],
        strings: ["  spaced  ", "normal"],
        nested: {
          moreNumbers: 4.56789
        }
      };

      const result = serializer.serialize(obj);

      // Should normalize 4 numbers and 1 string
      expect(result.stats.normalizedValues).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Legacy Comparison', () => {
    it('should provide legacy serialization for comparison', () => {
      const serializer = new EnhancedSerializer();
      const obj = { b: 2.123456, a: "  test  " };

      const legacySerialized = serializer.serializeLegacy(obj);

      expect(legacySerialized).toBeDefined();
      expect(typeof legacySerialized).toBe('string');

      // Legacy should still sort keys and normalize numbers
      const parsed = JSON.parse(legacySerialized);
      expect(Object.keys(parsed)).toEqual(['a', 'b']);
      expect(parsed.b).toBe("2.123");
    });

    it('should compare enhanced vs legacy serialization', () => {
      const serializer = new EnhancedSerializer();
      const obj = { b: 2.123456, a: "  test  " };

      const comparison = serializer.compareSerializationMethods(obj);

      expect(comparison.enhanced).toBeDefined();
      expect(comparison.legacy).toBeDefined();
      expect(comparison.comparison).toBeDefined();

      expect(comparison.comparison.identical).toBeDefined();
      expect(comparison.comparison.lengthDifference).toBeDefined();
      expect(comparison.comparison.performanceImprovement).toBeDefined();
      expect(comparison.comparison.totalComparisonTime).toBeGreaterThan(0);
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce identical results for identical inputs', () => {
      const serializer = new EnhancedSerializer();
      const obj = deepClone(testSystemInfo);

      const result1 = serializer.serialize(obj);
      const result2 = serializer.serialize(obj);

      expect(result1.serialized).toBe(result2.serialized);
    });

    it('should produce identical results regardless of input property order', () => {
      const serializer = new EnhancedSerializer();

      const obj1 = { c: 3, a: 1, b: 2 };
      const obj2 = { a: 1, b: 2, c: 3 };

      const result1 = serializer.serialize(obj1);
      const result2 = serializer.serialize(obj2);

      expect(result1.serialized).toBe(result2.serialized);
    });

    it('should produce identical results regardless of array element order when sorting enabled', () => {
      const serializer = new EnhancedSerializer();

      const obj1 = { array: [3, 1, 2] };
      const obj2 = { array: [1, 2, 3] };

      const result1 = serializer.serialize(obj1);
      const result2 = serializer.serialize(obj2);

      expect(result1.serialized).toBe(result2.serialized);
    });

    it('should handle floating point precision consistently', () => {
      const serializer = new EnhancedSerializer();

      const obj1 = { value: 1.2345 };
      const obj2 = { value: 1.2345000001 }; // Should normalize to same value

      const result1 = serializer.serialize(obj1);
      const result2 = serializer.serialize(obj2);

      expect(result1.serialized).toBe(result2.serialized);
    });
  });
});

describe('Convenience Functions', () => {
  describe('serializeWithNormalization', () => {
    it('should provide quick serialization with default settings', () => {
      const obj = { b: 2.123456, a: "  test  " };

      const serialized = serializeWithNormalization(obj);

      expect(typeof serialized).toBe('string');

      const parsed = JSON.parse(serialized);
      expect(Object.keys(parsed)).toEqual(['a', 'b']);
      expect(parsed.a).toBe("test");
      expect(parsed.b).toBe("2.123");
    });

    it('should accept configuration overrides', () => {
      const obj = { b: 2.123456, a: "  test  " };

      const serialized = serializeWithNormalization(obj, {
        enableNormalization: false
      });

      const parsed = JSON.parse(serialized);
      expect(parsed.a).toBe("  test  ");
      expect(parsed.b).toBe(2.123456);
    });
  });

  describe('serializeWithDetails', () => {
    it('should provide detailed serialization results', () => {
      const obj = { b: 2.123456, a: "  test  " };

      const result = serializeWithDetails(obj);

      expect(result.serialized).toBeDefined();
      expect(result.normalized).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.totalProperties).toBeGreaterThan(0);
    });
  });

  describe('compareSerializationMethods', () => {
    it('should compare enhanced vs legacy methods', () => {
      const obj = { b: 2.123456, a: "  test  " };

      const comparison = compareSerializationMethods(obj);

      expect(comparison.enhanced).toBeDefined();
      expect(comparison.legacy).toBeDefined();
      expect(comparison.comparison).toBeDefined();
      expect(comparison.comparison.totalComparisonTime).toBeGreaterThan(0);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle circular references gracefully', () => {
    const serializer = new EnhancedSerializer({ maxDepth: 3 });
    const obj: any = { name: "test" };
    obj.self = obj; // Create circular reference

    const result = serializer.serialize(obj);

    expect(result.serialized).toBeDefined();
    expect(result.serialized).toContain('[MAX_DEPTH_EXCEEDED]');
  });

  it('should handle empty objects and arrays', () => {
    const serializer = new EnhancedSerializer();
    const obj = {
      emptyObject: {},
      emptyArray: [],
      normalProp: "test"
    };

    const result = serializer.serialize(obj);
    const parsed = JSON.parse(result.serialized);

    expect(parsed.emptyObject).toEqual({});
    expect(parsed.emptyArray).toEqual([]);
    expect(parsed.normalProp).toBe("test");
  });

  it('should handle very large objects without crashing', () => {
    const serializer = new EnhancedSerializer();
    const largeObj: Record<string, number> = {};

    // Create object with 1000 properties
    for (let i = 0; i < 1000; i++) {
      largeObj[`prop${i}`] = Math.random();
    }

    const result = serializer.serialize(largeObj);

    expect(result.serialized).toBeDefined();
    expect(result.stats.totalProperties).toBeGreaterThan(1000);
  });

  it('should handle mixed data types in arrays', () => {
    const serializer = new EnhancedSerializer();
    const obj = {
      mixedArray: [
        "string",
        123.456,
        { nested: "object" },
        [1, 2, 3],
        null,
        true,
        false
      ]
    };

    const result = serializer.serialize(obj);
    const parsed = JSON.parse(result.serialized);

    expect(Array.isArray(parsed.mixedArray)).toBe(true);
    expect(parsed.mixedArray.length).toBe(7);
  });
});