import { describe, it, expect } from 'vitest';
import { 
  reliableRound, 
  normalizeStringValue, 
  normalizeArrayValue, 
  normalizeObjectValue,
  normalizeValue 
} from '@/src/normalization';

describe('reliableRound', () => {
  it('should round numbers to specified precision with consistent string formatting', () => {
    expect(reliableRound(1.2345, 3)).toBe('1.235');
    expect(reliableRound(1.2344, 3)).toBe('1.234');
    expect(reliableRound(1.2346, 3)).toBe('1.235');
  });

  it('should handle default precision of 3 decimal places', () => {
    expect(reliableRound(1.2345)).toBe('1.235');
    expect(reliableRound(1.2344)).toBe('1.234');
  });

  it('should handle zero precision', () => {
    expect(reliableRound(1.7, 0)).toBe('2');
    expect(reliableRound(1.4, 0)).toBe('1');
  });

  it('should handle negative numbers', () => {
    expect(reliableRound(-1.2345, 3)).toBe('-1.235');
    expect(reliableRound(-1.2344, 3)).toBe('-1.234');
  });

  it('should handle edge cases with NaN', () => {
    expect(reliableRound(NaN, 3)).toBe('NaN');
  });

  it('should handle edge cases with Infinity', () => {
    expect(reliableRound(Infinity, 3)).toBe('Infinity');
    expect(reliableRound(-Infinity, 3)).toBe('-Infinity');
  });

  it('should clamp precision to reasonable bounds', () => {
    expect(reliableRound(1.23456789, -1)).toBe('1'); // Clamped to 0
    expect(reliableRound(1.23456789, 15)).toBe('1.2345678900'); // Clamped to 10
  });

  it('should handle very large numbers', () => {
    expect(reliableRound(1234567890.123, 2)).toBe('1234567890.12');
  });

  it('should handle very small numbers', () => {
    expect(reliableRound(0.000123456, 6)).toBe('0.000123');
  });

  it('should produce consistent results for the same input', () => {
    const value = 1.2345;
    const result1 = reliableRound(value, 3);
    const result2 = reliableRound(value, 3);
    expect(result1).toBe(result2);
  });
});

describe('normalizeStringValue', () => {
  it('should normalize whitespace consistently', () => {
    expect(normalizeStringValue('  hello   world  ')).toBe('hello world');
    expect(normalizeStringValue('hello\t\n\r world')).toBe('hello world');
    expect(normalizeStringValue('hello     world')).toBe('hello world');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(normalizeStringValue('  hello world  ')).toBe('hello world');
    expect(normalizeStringValue('\n\t hello world \r\n')).toBe('hello world');
  });

  it('should normalize Unicode to NFC form', () => {
    // Using Unicode combining characters
    const decomposed = 'e\u0301'; // e + combining acute accent
    const composed = '\u00e9'; // é (precomposed)
    expect(normalizeStringValue(decomposed)).toBe(normalizeStringValue(composed));
  });

  it('should remove zero-width characters', () => {
    const stringWithZeroWidth = 'hello\u200Bworld\u200C\u200D\uFEFF';
    expect(normalizeStringValue(stringWithZeroWidth)).toBe('helloworld');
  });

  it('should handle non-string inputs by converting to string', () => {
    expect(normalizeStringValue(123 as any)).toBe('123');
    expect(normalizeStringValue(true as any)).toBe('true');
    expect(normalizeStringValue(null as any)).toBe('null');
  });

  it('should handle empty strings', () => {
    expect(normalizeStringValue('')).toBe('');
    expect(normalizeStringValue('   ')).toBe('');
  });

  it('should produce consistent results for equivalent inputs', () => {
    const input1 = '  hello   world  ';
    const input2 = '\thello\n\nworld\r';
    expect(normalizeStringValue(input1)).toBe(normalizeStringValue(input2));
  });
});

describe('normalizeArrayValue', () => {
  it('should sort arrays deterministically', () => {
    const array1 = ['zebra', 'apple', 'banana'];
    const array2 = ['banana', 'zebra', 'apple'];
    const result1 = normalizeArrayValue(array1);
    const result2 = normalizeArrayValue(array2);
    expect(result1).toEqual(result2);
    expect(result1).toEqual(['apple', 'banana', 'zebra']);
  });

  it('should normalize string elements in arrays', () => {
    const array = ['  hello  ', '\tworld\n', '  test  '];
    const result = normalizeArrayValue(array);
    expect(result).toEqual(['hello', 'test', 'world']);
  });

  it('should normalize numeric elements in arrays', () => {
    const array = [1.2345, 2.6789, 1.2344];
    const result = normalizeArrayValue(array);
    expect(result).toEqual(['1.234', '1.235', '2.679']);
  });

  it('should handle nested arrays recursively', () => {
    const array = [['c', 'a'], ['b', 'd']];
    const result = normalizeArrayValue(array);
    expect(result).toEqual([['a', 'c'], ['b', 'd']]);
  });

  it('should handle mixed data types', () => {
    const array = [3.14159, 'hello world', 1.234, '  test  '];
    const result = normalizeArrayValue(array);
    expect(result).toEqual(['1.234', '3.142', 'hello world', 'test']);
  });

  it('should handle objects in arrays', () => {
    const array = [{ b: 2, a: 1 }, { d: 4, c: 3 }];
    const result = normalizeArrayValue(array);
    expect(result).toEqual([{ a: '1.000', b: '2.000' }, { c: '3.000', d: '4.000' }]);
  });

  it('should return empty array for non-array inputs', () => {
    expect(normalizeArrayValue('not an array' as any)).toEqual([]);
    expect(normalizeArrayValue(123 as any)).toEqual([]);
    expect(normalizeArrayValue(null as any)).toEqual([]);
  });

  it('should handle empty arrays', () => {
    expect(normalizeArrayValue([])).toEqual([]);
  });

  it('should produce consistent results for equivalent inputs', () => {
    const array1 = ['zebra', 'apple', 'banana'];
    const array2 = ['banana', 'zebra', 'apple'];
    const result1 = normalizeArrayValue(array1);
    const result2 = normalizeArrayValue(array2);
    expect(result1).toEqual(result2);
  });
});

