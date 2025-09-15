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
import { SecurityValidator, SecurityThreatType, DEFAULT_SECURITY_CONFIG } from '../../src/security';
import { SystemInfo } from '../../src/types';
import { normalizeValue } from '../../src/normalization';

describe('SecurityValidator', () => {
  let securityValidator: SecurityValidator;
  let mockSystemInfo: SystemInfo;

  beforeEach(() => {
    securityValidator = new SecurityValidator();
    
    // Create a realistic mock SystemInfo
    mockSystemInfo = {
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
        detectedFonts: ['Arial', 'Times New Roman', 'Helvetica']
      },
      confidenceScore: 0.95
    };
  });

  describe('Entropy Analysis', () => {
    it('should calculate entropy correctly for simple data', () => {
      const simpleData = { a: 1, b: 2, c: 3 };
      const normalizedData = normalizeValue(simpleData);
      
      const result = securityValidator.analyzeEntropy(simpleData as any, normalizedData);
      
      expect(result.originalEntropy).toBeGreaterThan(0);
      expect(result.normalizedEntropy).toBeGreaterThan(0);
      expect(result.entropyPreservationRatio).toBeGreaterThan(0);
      expect(result.entropyPreservationRatio).toBeLessThanOrEqual(1);
    });

    it('should detect entropy loss when normalization reduces uniqueness', () => {
      const highEntropyData = {
        values: ['unique1', 'unique2', 'unique3', 'unique4', 'unique5']
      };
      const lowEntropyData = {
        values: ['same', 'same', 'same', 'same', 'same']
      };
      
      const result = securityValidator.analyzeEntropy(highEntropyData as any, lowEntropyData);
      
      expect(result.entropyPreservationRatio).toBeLessThan(0.5);
      expect(result.distributionAnalysis.uniqueValues).toBeLessThan(5);
    });

    it('should preserve entropy for realistic SystemInfo normalization', () => {
      const normalizedInfo = normalizeValue(mockSystemInfo);
      const result = securityValidator.analyzeEntropy(mockSystemInfo, normalizedInfo);
      
      expect(result.entropyPreservationRatio).toBeGreaterThan(0.7);
      expect(result.uniquenessScore).toBeGreaterThan(0.5);
    });
  });

  describe('Manipulation Detection', () => {
    it('should detect suspicious user agent patterns', () => {
      const suspiciousInfo = {
        ...mockSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124'
      };
      
      const threats = securityValidator.detectManipulationAttempts(suspiciousInfo);
      
      expect(threats).toHaveLength(1);
      expect(threats[0].type).toBe(SecurityThreatType.MANIPULATION_ATTEMPT);
      expect(threats[0].property).toBe('userAgent');
    });

    it('should detect inconsistent hardware specifications', () => {
      const inconsistentInfo = {
        ...mockSystemInfo,
        hardwareConcurrency: 256, // Unrealistic CPU count
        deviceMemory: 64 // Unrealistic memory
      };
      
      const threats = securityValidator.detectManipulationAttempts(inconsistentInfo);
      
      expect(threats.some(t => t.property === 'hardware')).toBe(true);
      expect(threats.some(t => t.type === SecurityThreatType.MANIPULATION_ATTEMPT)).toBe(true);
    });

    it('should detect canvas fingerprint evasion', () => {
      const evasionInfo = {
        ...mockSystemInfo,
        canvas: {
          winding: false,
          geometry: 'blocked',
          text: 'disabled'
        }
      };
      
      const threats = securityValidator.detectManipulationAttempts(evasionInfo);
      
      expect(threats.some(t => t.property === 'canvas')).toBe(true);
      expect(threats.some(t => t.type === SecurityThreatType.FINGERPRINT_EVASION)).toBe(true);
    });

    it('should not flag legitimate system information', () => {
      const threats = securityValidator.detectManipulationAttempts(mockSystemInfo);
      
      // Should have minimal or no threats for legitimate data
      const highSeverityThreats = threats.filter(t => t.severity === 'high' || t.severity === 'critical');
      expect(highSeverityThreats).toHaveLength(0);
    });
  });

  describe('Spoofing Detection', () => {
    it('should detect platform/OS inconsistencies', () => {
      const spoofedInfo = {
        ...mockSystemInfo,
        platform: 'MacIntel',
        os: { os: 'Windows', version: '10' },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      
      const threats = securityValidator.detectSpoofingAttempts(spoofedInfo);
      
      expect(threats.some(t => t.property === 'platform')).toBe(true);
      expect(threats.some(t => t.type === SecurityThreatType.SPOOFING_ATTEMPT)).toBe(true);
    });

    it('should detect WebGL spoofing', () => {
      const spoofedInfo = {
        ...mockSystemInfo,
        webGL: {
          vendor: 'blocked',
          renderer: 'disabled',
          imageHash: null
        }
      };
      
      const threats = securityValidator.detectSpoofingAttempts(spoofedInfo);
      
      expect(threats.some(t => t.property === 'webGL')).toBe(true);
      expect(threats.some(t => t.type === SecurityThreatType.SPOOFING_ATTEMPT)).toBe(true);
    });

    it('should detect potential timezone spoofing', () => {
      const spoofedInfo = {
        ...mockSystemInfo,
        timezone: 'America/New_York',
        languages: ['zh-CN', 'zh'] // Chinese language with American timezone
      };
      
      const threats = securityValidator.detectSpoofingAttempts(spoofedInfo);
      
      expect(threats.some(t => t.property === 'timezone')).toBe(true);
      expect(threats.some(t => t.type === SecurityThreatType.SPOOFING_ATTEMPT)).toBe(true);
    });
  });

  describe('Comprehensive Security Validation', () => {
    it('should validate secure system information', () => {
      const normalizedInfo = normalizeValue(mockSystemInfo);
      const result = securityValidator.validateSecurity(mockSystemInfo, normalizedInfo);
      
      expect(result.isSecure).toBe(true);
      expect(result.entropyScore).toBeGreaterThan(0.7);
      expect(result.manipulationResistanceScore).toBeGreaterThan(0.5);
      expect(result.threats.filter(t => t.severity === 'critical')).toHaveLength(0);
    });

    it('should flag insecure system information', () => {
      const insecureInfo = {
        ...mockSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124',
        hardwareConcurrency: 256,
        canvas: { winding: false, geometry: 'blocked', text: 'disabled' },
        webGL: { vendor: 'blocked', renderer: 'disabled', imageHash: null }
      };
      
      const normalizedInfo = normalizeValue(insecureInfo);
      const result = securityValidator.validateSecurity(insecureInfo, normalizedInfo);
      
      expect(result.isSecure).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
      expect(result.threats.some(t => t.severity === 'high' || t.severity === 'critical')).toBe(true);
    });

    it('should provide security recommendations', () => {
      const lowEntropyInfo = {
        ...mockSystemInfo,
        fontPreferences: { detectedFonts: [] },
        plugins: [],
        mathConstants: {
          acos: 0, acosh: 0, asinh: 0, atanh: 0,
          expm1: 0, sinh: 0, cosh: 0, tanh: 0
        }
      };
      
      const normalizedInfo = normalizeValue(lowEntropyInfo);
      const result = securityValidator.validateSecurity(lowEntropyInfo, normalizedInfo);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('entropy'))).toBe(true);
    });
  });

  describe('Collision Risk Assessment', () => {
    it('should detect high collision risk with low diversity data', () => {
      const lowDiversityInfo = {
        value1: 'same',
        value2: 'same',
        value3: 'same',
        value4: 'same',
        value5: 'different'
      };
      
      const normalizedInfo = normalizeValue(lowDiversityInfo);
      const result = securityValidator.validateSecurity(lowDiversityInfo as any, normalizedInfo);
      
      const collisionThreats = result.threats.filter(t => t.type === SecurityThreatType.COLLISION_RISK);
      expect(collisionThreats.length).toBeGreaterThan(0);
    });

    it('should have low collision risk with diverse data', () => {
      const normalizedInfo = normalizeValue(mockSystemInfo);
      const result = securityValidator.validateSecurity(mockSystemInfo, normalizedInfo);
      
      const collisionThreats = result.threats.filter(t => t.type === SecurityThreatType.COLLISION_RISK);
      expect(collisionThreats.length).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect strict mode configuration', () => {
      const strictValidator = new SecurityValidator({ strictMode: true });
      const normalizedInfo = normalizeValue(mockSystemInfo);
      
      const result = strictValidator.validateSecurity(mockSystemInfo, normalizedInfo);
      
      // Strict mode should be more restrictive
      expect(result.isSecure).toBeDefined();
    });

    it('should respect manipulation detection toggle', () => {
      const noManipulationValidator = new SecurityValidator({ 
        enableManipulationDetection: false 
      });
      
      const suspiciousInfo = {
        ...mockSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124'
      };
      
      const normalizedInfo = normalizeValue(suspiciousInfo);
      const result = noManipulationValidator.validateSecurity(suspiciousInfo, normalizedInfo);
      
      const manipulationThreats = result.threats.filter(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT
      );
      expect(manipulationThreats.length).toBe(0);
    });

    it('should respect spoofing detection toggle', () => {
      const noSpoofingValidator = new SecurityValidator({ 
        enableSpoofingDetection: false 
      });
      
      const spoofedInfo = {
        ...mockSystemInfo,
        platform: 'MacIntel',
        os: { os: 'Windows', version: '10' }
      };
      
      const normalizedInfo = normalizeValue(spoofedInfo);
      const result = noSpoofingValidator.validateSecurity(spoofedInfo, normalizedInfo);
      
      const spoofingThreats = result.threats.filter(t => 
        t.type === SecurityThreatType.SPOOFING_ATTEMPT
      );
      expect(spoofingThreats.length).toBe(0);
    });
  });

  describe('Enhanced Suspicious Input Pattern Detection', () => {
    it('should detect script injection in user agent', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        userAgent: 'Mozilla/5.0 <script>alert("xss")</script> Chrome/91.0'
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'userAgent' && 
        t.description.includes('Script injection')
      )).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        platform: "Win32'; DROP TABLE users; --"
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'platform' && 
        t.description.includes('SQL injection')
      )).toBe(true);
    });

    it('should detect path traversal attempts', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        timezone: '../../../etc/passwd'
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'timezone' && 
        t.description.includes('Path traversal')
      )).toBe(true);
    });

    it('should detect buffer overflow attempts', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        userAgent: 'A'.repeat(5000) // Excessively long user agent
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'userAgent' && 
        t.description.includes('Excessively long string')
      )).toBe(true);
    });

    it('should detect encoding manipulation', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        vendor: 'Google%20Inc%2E%20%28Intel%29' // URL encoded
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'vendor' && 
        t.description.includes('encoding patterns')
      )).toBe(true);
    });

    it('should detect suspicious font manipulation', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        fontPreferences: {
          detectedFonts: ['Arial', 'fake-font', '<script>alert(1)</script>', 'Times']
        }
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'fontPreferences' && 
        t.description.includes('Suspicious font name')
      )).toBe(true);
    });

    it('should detect math constant manipulation', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        mathConstants: {
          acos: 999.999, // Clearly manipulated value
          acosh: 0.8813735870195429,
          asinh: 0.8813735870195429,
          atanh: 0.5493061443340549
        }
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'mathConstants' && 
        t.description.includes('suspicious value')
      )).toBe(true);
    });

    it('should detect malformed language codes', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        languages: ['en-US', 'invalid-lang-code', '<script>']
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'languages' && 
        t.description.includes('Malformed language code')
      )).toBe(true);
    });

    it('should detect enhanced plugin manipulation patterns', () => {
      const maliciousInfo = {
        ...mockSystemInfo,
        plugins: [
          {
            name: 'Chrome PDF Plugin',
            description: 'Portable Document Format',
            mimeTypes: [{ type: 'application/pdf', suffixes: 'pdf' }]
          },
          {
            name: 'Fake Plugin', // Suspicious name
            description: 'Mock plugin for testing',
            mimeTypes: []
          },
          {
            name: 'Duplicate Plugin', // Will create duplicate
            description: 'Test',
            mimeTypes: [{ type: 'test/fake', suffixes: 'fake' }]
          },
          {
            name: 'Duplicate Plugin', // Duplicate name
            description: 'Test2',
            mimeTypes: [{ type: 'test/mock', suffixes: 'mock' }]
          }
        ]
      };
      
      const threats = securityValidator.detectManipulationAttempts(maliciousInfo);
      
      expect(threats.some(t => 
        t.property === 'plugins' && 
        t.description.includes('Suspicious plugin configuration')
      )).toBe(true);
    });
  });

  describe('Enhanced Hash Collision Prevention', () => {
    it('should detect hash collision attempts through uniform data', () => {
      const uniformInfo = {
        ...mockSystemInfo,
        userAgent: 'same',
        platform: 'same',
        vendor: 'same',
        colorGamut: 'same',
        timezone: 'same'
      };
      
      const normalizedInfo = normalizeValue(uniformInfo);
      const result = securityValidator.validateSecurity(uniformInfo, normalizedInfo);
      
      const collisionThreats = result.threats.filter(t => t.type === SecurityThreatType.COLLISION_RISK);
      expect(collisionThreats.length).toBeGreaterThan(0);
    });

    it('should detect entropy manipulation in high-entropy fields', () => {
      const lowEntropyInfo = {
        ...mockSystemInfo,
        webGL: {
          ...mockSystemInfo.webGL,
          imageHash: 'aaa' // Very low entropy
        },
        canvas: {
          ...mockSystemInfo.canvas,
          geometry: 'bbb', // Very low entropy
          text: 'ccc' // Very low entropy
        },
        audio: 0 // Zero entropy
      };
      
      const normalizedInfo = normalizeValue(lowEntropyInfo);
      const result = securityValidator.validateSecurity(lowEntropyInfo, normalizedInfo);
      
      expect(result.threats.some(t => t.type === SecurityThreatType.COLLISION_RISK)).toBe(true);
    });

    it('should detect fingerprint homogenization attempts', () => {
      const genericInfo = {
        ...mockSystemInfo,
        userAgent: 'unknown',
        platform: 'unknown',
        vendor: 'unknown',
        colorGamut: 'unknown',
        timezone: 'unknown',
        webGL: {
          vendor: 'blocked',
          renderer: 'blocked',
          imageHash: 'unavailable'
        },
        canvas: {
          winding: false,
          geometry: 'blocked',
          text: 'blocked'
        }
      };
      
      const normalizedInfo = normalizeValue(genericInfo);
      const result = securityValidator.validateSecurity(genericInfo, normalizedInfo);
      
      expect(result.threats.some(t => t.type === SecurityThreatType.COLLISION_RISK)).toBe(true);
    });

    it('should detect repeated patterns across properties', () => {
      const repeatedInfo = {
        ...mockSystemInfo,
        userAgent: 'repeated_pattern_123',
        platform: 'repeated_pattern_123',
        vendor: 'repeated_pattern_123',
        colorGamut: 'repeated_pattern_123'
      };
      
      const normalizedInfo = normalizeValue(repeatedInfo);
      const result = securityValidator.validateSecurity(repeatedInfo, normalizedInfo);
      
      expect(result.threats.some(t => t.type === SecurityThreatType.COLLISION_RISK)).toBe(true);
    });

    it('should detect fallback value overuse', () => {
      const fallbackInfo = {
        ...mockSystemInfo,
        userAgent: 'ua_unavailable_v2',
        platform: 'platform_unavailable_v2',
        vendor: 'vendor_unavailable_v2',
        colorGamut: 'gamut_unavailable_v2',
        webGL: {
          vendor: 'webgl_unavailable_v2',
          renderer: 'webgl_unavailable_v2',
          imageHash: 'webgl_hash_unavailable_v2'
        }
      };
      
      const normalizedInfo = normalizeValue(fallbackInfo);
      const result = securityValidator.validateSecurity(fallbackInfo, normalizedInfo);
      
      expect(result.threats.some(t => t.type === SecurityThreatType.COLLISION_RISK)).toBe(true);
    });

    it('should have low collision risk for diverse, legitimate data', () => {
      const normalizedInfo = normalizeValue(mockSystemInfo);
      const result = securityValidator.validateSecurity(mockSystemInfo, normalizedInfo);
      
      const collisionThreats = result.threats.filter(t => t.type === SecurityThreatType.COLLISION_RISK);
      expect(collisionThreats.length).toBe(0);
    });
  });

  describe('Security Validation Performance', () => {
    it('should complete enhanced security validation within reasonable time', () => {
      const startTime = performance.now();
      
      const normalizedInfo = normalizeValue(mockSystemInfo);
      const result = securityValidator.validateSecurity(mockSystemInfo, normalizedInfo);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result.isSecure).toBe(true);
      expect(duration).toBeLessThan(200); // Should complete within 200ms even with enhanced checks
    });

    it('should handle complex malicious input efficiently', () => {
      const complexMaliciousInfo = {
        ...mockSystemInfo,
        userAgent: 'HeadlessChrome/91.0 <script>alert("xss")</script> ' + 'A'.repeat(1000),
        platform: "Win32'; DROP TABLE users; --",
        timezone: '../../../etc/passwd',
        vendor: 'Google%20Inc%2E%20%28Intel%29'.repeat(10),
        languages: Array(50).fill('invalid-lang-code'),
        plugins: Array(100).fill({
          name: 'Fake Plugin',
          description: 'Mock plugin',
          mimeTypes: [{ type: 'fake/mock', suffixes: 'fake' }]
        }),
        fontPreferences: {
          detectedFonts: Array(200).fill('<script>alert(1)</script>')
        }
      };
      
      const startTime = performance.now();
      const normalizedInfo = normalizeValue(complexMaliciousInfo);
      const result = securityValidator.validateSecurity(complexMaliciousInfo, normalizedInfo);
      const endTime = performance.now();
      
      expect(result.isSecure).toBe(false);
      expect(result.threats.length).toBeGreaterThan(5);
      expect(endTime - startTime).toBeLessThan(1000); // Should handle complex cases within 1 second
    });
  });

  describe('Security Threat Severity Assessment', () => {
    it('should correctly assess threat severity levels', () => {
      const criticalInfo = {
        ...mockSystemInfo,
        userAgent: 'HeadlessChrome/91.0 <script>alert("xss")</script>',
        hardwareConcurrency: Number.MAX_SAFE_INTEGER
      };
      
      const threats = securityValidator.detectManipulationAttempts(criticalInfo);
      
      expect(threats.some(t => t.severity === 'high')).toBe(true);
      expect(threats.some(t => t.severity === 'medium')).toBe(true);
    });

    it('should provide appropriate risk scores', () => {
      const riskInfo = {
        ...mockSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124'
      };
      
      const threats = securityValidator.detectManipulationAttempts(riskInfo);
      
      expect(threats.length).toBeGreaterThan(0);
      expect(threats[0].riskScore).toBeGreaterThan(0);
      expect(threats[0].riskScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or null data gracefully', () => {
      const emptyInfo = {} as SystemInfo;
      const normalizedInfo = normalizeValue(emptyInfo);
      
      expect(() => {
        securityValidator.validateSecurity(emptyInfo, normalizedInfo);
      }).not.toThrow();
    });

    it('should handle malformed data structures', () => {
      const malformedInfo = {
        ...mockSystemInfo,
        webGL: null,
        canvas: undefined,
        plugins: 'not an array'
      } as any;
      
      const normalizedInfo = normalizeValue(malformedInfo);
      
      expect(() => {
        securityValidator.validateSecurity(malformedInfo, normalizedInfo);
      }).not.toThrow();
    });

    it('should handle extreme values', () => {
      const extremeInfo = {
        ...mockSystemInfo,
        hardwareConcurrency: Number.MAX_SAFE_INTEGER,
        deviceMemory: Number.POSITIVE_INFINITY,
        screenResolution: [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
      };
      
      const normalizedInfo = normalizeValue(extremeInfo);
      const result = securityValidator.validateSecurity(extremeInfo, normalizedInfo);
      
      expect(result.threats.some(t => t.property === 'hardware')).toBe(true);
    });

    it('should handle circular references without crashing', () => {
      const circularInfo = { ...mockSystemInfo } as any;
      circularInfo.circular = circularInfo;
      
      expect(() => {
        const normalizedInfo = normalizeValue(circularInfo);
        securityValidator.validateSecurity(circularInfo, normalizedInfo);
      }).not.toThrow();
    });

    it('should handle undefined and null properties gracefully', () => {
      const nullInfo = {
        ...mockSystemInfo,
        userAgent: null,
        platform: undefined,
        languages: null,
        plugins: undefined,
        fontPreferences: null,
        mathConstants: undefined
      } as any;
      
      expect(() => {
        const normalizedInfo = normalizeValue(nullInfo);
        securityValidator.validateSecurity(nullInfo, normalizedInfo);
      }).not.toThrow();
    });
  });
});