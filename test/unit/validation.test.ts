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
import { ValidationEngine, ValidationErrorType, ValidationConfig } from '../../src/validation';
import { SystemInfo } from '../../src/types';

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;
  let validSystemInfo: SystemInfo;

  beforeEach(() => {
    validationEngine = new ValidationEngine();
    
    // Create a valid SystemInfo object for testing
    validSystemInfo = {
      incognito: { isPrivate: false, browserName: 'Chrome' },
      bot: { isBot: false, signals: [], confidence: 0.1 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      languages: ['en-US', 'en'],
      cookiesEnabled: true,
      doNotTrack: null,
      screenResolution: [1920, 1080],
      colorDepth: 24,
      colorGamut: 'srgb',
      hardwareConcurrency: 8,
      deviceMemory: 8,
      os: { os: 'Windows', version: '10' },
      audio: 124.04344968475198,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webGL: {
        vendor: 'Google Inc. (Intel)',
        renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
        imageHash: 'abc123def456'
      },
      canvas: {
        winding: true,
        geometry: 'geometry_hash_123',
        text: 'text_hash_456'
      },
      plugins: [
        {
          name: 'Chrome PDF Plugin',
          description: 'Portable Document Format',
          mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf' }]
        }
      ],
      timezone: 'America/New_York',
      touchSupport: {
        maxTouchPoints: 0,
        touchEvent: false,
        touchStart: false
      },
      vendor: 'Google Inc.',
      vendorFlavors: ['chrome'],
      mathConstants: {
        acos: 1.4436354751788103,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649
      },
      fontPreferences: {
        detectedFonts: ['Arial', 'Times New Roman', 'Helvetica']
      },
      confidenceScore: 0.8
    };
  });

  describe('constructor', () => {
    it('should use default configuration when no config provided', () => {
      const engine = new ValidationEngine();
      expect(engine).toBeInstanceOf(ValidationEngine);
    });

    it('should merge provided configuration with defaults', () => {
      const customConfig: Partial<ValidationConfig> = {
        strictMode: true,
        maxStringLength: 5000
      };
      const engine = new ValidationEngine(customConfig);
      expect(engine).toBeInstanceOf(ValidationEngine);
    });
  });

  describe('validateSystemInfo', () => {
    it('should validate a complete valid SystemInfo object', () => {
      const result = validationEngine.validateSystemInfo(validSystemInfo);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    it('should return sanitized data even for valid input', () => {
      const result = validationEngine.validateSystemInfo(validSystemInfo);
      
      expect(result.sanitizedData).toEqual(expect.objectContaining({
        userAgent: expect.any(String),
        platform: expect.any(String),
        screenResolution: expect.any(Array)
      }));
    });

    it('should detect type mismatches', () => {
      const strictEngine = new ValidationEngine({ strictMode: true });
      const invalidInfo = {
        ...validSystemInfo,
        userAgent: 123, // Should be string
        colorDepth: 'invalid' // Should be number
      } as any;

      const result = strictEngine.validateSystemInfo(invalidInfo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].type).toBe(ValidationErrorType.TYPE_MISMATCH);
      expect(result.errors[1].type).toBe(ValidationErrorType.TYPE_MISMATCH);
    });

    it('should detect range violations', () => {
      const strictEngine = new ValidationEngine({ strictMode: true });
      const invalidInfo = {
        ...validSystemInfo,
        colorDepth: 200, // Should be <= 128
        hardwareConcurrency: 600, // Should be <= 512
        confidenceScore: 1.5 // Should be <= 1
      };

      const result = strictEngine.validateSystemInfo(invalidInfo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === ValidationErrorType.RANGE_VIOLATION)).toBe(true);
    });

    it('should handle missing required properties', () => {
      const strictEngine = new ValidationEngine({ strictMode: true, allowPartialData: false });
      const incompleteInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'Win32'
        // Missing many required properties
      } as any;

      const result = strictEngine.validateSystemInfo(incompleteInfo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize string values', () => {
      const dirtyInfo = {
        ...validSystemInfo,
        userAgent: '  Mozilla/5.0  \n\t  ',
        platform: 'Win32\x00\x1F'
      };

      const result = validationEngine.sanitizeInput(dirtyInfo);
      
      expect(result.userAgent).toBe('Mozilla/5.0');
      expect(result.platform).toBe('Win32');
    });

    it('should sanitize numeric values within bounds', () => {
      const dirtyInfo = {
        ...validSystemInfo,
        colorDepth: 128, // Should be clamped to 64
        hardwareConcurrency: -5, // Should be clamped to 1
        confidenceScore: 2.5 // Should be clamped to 1
      };

      const result = validationEngine.sanitizeInput(dirtyInfo);
      
      expect(result.colorDepth).toBe(128);
      expect(result.hardwareConcurrency).toBe(1);
      expect(result.confidenceScore).toBe(1);
    });

    it('should sanitize arrays', () => {
      const dirtyInfo = {
        ...validSystemInfo,
        languages: ['  en-US  ', 'en\n', '\t fr \t'],
        vendorFlavors: ['  chrome  ', 'webkit\x00']
      };

      const result = validationEngine.sanitizeInput(dirtyInfo);
      
      expect(result.languages).toEqual(['en-US', 'en', 'fr']);
      expect(result.vendorFlavors).toEqual(['chrome', 'webkit']);
    });

    it('should handle screen resolution sanitization', () => {
      const dirtyInfo = {
        ...validSystemInfo,
        screenResolution: [50000, -100] as [number, number]
      };

      const result = validationEngine.sanitizeInput(dirtyInfo);
      
      expect(result.screenResolution[0]).toBe(32768);
      expect(result.screenResolution[1]).toBe(0);
    });
  });

  describe('detectMaliciousInput', () => {
    it('should detect script injection patterns', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        userAgent: '<script>alert("xss")</script>Mozilla/5.0'
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should detect JavaScript protocol patterns', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        platform: 'javascript:alert(1)'
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should detect event handler patterns', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        colorGamut: 'srgb" onload="alert(1)'
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        timezone: "America/New_York'; DROP TABLE users; --"
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should detect path traversal patterns', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        vendor: '../../../etc/passwd'
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should detect excessively long strings', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        userAgent: 'A'.repeat(20000) // Exceeds default maxStringLength
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should detect suspicious numeric values', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        colorDepth: -999,
        hardwareConcurrency: 99999
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should detect malicious patterns in arrays', () => {
      const maliciousInfo = {
        ...validSystemInfo,
        languages: ['en-US', '<script>alert(1)</script>', 'fr']
      };

      const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
      expect(isMalicious).toBe(true);
    });

    it('should not flag legitimate input as malicious', () => {
      const isMalicious = validationEngine.detectMaliciousInput(validSystemInfo);
      expect(isMalicious).toBe(false);
    });
  });

  describe('edge cases and malformed data', () => {
    it('should handle null and undefined values', () => {
      const nullInfo = {
        ...validSystemInfo,
        userAgent: null,
        platform: undefined,
        languages: null
      } as any;

      const result = validationEngine.validateSystemInfo(nullInfo);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === ValidationErrorType.TYPE_MISMATCH)).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      const emptyInfo = {
        ...validSystemInfo,
        incognito: {},
        bot: {},
        plugins: [],
        languages: [],
        mathConstants: {}
      } as any;

      const result = validationEngine.validateSystemInfo(emptyInfo);
      
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed nested objects', () => {
      const malformedInfo = {
        ...validSystemInfo,
        webGL: {
          vendor: 123, // Should be string
          renderer: null, // Should be string
          imageHash: {} // Should be string or null
        },
        canvas: {
          winding: 'true', // Should be boolean
          geometry: 456, // Should be string
          text: [] // Should be string
        }
      } as any;

      const result = validationEngine.validateSystemInfo(malformedInfo);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.property.includes('webGL'))).toBe(true);
      expect(result.errors.some(e => e.property.includes('canvas'))).toBe(true);
    });

    it('should handle circular references gracefully', () => {
      const circularInfo: any = { ...validSystemInfo };
      circularInfo.circular = circularInfo;

      // Should not throw an error
      expect(() => {
        validationEngine.validateSystemInfo(circularInfo);
      }).not.toThrow();
    });

    it('should handle very large arrays', () => {
      const largeArrayInfo = {
        ...validSystemInfo,
        languages: new Array(2000).fill('en-US'), // Exceeds maxArrayLength
        plugins: new Array(2000).fill({
          name: 'Test Plugin',
          description: 'Test',
          mimeTypes: []
        })
      };

      const result = validationEngine.validateSystemInfo(largeArrayInfo);
      
      expect(result.errors.some(e => e.type === ValidationErrorType.RANGE_VIOLATION)).toBe(true);
    });

    it('should handle NaN and Infinity values', () => {
      const invalidNumericInfo = {
        ...validSystemInfo,
        colorDepth: NaN,
        hardwareConcurrency: Infinity,
        confidenceScore: -Infinity,
        audio: NaN
      };

      const sanitized = validationEngine.sanitizeInput(invalidNumericInfo);
      
      // NaN and Infinity should be sanitized to valid ranges
      expect(isFinite(sanitized.colorDepth)).toBe(true);
      expect(isFinite(sanitized.hardwareConcurrency)).toBe(true);
      expect(isFinite(sanitized.confidenceScore)).toBe(true);
    });
  });

  describe('configuration options', () => {
    it('should respect strictMode configuration', () => {
      const strictEngine = new ValidationEngine({ strictMode: true });
      const lenientEngine = new ValidationEngine({ strictMode: false });

      const partialInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'Win32'
        // Missing many properties
      } as any;

      const strictResult = strictEngine.validateSystemInfo(partialInfo);
      const lenientResult = lenientEngine.validateSystemInfo(partialInfo);

      // Both should have errors, but lenient might be more forgiving
      expect(strictResult.errors.length).toBeGreaterThan(0);
      expect(lenientResult.errors.length).toBeGreaterThan(0);
    });

    it('should respect maxStringLength configuration', () => {
      const shortLengthEngine = new ValidationEngine({ maxStringLength: 10 });
      
      const longStringInfo = {
        ...validSystemInfo,
        userAgent: 'This is a very long user agent string that exceeds the limit'
      };

      const result = shortLengthEngine.validateSystemInfo(longStringInfo);
      
      expect(result.sanitizedData.userAgent.length).toBeLessThanOrEqual(10);
    });

    it('should respect maxArrayLength configuration', () => {
      const shortArrayEngine = new ValidationEngine({ maxArrayLength: 2 });
      
      const longArrayInfo = {
        ...validSystemInfo,
        languages: ['en-US', 'en', 'fr', 'de', 'es'] // 5 items, limit is 2
      };

      const result = shortArrayEngine.validateSystemInfo(longArrayInfo);
      
      expect(result.sanitizedData.languages.length).toBeLessThanOrEqual(2);
    });

    it('should respect enableSecurityChecks configuration', () => {
      const secureEngine = new ValidationEngine({ enableSecurityChecks: true });
      const insecureEngine = new ValidationEngine({ enableSecurityChecks: false });

      const maliciousInfo = {
        ...validSystemInfo,
        userAgent: '<script>alert("xss")</script>Mozilla/5.0'
      };

      const secureResult = secureEngine.validateSystemInfo(maliciousInfo);
      const insecureResult = insecureEngine.validateSystemInfo(maliciousInfo);

      expect(secureResult.errors.some(e => e.type === ValidationErrorType.SECURITY_VIOLATION)).toBe(true);
      expect(insecureResult.errors.some(e => e.type === ValidationErrorType.SECURITY_VIOLATION)).toBe(false);
    });
  });

  describe('security validation effectiveness', () => {
    it('should prevent common XSS patterns', () => {
      const xssPatterns = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        'onload=alert(1)',
        'onerror=alert(1)',
        'eval("alert(1)")',
        'Function("alert(1)")()'
      ];

      xssPatterns.forEach(pattern => {
        const maliciousInfo = {
          ...validSystemInfo,
          userAgent: pattern
        };

        const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
        expect(isMalicious).toBe(true);
      });
    });

    it('should prevent SQL injection patterns', () => {
      const sqlPatterns = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "UNION SELECT * FROM users",
        "INSERT INTO users VALUES",
        "DELETE FROM users WHERE"
      ];

      sqlPatterns.forEach(pattern => {
        const maliciousInfo = {
          ...validSystemInfo,
          timezone: pattern
        };

        const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
        expect(isMalicious).toBe(true);
      });
    });

    it('should prevent path traversal attacks', () => {
      const pathTraversalPatterns = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '%2e%2e%5c%2e%2e%5c%2e%2e%5cwindows%5csystem32'
      ];

      pathTraversalPatterns.forEach(pattern => {
        const maliciousInfo = {
          ...validSystemInfo,
          vendor: pattern
        };

        const isMalicious = validationEngine.detectMaliciousInput(maliciousInfo);
        expect(isMalicious).toBe(true);
      });
    });
  });
});