describe('normalizeObjectValue', () => {
  it('should sort object keys alphabetically', () => {
    const obj = { zebra: 1, apple: 2, banana: 3 };
    const result = normalizeObjectValue(obj);
    const keys = Object.keys(result);
    expect(keys).toEqual(['apple', 'banana', 'zebra']);
  });

  it('should normalize string values in objects', () => {
    const obj = { 
      key1: '  hello  ', 
      key2: '\tworld\n' 
    };
    const result = normalizeObjectValue(obj);
    expect(result).toEqual({ 
      key1: 'hello', 
      key2: 'world' 
    });
  });

  it('should normalize numeric values in objects', () => {
    const obj = { 
      pi: 3.14159, 
      e: 2.71828 
    };
    const result = normalizeObjectValue(obj);
    expect(result).toEqual({ 
      e: '2.718', 
      pi: '3.142' 
    });
  });

  it('should handle nested objects recursively', () => {
    const obj = {
      outer: {
        zebra: 1,
        apple: 2
      },
      simple: 'value'
    };
    const result = normalizeObjectValue(obj);
    expect(result).toEqual({
      outer: {
        apple: '2.000',
        zebra: '1.000'
      },
      simple: 'value'
    });
  });

  it('should handle arrays in objects', () => {
    const obj = {
      fruits: ['zebra', 'apple', 'banana'],
      numbers: [3.14, 1.23]
    };
    const result = normalizeObjectValue(obj);
    expect(result).toEqual({
      fruits: ['apple', 'banana', 'zebra'],
      numbers: ['1.230', '3.140']
    });
  });

  it('should normalize object keys', () => {
    const obj = {
      '  key1  ': 'value1',
      '\tkey2\n': 'value2'
    };
    const result = normalizeObjectValue(obj);
    expect(result).toEqual({
      'key1': 'value1',
      'key2': 'value2'
    });
  });

  it('should return empty object for non-object inputs', () => {
    expect(normalizeObjectValue('not an object' as any)).toEqual({});
    expect(normalizeObjectValue(123 as any)).toEqual({});
    expect(normalizeObjectValue(null as any)).toEqual({});
    expect(normalizeObjectValue([] as any)).toEqual({});
  });

  it('should handle empty objects', () => {
    expect(normalizeObjectValue({})).toEqual({});
  });

  it('should produce consistent results for equivalent inputs', () => {
    const obj1 = { zebra: 1, apple: 2 };
    const obj2 = { apple: 2, zebra: 1 };
    const result1 = normalizeObjectValue(obj1);
    const result2 = normalizeObjectValue(obj2);
    expect(result1).toEqual(result2);
  });
});

describe('normalizeValue', () => {
  it('should delegate to appropriate normalization functions', () => {
    // String
    expect(normalizeValue('  hello  ')).toBe('hello');
    
    // Number
    expect(normalizeValue(3.14159)).toBe('3.142');
    
    // Array
    expect(normalizeValue(['zebra', 'apple'])).toEqual(['apple', 'zebra']);
    
    // Object
    expect(normalizeValue({ zebra: 1, apple: 2 })).toEqual({ apple: '2.000', zebra: '1.000' });
  });

  it('should return primitive values as-is for unsupported types', () => {
    expect(normalizeValue(true)).toBe(true);
    expect(normalizeValue(null)).toBe(null);
    expect(normalizeValue(undefined)).toBe(undefined);
  });

  it('should handle complex nested structures', () => {
    const complex = {
      strings: ['  hello  ', '\tworld\n'],
      numbers: [3.14159, 2.71828],
      nested: {
        zebra: 1.234,
        apple: '  test  '
      }
    };
    
    const result = normalizeValue(complex);
    expect(result).toEqual({
      nested: {
        apple: 'test',
        zebra: '1.234'
      },
      numbers: ['2.718', '3.142'],
      strings: ['hello', 'world']
    });
  });
});

describe('Integration tests', () => {
  it('should produce identical results for equivalent but differently formatted data', () => {
    const data1 = {
      userAgent: '  Mozilla/5.0  ',
      screenResolution: [1920.0, 1080.0],
      fonts: ['Arial', 'Helvetica', 'Times'],
      mathConstants: {
        pi: 3.14159265,
        e: 2.71828182
      }
    };

    const data2 = {
      mathConstants: {
        e: 2.71828182,
        pi: 3.14159265
      },
      fonts: ['Times', 'Arial', 'Helvetica'],
      screenResolution: [1920, 1080],
      userAgent: 'Mozilla/5.0'
    };

    const normalized1 = normalizeValue(data1);
    const normalized2 = normalizeValue(data2);
    
    expect(normalized1).toEqual(normalized2);
  });

  it('should maintain deterministic behavior across multiple calls', () => {
    const testData = {
      mixed: [3.14159, '  hello  ', { zebra: 1, apple: 2 }],
      numbers: [1.2345, 2.6789, 1.2344]
    };

    const result1 = normalizeValue(testData);
    const result2 = normalizeValue(testData);
    const result3 = normalizeValue(testData);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });
});