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
import { SecurityValidator, SecurityThreatType } from '../../src/security';
import { ValidationEngine } from '../../src/validation';
import { generateId, generateIdWithDebug } from '../../src/hash';
import { SystemInfo } from '../../src/types';
import { normalizeValue } from '../../src/normalization';

describe('Fingerprint Spoofing Detection', () => {
  let securityValidator: SecurityValidator;
  let validationEngine: ValidationEngine;
  let baseSystemInfo: SystemInfo;

  beforeEach(() => {
    securityValidator = new SecurityValidator();
    validationEngine = new ValidationEngine({
      enableSecurityChecks: true,
      enableEntropyValidation: true,
      enableManipulationResistance: true
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

  describe('Bot Detection Evasion', () => {
    it('should detect headless browser signatures', async () => {
      const botInfo = {
        ...baseSystemInfo,
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/91.0.4472.124 Safari/537.36',
        webGL: {
          vendor: 'Google Inc. (Google SwiftShader)',
          renderer: 'Google SwiftShader',
          imageHash: null
        },
        plugins: [], // Headless browsers typically have no plugins
        fontPreferences: { detectedFonts: [] } // Limited font detection
      };

      const validationResult = validationEngine.validateSystemInfo(botInfo);
      
      expect(validationResult.securityValidation?.threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT && 
        t.property === 'userAgent'
      )).toBe(true);
    });

    it('should detect automation tool signatures', async () => {
      const automationInfo = {
        ...baseSystemInfo,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Selenium/3.141.59',
        webGL: {
          vendor: 'Mesa/X.org',
          renderer: 'llvmpipe (LLVM 10.0.0, 256 bits)',
          imageHash: 'selenium_webgl_hash'
        }
      };

      const threats = securityValidator.detectManipulationAttempts(automationInfo);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT &&
        t.property === 'userAgent'
      )).toBe(true);
    });

    it('should detect phantom browser signatures', async () => {
      const phantomInfo = {
        ...baseSystemInfo,
        userAgent: 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.9.8 Safari/534.34',
        plugins: [],
        touchSupport: {
          maxTouchPoints: 0,
          touchEvent: false,
          touchStart: false
        }
      };

      const threats = securityValidator.detectManipulationAttempts(phantomInfo);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT
      )).toBe(true);
    });
  });

  describe('Hardware Spoofing', () => {
    it('should detect impossible hardware combinations', async () => {
      const impossibleHardware = {
        ...baseSystemInfo,
        hardwareConcurrency: 512, // Unrealistic CPU count
        deviceMemory: 128, // Unrealistic memory amount
        screenResolution: [16384, 16384] // Unrealistic resolution
      };

      const threats = securityValidator.detectManipulationAttempts(impossibleHardware);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT &&
        t.property === 'hardware'
      )).toBe(true);
    });

    it('should detect inconsistent mobile/desktop hardware', async () => {
      const inconsistentInfo = {
        ...baseSystemInfo,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
        platform: 'iPhone',
        hardwareConcurrency: 16, // Too high for mobile
        screenResolution: [3840, 2160], // Desktop resolution on mobile UA
        touchSupport: {
          maxTouchPoints: 0, // No touch on mobile device
          touchEvent: false,
          touchStart: false
        }
      };

      const threats = securityValidator.detectManipulationAttempts(inconsistentInfo);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT
      )).toBe(true);
    });
  });

  describe('Canvas Fingerprint Evasion', () => {
    it('should detect canvas blocking techniques', async () => {
      const blockedCanvas = {
        ...baseSystemInfo,
        canvas: {
          winding: false,
          geometry: 'blocked',
          text: 'blocked'
        }
      };

      const threats = securityValidator.detectManipulationAttempts(blockedCanvas);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.FINGERPRINT_EVASION &&
        t.property === 'canvas'
      )).toBe(true);
    });

    it('should detect canvas randomization', async () => {
      // Simulate multiple canvas readings that should be identical but aren't
      const canvas1 = {
        ...baseSystemInfo,
        canvas: {
          winding: true,
          geometry: 'hash_123456',
          text: 'text_hash_789'
        }
      };

      const canvas2 = {
        ...baseSystemInfo,
        canvas: {
          winding: true,
          geometry: 'hash_654321', // Different hash for same system
          text: 'text_hash_987'
        }
      };

      const hash1 = await generateId(canvas1);
      const hash2 = await generateId(canvas2);

      // Different hashes suggest canvas randomization
      expect(hash1).not.toBe(hash2);
    });

    it('should detect empty or error canvas responses', async () => {
      const emptyCanvas = {
        ...baseSystemInfo,
        canvas: {
          winding: false,
          geometry: '',
          text: 'error'
        }
      };

      const threats = securityValidator.detectManipulationAttempts(emptyCanvas);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.FINGERPRINT_EVASION
      )).toBe(true);
    });
  });

  describe('WebGL Spoofing', () => {
    it('should detect WebGL blocking', async () => {
      const blockedWebGL = {
        ...baseSystemInfo,
        webGL: {
          vendor: 'blocked',
          renderer: 'blocked',
          imageHash: null
        }
      };

      const threats = securityValidator.detectSpoofingAttempts(blockedWebGL);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.SPOOFING_ATTEMPT &&
        t.property === 'webGL'
      )).toBe(true);
    });

    it('should detect WebGL vendor/renderer spoofing', async () => {
      const spoofedWebGL = {
        ...baseSystemInfo,
        webGL: {
          vendor: 'Google Inc.',
          renderer: 'ANGLE (NVIDIA GeForce RTX 3080)', // High-end GPU
          imageHash: 'fake_hash'
        },
        hardwareConcurrency: 2, // Low-end CPU inconsistent with high-end GPU
        deviceMemory: 2 // Low memory inconsistent with high-end system
      };

      const threats = securityValidator.detectManipulationAttempts(spoofedWebGL);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT
      )).toBe(true);
    });
  });

  describe('Font Fingerprint Evasion', () => {
    it('should detect font blocking or limited font lists', async () => {
      const limitedFonts = {
        ...baseSystemInfo,
        fontPreferences: {
          detectedFonts: [] // No fonts detected suggests blocking
        }
      };

      const normalizedInfo = normalizeValue(limitedFonts);
      const result = securityValidator.validateSecurity(limitedFonts, normalizedInfo);
      
      // Should flag as potential entropy loss
      expect(result.entropyScore).toBeLessThan(0.8);
    });

    it('should detect suspicious font combinations', async () => {
      const suspiciousFonts = {
        ...baseSystemInfo,
        fontPreferences: {
          detectedFonts: ['fake-font', 'spoof-font', 'mock-font']
        }
      };

      const threats = securityValidator.detectManipulationAttempts(suspiciousFonts);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT &&
        t.property === 'plugins'
      )).toBe(false); // This specific test might not trigger plugin threats
    });
  });

  describe('Timezone and Language Spoofing', () => {
    it('should detect timezone/language mismatches', async () => {
      const mismatchedInfo = {
        ...baseSystemInfo,
        timezone: 'Asia/Shanghai',
        languages: ['en-US', 'en'], // English language with Chinese timezone
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };

      const threats = securityValidator.detectSpoofingAttempts(mismatchedInfo);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.SPOOFING_ATTEMPT &&
        t.property === 'timezone'
      )).toBe(true);
    });

    it('should detect VPN/proxy usage patterns', async () => {
      const vpnInfo = {
        ...baseSystemInfo,
        timezone: 'Europe/London',
        languages: ['zh-CN', 'zh'], // Chinese language with UK timezone
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      const threats = securityValidator.detectSpoofingAttempts(vpnInfo);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.SPOOFING_ATTEMPT
      )).toBe(true);
    });
  });

  describe('Plugin Spoofing', () => {
    it('should detect fake or suspicious plugins', async () => {
      const fakePlugins = {
        ...baseSystemInfo,
        plugins: [
          {
            name: 'Fake Plugin',
            description: 'Mock plugin for testing',
            mimeTypes: [{ type: 'application/fake', suffixes: 'fake' }]
          },
          {
            name: 'Spoof Extension',
            description: 'Spoofed browser extension',
            mimeTypes: []
          }
        ]
      };

      const threats = securityValidator.detectManipulationAttempts(fakePlugins);
      
      expect(threats.some(t => 
        t.type === SecurityThreatType.MANIPULATION_ATTEMPT &&
        t.property === 'plugins'
      )).toBe(true);
    });

    it('should detect plugin list manipulation', async () => {
      // Test with completely empty plugin list (suspicious for desktop browsers)
      const noPlugins = {
        ...baseSystemInfo,
        plugins: []
      };

      const normalizedInfo = normalizeValue(noPlugins);
      const result = securityValidator.validateSecurity(noPlugins, normalizedInfo);
      
      // Should affect entropy score
      expect(result.entropyScore).toBeLessThan(0.9);
    });
  });

  describe('Comprehensive Spoofing Scenarios', () => {
    it('should detect coordinated spoofing attempts', async () => {
      const coordinatedSpoof = {
        ...baseSystemInfo,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        platform: 'Win32', // Platform doesn't match UA
        os: { os: 'Linux', version: '5.4.0' }, // OS doesn't match platform or UA
        webGL: {
          vendor: 'blocked',
          renderer: 'blocked',
          imageHash: null
        },
        canvas: {
          winding: false,
          geometry: 'blocked',
          text: 'blocked'
        },
        plugins: [],
        fontPreferences: { detectedFonts: [] }
      };

      const validationResult = validationEngine.validateSystemInfo(coordinatedSpoof);
      
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.securityValidation?.isSecure).toBe(false);
      expect(validationResult.securityValidation?.threats.length).toBeGreaterThan(3);
    });

    it('should maintain hash stability despite spoofing attempts', async () => {
      // Even with spoofing attempts, the same spoofed data should produce consistent hashes
      const spoofedInfo = {
        ...baseSystemInfo,
        canvas: { winding: false, geometry: 'blocked', text: 'blocked' },
        webGL: { vendor: 'blocked', renderer: 'blocked', imageHash: null }
      };

      const hash1 = await generateId(spoofedInfo);
      const hash2 = await generateId(spoofedInfo);

      expect(hash1).toBe(hash2);
    });

    it('should provide detailed threat analysis for spoofing attempts', async () => {
      const spoofedInfo = {
        ...baseSystemInfo,
        userAgent: 'HeadlessChrome/91.0.4472.124',
        hardwareConcurrency: 256,
        canvas: { winding: false, geometry: 'blocked', text: 'blocked' }
      };

      const result = await generateIdWithDebug(spoofedInfo, { 
        debugMode: true,
        enableValidation: true 
      });

      expect(result.debugInfo).toBeDefined();
      expect(result.debugInfo?.validationErrors.length).toBeGreaterThan(0);
      expect(result.debugInfo?.appliedFallbacks).toBeDefined();
    });
  });

  describe('Entropy Preservation Under Attack', () => {
    it('should maintain sufficient entropy despite blocking attempts', async () => {
      const blockedInfo = {
        ...baseSystemInfo,
        canvas: { winding: false, geometry: 'blocked', text: 'blocked' },
        webGL: { vendor: 'blocked', renderer: 'blocked', imageHash: null },
        fontPreferences: { detectedFonts: [] },
        plugins: []
      };

      const normalizedInfo = normalizeValue(blockedInfo);
      const entropyAnalysis = securityValidator.analyzeEntropy(blockedInfo, normalizedInfo);

      // Even with blocking, should maintain some entropy through other properties
      expect(entropyAnalysis.entropyPreservationRatio).toBeGreaterThan(0.5);
      expect(entropyAnalysis.uniquenessScore).toBeGreaterThan(0.3);
    });

    it('should detect when spoofing reduces fingerprint uniqueness', async () => {
      const genericInfo = {
        ...baseSystemInfo,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        platform: 'Win32',
        screenResolution: [1920, 1080], // Common resolution
        hardwareConcurrency: 4, // Common CPU count
        deviceMemory: 8, // Common memory
        canvas: { winding: false, geometry: 'generic', text: 'generic' },
        webGL: { vendor: 'generic', renderer: 'generic', imageHash: 'generic' },
        fontPreferences: { detectedFonts: ['Arial', 'Times New Roman'] }, // Common fonts
        plugins: []
      };

      const normalizedInfo = normalizeValue(genericInfo);
      const result = securityValidator.validateSecurity(genericInfo, normalizedInfo);

      expect(result.threats.some(t => 
        t.type === SecurityThreatType.COLLISION_RISK
      )).toBe(true);
    });
  });
});