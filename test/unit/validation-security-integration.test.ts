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
import { ValidationEngine, ValidationErrorType } from '../../src/validation';
import { SecurityThreatType } from '../../src/security';
import { generateIdWithDebug } from '../../src/hash';
import { SystemInfo } from '../../src/types';

describe('Validation Engine Security Integration', () => {
  let validationEngine: ValidationEngine;
  let baseSystemInfo: SystemInfo;

  beforeEach(() => {
    validationEngine = new ValidationEngine({
      enableSecurityChecks: true,
      enableEntropyValidation: true,
      enableManipulationResistance: true,
      strictMode: false
    });
    
    baseSystemInfo = {
      incognito: { isPrivate: false, browserName: 'Chrome' },
      bot: { isBot: false, signals: [], confidence: 0.1 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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
        renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        imageHash: 'abc123def456'
      },
      canvas: {
        winding: true,
        geometry: 'canvas_geo_hash_123',
        text: 'canvas_text_hash_456'
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
        detectedFonts: ['Arial', 'Times New Roman', 'Helvetica', 'Calibri']
      },
      confidenceScore: 0.95
    };
  });

  describe('Security Validation Integration', () => {
    it('should validate legitimate system information as secure', () => {
      const result = validationEngine.validateSystemInfo(baseSystemInfo);
      
      expect(result.isValid).toBe(true);
      expect(result.securityValidation).toBeDefined();
      expect(result.securityValidation?.isSecure).toBe(true);
      expect(result.securityValidation?.entropyScore).toBeGreaterThan(0.7);
      expect(result.securityValidation?.manipulationResistanceScore).toBeGreaterThan(0.5);
    });

    it('should detect and flag security violations', () => {
      const maliciousInfo = {
        ...baseSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124 <script>alert("xss")</script>',
        platform: 'Win32; DROP TABLE users; --',
        hardwareConcurrency: 512 // Unrealistic value
      };

      const result = validationEngine.validateSystemInfo(maliciousInfo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === ValidationErrorType.SECURITY_VIOLATION)).toBe(true);
      expect(result.securityValidation?.isSecure).toBe(false);
      expect(result.securityValidation?.threats.length).toBeGreaterThan(0);
    });

    it('should provide detailed security analysis in validation results', () => {
      const suspiciousInfo = {
        ...baseSystemInfo,
        canvas: { winding: false, geometry: 'blocked', text: 'blocked' },
        webGL: { vendor: 'blocked', renderer: 'blocked', imageHash: null }
      };

      const result = validationEngine.validateSystemInfo(suspiciousInfo);
      
      expect(result.securityValidation).toBeDefined();
      expect(result.securityValidation?.threats.length).toBeGreaterThan(0);
      expect(result.securityValidation?.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Entropy Validation', () => {
    it('should validate entropy preservation', () => {
      const result = validationEngine.validateSystemInfo(baseSystemInfo);
      
      expect(validationEngine.validateEntropyPreservation(
        baseSystemInfo, 
        result.sanitizedData
      )).toBe(true);
    });

    it('should detect entropy loss', () => {
      const lowEntropyInfo = {
        ...baseSystemInfo,
        fontPreferences: { detectedFonts: [] },
        plugins: [],
        canvas: { winding: false, geometry: '', text: '' },
        webGL: { vendor: '', renderer: '', imageHash: null },
        mathConstants: {
          acos: 0, acosh: 0, asinh: 0, atanh: 0,
          expm1: 0, sinh: 0, cosh: 0, tanh: 0
        }
      };

      const result = validationEngine.validateSystemInfo(lowEntropyInfo);
      
      expect(validationEngine.validateEntropyPreservation(
        lowEntropyInfo, 
        result.sanitizedData
      )).toBe(false);
      
      expect(result.securityValidation?.entropyScore).toBeLessThan(0.7);
    });
  });

  describe('Manipulation Resistance Validation', () => {
    it('should validate manipulation resistance for secure data', () => {
      const result = validationEngine.validateSystemInfo(baseSystemInfo);
      
      expect(validationEngine.validateManipulationResistance(
        baseSystemInfo, 
        result.sanitizedData
      )).toBe(true);
    });

    it('should detect low manipulation resistance', () => {
      const manipulableInfo = {
        ...baseSystemInfo,
        userAgent: 'easily_spoofed_agent',
        platform: 'spoofed_platform',
        languages: ['fake-lang'],
        timezone: 'fake/timezone',
        // Remove hardware-based properties that are harder to manipulate
        hardwareConcurrency: undefined as any,
        deviceMemory: undefined,
        screenResolution: [0, 0]
      };

      const result = validationEngine.validateSystemInfo(manipulableInfo);
      
      expect(validationEngine.validateManipulationResistance(
        manipulableInfo, 
        result.sanitizedData
      )).toBe(false);
      
      expect(result.securityValidation?.manipulationResistanceScore).toBeLessThan(0.6);
    });
  });

  describe('Configuration Impact on Security', () => {
    it('should respect security check toggles', () => {
      const noSecurityEngine = new ValidationEngine({
        enableSecurityChecks: false,
        enableEntropyValidation: false,
        enableManipulationResistance: false
      });

      const maliciousInfo = {
        ...baseSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124'
      };

      const result = noSecurityEngine.validateSystemInfo(maliciousInfo);
      
      expect(result.securityValidation).toBeUndefined();
      expect(result.errors.filter(e => 
        e.type === ValidationErrorType.SECURITY_VIOLATION
      ).length).toBe(0);
    });

    it('should be more restrictive in strict mode', () => {
      const strictEngine = new ValidationEngine({
        strictMode: true,
        enableSecurityChecks: true,
        enableEntropyValidation: true,
        enableManipulationResistance: true
      });

      const borderlineInfo = {
        ...baseSystemInfo,
        canvas: { winding: false, geometry: 'blocked', text: 'blocked' }
      };

      const strictResult = strictEngine.validateSystemInfo(borderlineInfo);
      const lenientResult = validationEngine.validateSystemInfo(borderlineInfo);
      
      // Strict mode should be more likely to flag as invalid
      expect(strictResult.isValid).toBe(false);
      expect(lenientResult.isValid).toBe(true);
    });
  });

  describe('Hash Generation Integration', () => {
    it('should integrate security validation with hash generation', async () => {
      const result = await generateIdWithDebug(baseSystemInfo, {
        debugMode: true,
        enableValidation: true
      });

      expect(result.hash).toBeDefined();
      expect(result.debugInfo).toBeDefined();
      expect(result.debugInfo?.validationErrors).toBeDefined();
      expect(result.debugInfo?.validationErrors.length).toBe(0); // No errors for valid data
    });

    it('should include security validation errors in debug info', async () => {
      const maliciousInfo = {
        ...baseSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124',
        hardwareConcurrency: 512
      };

      const result = await generateIdWithDebug(maliciousInfo, {
        debugMode: true,
        enableValidation: true
      });

      expect(result.debugInfo?.validationErrors.length).toBeGreaterThan(0);
      expect(result.debugInfo?.validationErrors.some(e => 
        e.type === ValidationErrorType.SECURITY_VIOLATION
      )).toBe(true);
    });

    it('should still generate hash despite security warnings in non-strict mode', async () => {
      const suspiciousInfo = {
        ...baseSystemInfo,
        canvas: { winding: false, geometry: 'blocked', text: 'blocked' }
      };

      const result = await generateIdWithDebug(suspiciousInfo, {
        debugMode: true,
        enableValidation: true,
        strictMode: false
      });

      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64); // SHA-256 hash length
    });

    it('should throw error in strict mode with critical security violations', async () => {
      const criticalInfo = {
        ...baseSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124 <script>alert("xss")</script>',
        hardwareConcurrency: Number.MAX_SAFE_INTEGER
      };

      await expect(generateIdWithDebug(criticalInfo, {
        enableValidation: true,
        strictMode: true
      })).rejects.toThrow();
    });
  });

  describe('Performance Impact', () => {
    it('should complete security validation within reasonable time', () => {
      const startTime = performance.now();
      
      const result = validationEngine.validateSystemInfo(baseSystemInfo);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle large datasets efficiently', () => {
      const largeInfo = {
        ...baseSystemInfo,
        plugins: Array(100).fill(0).map((_, i) => ({
          name: `Plugin ${i}`,
          description: `Description for plugin ${i}`,
          mimeTypes: [{ type: `application/plugin${i}`, suffixes: `p${i}` }]
        })),
        fontPreferences: {
          detectedFonts: Array(200).fill(0).map((_, i) => `Font${i}`)
        }
      };

      const startTime = performance.now();
      const result = validationEngine.validateSystemInfo(largeInfo);
      const endTime = performance.now();
      
      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should handle large data within 500ms
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed data gracefully', () => {
      const malformedInfo = {
        ...baseSystemInfo,
        webGL: null,
        canvas: undefined,
        plugins: 'not an array',
        mathConstants: 'not an object'
      } as any;

      expect(() => {
        validationEngine.validateSystemInfo(malformedInfo);
      }).not.toThrow();
    });

    it('should handle circular references in data', () => {
      const circularInfo = { ...baseSystemInfo } as any;
      circularInfo.circular = circularInfo;

      expect(() => {
        validationEngine.validateSystemInfo(circularInfo);
      }).not.toThrow();
    });

    it('should handle extremely large values', () => {
      const extremeInfo = {
        ...baseSystemInfo,
        hardwareConcurrency: Number.MAX_SAFE_INTEGER,
        deviceMemory: Number.POSITIVE_INFINITY,
        screenResolution: [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
      };

      const result = validationEngine.validateSystemInfo(extremeInfo);
      
      expect(result.errors.some(e => 
        e.type === ValidationErrorType.RANGE_VIOLATION ||
        e.type === ValidationErrorType.SECURITY_VIOLATION
      )).toBe(true);
    });
  });
});