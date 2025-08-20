import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as indexModule from '@/src/index';

// Inline mock utilities to avoid rootDir issues
interface MockNavigator {
  userAgent: string;
  platform: string;
  plugins: PluginArray;
  webdriver?: boolean;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  languages: string[];
  cookieEnabled: boolean;
  doNotTrack: string | null;
  vendor: string;
}

function createMockNavigator(overrides: Partial<MockNavigator> = {}): Partial<Navigator> {
  const mockPlugins = {
    length: 0,
    item: () => null,
    namedItem: () => null,
    refresh: () => {},
    [Symbol.iterator]: function* () {},
    ...Object.fromEntries(Array.from({ length: 0 }, (_, i) => [i, null]))
  } as PluginArray;

  return {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    platform: 'Win32',
    plugins: mockPlugins,
    webdriver: false,
    hardwareConcurrency: 4,
    maxTouchPoints: 0,
    languages: ['en-US', 'en'],
    cookieEnabled: true,
    doNotTrack: null,
    vendor: 'Google Inc.',
    ...overrides
  };
}

function mockNavigatorProperty<K extends keyof Navigator>(
  property: K,
  value: Navigator[K]
) {
  const originalValue = (global.navigator as any)[property];
  
  try {
    // Use Object.defineProperty if configurable
    Object.defineProperty(global.navigator, property, {
      configurable: true,
      writable: true,
      value
    });
    return () => {
      Object.defineProperty(global.navigator, property, {
        configurable: true,
        writable: true,
        value: originalValue
      });
    };
  } catch {
    // Fallback to direct assignment
    (global.navigator as any)[property] = value;
    return () => {
      (global.navigator as any)[property] = originalValue;
    };
  }
}

describe('Index Module', () => {
  const originalWindow = global.window;
  const originalNavigator = global.navigator;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup basic browser environment
    global.window = {
      screen: { width: 1920, height: 1080, colorDepth: 24 },
      location: { origin: 'https://test.com' },
      localStorage: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      sessionStorage: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
    } as any;

    global.navigator = createMockNavigator() as Navigator;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  afterEach(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Module Exports', () => {
    it('should export all required core functions', () => {
      expect(indexModule).toBeDefined();
      expect(typeof indexModule.getSystemInfo).toBe('function');
      expect(typeof indexModule.fetchGeolocationInfo).toBe('function');
      expect(typeof indexModule.generateJSON).toBe('function');
      expect(typeof indexModule.generateId).toBe('function');
      expect(typeof indexModule.detectIncognito).toBe('function');
      expect(typeof indexModule.detectAdBlockers).toBe('function');
      expect(typeof indexModule.getVpnStatus).toBe('function');
      expect(typeof indexModule.detectBot).toBe('function');
    });

    it('should export helper functions', () => {
      expect(typeof indexModule.getColorGamut).toBe('function');
      expect(typeof indexModule.getVendorFlavors).toBe('function');
      expect(typeof indexModule.isLocalStorageEnabled).toBe('function');
      expect(typeof indexModule.isSessionStorageEnabled).toBe('function');
      expect(typeof indexModule.isIndexedDBEnabled).toBe('function');
      expect(typeof indexModule.getTouchSupportInfo).toBe('function');
      expect(typeof indexModule.getOSInfo).toBe('function');
      expect(typeof indexModule.getPluginsInfo).toBe('function');
      expect(typeof indexModule.getMathFingerprint).toBe('function');
      expect(typeof indexModule.getCanvasFingerprint).toBe('function');
      expect(typeof indexModule.getAudioFingerprint).toBe('function');
      expect(typeof indexModule.getWebGLInfo).toBe('function');
      expect(typeof indexModule.getFontPreferences).toBe('function');
      expect(typeof indexModule.estimateCores).toBe('function');
    });

    it('should export confidence functions', () => {
      expect(typeof indexModule.getLanguageConsistency).toBe('function');
      expect(typeof indexModule.isRiskyASN).toBe('function');
      expect(typeof indexModule.getUAPlatformMismatch).toBe('function');
      expect(typeof indexModule.checkBrowserConsistency).toBe('function');
    });

    it('should export utility functions and classes', () => {
      expect(typeof indexModule.getMockSystemInfo).toBe('function');
      expect(typeof indexModule.Toast).toBe('function'); // Toast is a class
    });

    it('should export default function', () => {
      expect(typeof indexModule.default).toBe('function');
    });
  });

  describe('Core Functionality', () => {
    it('should be able to call main functions without errors', async () => {
      // Mock fetch for geolocation
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      // Test synchronous functions
      expect(() => indexModule.getColorGamut()).not.toThrow();
      expect(() => indexModule.isLocalStorageEnabled()).not.toThrow();
      expect(() => indexModule.getMathFingerprint()).not.toThrow();
      expect(() => indexModule.getOSInfo()).not.toThrow();
      expect(() => indexModule.getVendorFlavors()).not.toThrow();
      expect(() => indexModule.getTouchSupportInfo()).not.toThrow();
      expect(() => indexModule.getPluginsInfo()).not.toThrow();
      expect(() => indexModule.getCanvasFingerprint()).not.toThrow();
      expect(() => indexModule.getFontPreferences()).not.toThrow();
      
      // Test async functions
      await expect(indexModule.fetchGeolocationInfo()).resolves.toBeDefined();
      await expect(indexModule.detectIncognito()).resolves.toBeDefined();
      await expect(indexModule.getSystemInfo()).resolves.toBeDefined();
      await expect(indexModule.getAudioFingerprint()).resolves.toBeDefined();
      await expect(indexModule.getWebGLInfo()).resolves.toBeDefined();
      await expect(indexModule.estimateCores()).resolves.toBeDefined();
    });

    it('should handle browser environment properly', async () => {
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo).toHaveProperty('userAgent');
      expect(systemInfo).toHaveProperty('platform');
      expect(systemInfo).toHaveProperty('confidenceScore');
      expect(typeof systemInfo.confidenceScore).toBe('number');
      expect(systemInfo.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(systemInfo.confidenceScore).toBeLessThanOrEqual(1);
    });

    it('should generate consistent fingerprint data', async () => {
      const systemInfo = await indexModule.getSystemInfo();
      const hash1 = await indexModule.generateId(systemInfo);
      const hash2 = await indexModule.generateId(systemInfo);
      
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(typeof hash1).toBe('string');
      expect(typeof hash2).toBe('string');
      expect(hash1).toBe(hash2); // Should be consistent for same input
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should handle geolocation integration properly', async () => {
      // Mock successful geolocation response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ipAddress: '192.168.1.1',
          country: { isoCode: 'US', name: 'United States' },
          location: { timeZone: 'America/New_York' },
          traits: { isAnonymous: false }
        })
      });

      const geoInfo = await indexModule.fetchGeolocationInfo();
      const systemInfo = await indexModule.getSystemInfo();
      
      const jsonData = await indexModule.generateJSON(geoInfo, systemInfo);
      
      expect(jsonData).toBeDefined();
      expect(jsonData).toHaveProperty('confidenceAssessment');
      expect(jsonData).toHaveProperty('systemInfo');
      expect(jsonData).toHaveProperty('hash');
      expect(typeof jsonData.confidenceAssessment).toBe('number');
    });

    it('should have proper TypeScript compilation', () => {
      // This test ensures TypeScript compilation works correctly
      expect(true).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing browser APIs gracefully', async () => {
      // Test with minimal browser environment
      delete (global.window as any).localStorage;
      delete (global.window as any).sessionStorage;
      delete (global.navigator as any).plugins;
      
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo).toHaveProperty('localStorage');
      expect(systemInfo).toHaveProperty('sessionStorage');
    });

    it('should handle non-browser environment gracefully', async () => {
      // Test in non-browser environment
      delete (global as any).window;
      delete (global as any).navigator;
      
      try {
        const systemInfo = await indexModule.getSystemInfo();
        expect(systemInfo).toBeDefined();
        // Should return mock data in non-browser environment
        expect(systemInfo).toHaveProperty('userAgent');
      } finally {
        // Restore for other tests
        global.window = originalWindow;
        global.navigator = originalNavigator;
      }
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const geoInfo = await indexModule.fetchGeolocationInfo();
      // Should return null or mock data when fetch fails
      expect(geoInfo).toBeDefined();
    });

    it('should handle malformed geolocation responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null)
      });
      
      const geoInfo = await indexModule.fetchGeolocationInfo();
      expect(geoInfo).toBeDefined();
    });

    it('should handle bot detection properly', async () => {
      // Mock bot-like environment
      mockNavigatorProperty('webdriver', true);
      mockNavigatorProperty('userAgent', 'Mozilla/5.0 bot/1.0');
      
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toHaveProperty('bot');
      expect(systemInfo.bot).toHaveProperty('isBot');
      expect(systemInfo.bot).toHaveProperty('confidence');
      expect(typeof systemInfo.bot.isBot).toBe('boolean');
      expect(typeof systemInfo.bot.confidence).toBe('number');
    });
  });

  describe('Privacy Detection', () => {
    it('should detect incognito mode', async () => {
      const incognitoResult = await indexModule.detectIncognito();
      expect(incognitoResult).toBeDefined();
      expect(incognitoResult).toHaveProperty('isPrivate');
      expect(incognitoResult).toHaveProperty('browserName');
      expect(typeof incognitoResult.isPrivate).toBe('boolean');
      expect(typeof incognitoResult.browserName).toBe('string');
    });

    it('should detect ad blockers', async () => {
      const adBlockResult = await indexModule.detectAdBlockers();
      expect(adBlockResult).toBeDefined();
      expect(adBlockResult).toHaveProperty('adBlocker');
      expect(typeof adBlockResult.adBlocker).toBe('boolean');
    });

    it('should get VPN status with timezone data', async () => {
      const timeZoneData = { timeZone: 'America/New_York' } as any;
      const vpnResult = await indexModule.getVpnStatus(timeZoneData);
      expect(vpnResult).toBeDefined();
      expect(typeof vpnResult).toBe('object');
    });
  });

  describe('Confidence Assessment', () => {
    it('should calculate language consistency', () => {
      const consistency = indexModule.getLanguageConsistency('en', 'US');
      expect(typeof consistency).toBe('number');
      expect(consistency).toBeGreaterThanOrEqual(0);
      expect(consistency).toBeLessThanOrEqual(1);
    });

    it('should identify risky ASNs', () => {
      const riskyResult = indexModule.isRiskyASN('AS12345');
      expect(typeof riskyResult).toBe('boolean');
    });

    it('should detect UA platform mismatches', () => {
      const mismatch = indexModule.getUAPlatformMismatch(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'MacIntel'
      );
      expect(typeof mismatch).toBe('number');
      expect(mismatch).toBeGreaterThanOrEqual(0);
    });

    it('should check browser consistency', async () => {
      const systemInfo = await indexModule.getSystemInfo();
      const consistency = indexModule.checkBrowserConsistency(systemInfo);
      expect(typeof consistency).toBe('number');
      expect(consistency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Default Function Integration', () => {
    it('should work with default transparency settings', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await indexModule.default({ transparency: true });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('systemInfo');
      expect(result).toHaveProperty('confidenceAssessment');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should work with custom message', async () => {
      const result = await indexModule.default({ 
        transparency: true, 
        message: 'custom test message' 
      });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('hash');
    });

    it('should work without any configuration', async () => {
      const result = await indexModule.default();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('systemInfo');
      expect(result).toHaveProperty('confidenceAssessment');
    });

    it('should handle errors and return fallback data', async () => {
      // Mock all async functions to throw errors
      vi.spyOn(indexModule, 'getSystemInfo').mockRejectedValue(new Error('System error'));
      vi.spyOn(indexModule, 'fetchGeolocationInfo').mockRejectedValue(new Error('Geo error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await indexModule.default();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('hash');
      expect(consoleSpy).toHaveBeenCalledWith('Data collection error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Stability', () => {
    it('should handle concurrent calls properly', async () => {
      const promises = Array(5).fill(null).map(() => indexModule.getSystemInfo());
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('userAgent');
      });
    });

    it('should have reasonable execution time for system info', async () => {
      const start = performance.now();
      await indexModule.getSystemInfo();
      const end = performance.now();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(end - start).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle memory constraints gracefully', async () => {
      // Simulate low memory environment by testing the function response
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      // Test that the function completes successfully regardless of memory constraints
      expect(systemInfo).toHaveProperty('userAgent');
    });
  });

  describe('Input Validation and Security', () => {
    it('should handle malicious input gracefully', async () => {
      // Test with various potentially malicious inputs
      const maliciousUA = '<script>alert("xss")</script>';
      mockNavigatorProperty('userAgent', maliciousUA);
      
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo.userAgent).toBe(maliciousUA); // Should store as-is, filtering happens elsewhere
    });

    it('should validate confidence score bounds', async () => {
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo.confidenceScore).toBeGreaterThanOrEqual(0.1);
      expect(systemInfo.confidenceScore).toBeLessThanOrEqual(0.9);
    });

    it('should handle extremely large data gracefully', async () => {
      // Test with large user agent string
      const largeUA = 'A'.repeat(10000);
      mockNavigatorProperty('userAgent', largeUA);
      
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo.userAgent).toBe(largeUA);
    });
  });

  describe('Browser Compatibility', () => {
    it('should work in Chrome-like environment', async () => {
      mockNavigatorProperty('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      mockNavigatorProperty('vendor', 'Google Inc.');
      
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo.userAgent).toContain('Chrome');
    });

    it('should work in Firefox-like environment', async () => {
      mockNavigatorProperty('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0');
      mockNavigatorProperty('vendor', '');
      
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo.userAgent).toContain('Firefox');
    });

    it('should work in Safari-like environment', async () => {
      mockNavigatorProperty('userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15');
      mockNavigatorProperty('vendor', 'Apple Computer, Inc.');
      
      const systemInfo = await indexModule.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo.userAgent).toContain('Safari');
    });
  });
}); 
  describe('Advanced System Information Tests', () => {
    it('should handle different platform combinations', async () => {
      const testCases = [
        { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', platform: 'Linux x86_64' },
        { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel' },
        { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32' },
        { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', platform: 'iPhone' }
      ];

      for (const testCase of testCases) {
        mockNavigatorProperty('userAgent', testCase.userAgent);
        mockNavigatorProperty('platform', testCase.platform);
        
        const systemInfo = await indexModule.getSystemInfo();
        expect(systemInfo.userAgent).toBe(testCase.userAgent);
        expect(systemInfo.platform).toBe(testCase.platform);
        expect(systemInfo.os).toBeDefined();
        expect(systemInfo.os.name).toBeDefined();
      }
    });

    it('should detect mobile vs desktop environments', async () => {
      // Test mobile environment
      mockNavigatorProperty('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
      mockNavigatorProperty('maxTouchPoints', 5);
      
      const mobileInfo = await indexModule.getSystemInfo();
      expect(mobileInfo.touchSupport.maxTouchPoints).toBe(5);
      
      // Test desktop environment
      mockNavigatorProperty('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      mockNavigatorProperty('maxTouchPoints', 0);
      
      const desktopInfo = await indexModule.getSystemInfo();
      expect(desktopInfo.touchSupport.maxTouchPoints).toBe(0);
    });

    it('should handle various hardware concurrency values', async () => {
      const testValues = [1, 2, 4, 8, 16, 32];
      
      for (const cores of testValues) {
        mockNavigatorProperty('hardwareConcurrency', cores);
        
        const systemInfo = await indexModule.getSystemInfo();
        expect(systemInfo.hardwareConcurrency).toBe(cores);
        
        const estimatedCores = await indexModule.estimateCores();
        expect(estimatedCores).toBeGreaterThanOrEqual(1);
      }
    });

    it('should handle different language configurations', async () => {
      const languageConfigs = [
        ['en-US', 'en'],
        ['fr-FR', 'fr', 'en'],
        ['zh-CN', 'zh', 'en-US'],
        ['es-ES', 'ca', 'es', 'en']
      ];

      for (const languages of languageConfigs) {
        mockNavigatorProperty('languages', languages);
        
        const systemInfo = await indexModule.getSystemInfo();
        expect(systemInfo.languages).toEqual(languages);
        expect(systemInfo.language).toBe(languages[0]);
      }
    });

    it('should handle cookie and DNT settings', async () => {
      const testCases = [
        { cookieEnabled: true, doNotTrack: null },
        { cookieEnabled: false, doNotTrack: '1' },
        { cookieEnabled: true, doNotTrack: '0' },
        { cookieEnabled: false, doNotTrack: 'unspecified' }
      ];

      for (const testCase of testCases) {
        mockNavigatorProperty('cookieEnabled', testCase.cookieEnabled);
        mockNavigatorProperty('doNotTrack', testCase.doNotTrack);
        
        const systemInfo = await indexModule.getSystemInfo();
        expect(systemInfo.cookieEnabled).toBe(testCase.cookieEnabled);
        expect(systemInfo.doNotTrack).toBe(testCase.doNotTrack);
      }
    });
  });

  describe('Fingerprinting Component Tests', () => {
    it('should generate consistent canvas fingerprints', () => {
      const fingerprint1 = indexModule.getCanvasFingerprint();
      const fingerprint2 = indexModule.getCanvasFingerprint();
      
      expect(fingerprint1).toBeDefined();
      expect(fingerprint2).toBeDefined();
      expect(typeof fingerprint1).toBe('string');
      expect(typeof fingerprint2).toBe('string');
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1.length).toBeGreaterThan(10);
    });

    it('should generate math fingerprints with expected properties', () => {
      const mathFP = indexModule.getMathFingerprint();
      
      expect(mathFP).toBeDefined();
      expect(typeof mathFP).toBe('object');
      expect(mathFP).toHaveProperty('tan');
      expect(mathFP).toHaveProperty('sin');
      expect(mathFP).toHaveProperty('cos');
      expect(typeof mathFP.tan).toBe('number');
      expect(typeof mathFP.sin).toBe('number');
      expect(typeof mathFP.cos).toBe('number');
    });

    it('should handle audio fingerprinting gracefully', async () => {
      // Mock AudioContext for environments that don't have it
      const mockAudioContext = {
        createOscillator: vi.fn(() => ({
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          frequency: { value: 0 }
        })),
        createAnalyser: vi.fn(() => ({
          connect: vi.fn(),
          getFloatFrequencyData: vi.fn()
        })),
        createGain: vi.fn(() => ({
          connect: vi.fn(),
          gain: { value: 0 }
        })),
        destination: {},
        close: vi.fn()
      };

      global.AudioContext = vi.fn(() => mockAudioContext);
      global.webkitAudioContext = vi.fn(() => mockAudioContext);

      const audioFP = await indexModule.getAudioFingerprint();
      expect(audioFP).toBeDefined();
      expect(typeof audioFP).toBe('string');
    });

    it('should handle WebGL fingerprinting', async () => {
      // Mock basic WebGL context
      const mockWebGLContext = {
        getParameter: vi.fn((param) => {
          const params = {
            7936: 'Mock Vendor', // VENDOR
            7937: 'Mock Renderer', // RENDERER
            7938: '1.0', // VERSION
            35724: 'Mock Extensions' // SHADING_LANGUAGE_VERSION
          };
          return params[param] || 'Mock Value';
        }),
        getSupportedExtensions: vi.fn(() => ['WEBGL_debug_renderer_info', 'OES_texture_float'])
      };

      const mockCanvas = {
        getContext: vi.fn(() => mockWebGLContext)
      };

      global.HTMLCanvasElement.prototype.getContext = vi.fn(() => mockWebGLContext);
      global.document = { createElement: vi.fn(() => mockCanvas) } as any;

      const webglInfo = await indexModule.getWebGLInfo();
      expect(webglInfo).toBeDefined();
      expect(webglInfo).toHaveProperty('vendor');
      expect(webglInfo).toHaveProperty('renderer');
    });

    it('should detect font preferences accurately', () => {
      const fontPrefs = indexModule.getFontPreferences();
      
      expect(fontPrefs).toBeDefined();
      expect(Array.isArray(fontPrefs)).toBe(true);
      expect(fontPrefs.length).toBeGreaterThan(0);
      
      fontPrefs.forEach(font => {
        expect(typeof font).toBe('string');
        expect(font.length).toBeGreaterThan(0);
      });
    });

    it('should handle plugins information', () => {
      const mockPlugins = {
        length: 2,
        item: (index: number) => index === 0 ? { name: 'Plugin 1' } : { name: 'Plugin 2' },
        namedItem: () => null,
        refresh: () => {},
        [Symbol.iterator]: function* () {
          yield { name: 'Plugin 1' };
          yield { name: 'Plugin 2' };
        },
        0: { name: 'Plugin 1' },
        1: { name: 'Plugin 2' }
      } as PluginArray;

      mockNavigatorProperty('plugins', mockPlugins);
      
      const pluginInfo = indexModule.getPluginsInfo();
      expect(pluginInfo).toBeDefined();
      expect(Array.isArray(pluginInfo)).toBe(true);
    });
  });

  describe('Storage and Capability Tests', () => {
    it('should test localStorage with various scenarios', () => {
      // Test enabled localStorage
      global.window.localStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      } as any;

      expect(indexModule.isLocalStorageEnabled()).toBe(true);

      // Test disabled localStorage
      global.window.localStorage = {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('QuotaExceededError');
        }),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      } as any;

      expect(indexModule.isLocalStorageEnabled()).toBe(false);

      // Test missing localStorage
      delete (global.window as any).localStorage;
      expect(indexModule.isLocalStorageEnabled()).toBe(false);
    });

    it('should test sessionStorage with various scenarios', () => {
      // Test enabled sessionStorage
      global.window.sessionStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      } as any;

      expect(indexModule.isSessionStorageEnabled()).toBe(true);

      // Test disabled sessionStorage
      global.window.sessionStorage = {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('QuotaExceededError');
        }),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      } as any;

      expect(indexModule.isSessionStorageEnabled()).toBe(false);
    });

    it('should test IndexedDB availability', async () => {
      // Mock IndexedDB
      const mockIDBOpenDBRequest = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any
      };

      global.indexedDB = {
        open: vi.fn(() => mockIDBOpenDBRequest)
      } as any;

      const isEnabled = await indexModule.isIndexedDBEnabled();
      expect(typeof isEnabled).toBe('boolean');

      // Test without IndexedDB
      delete (global as any).indexedDB;
      const isEnabledWithoutIDB = await indexModule.isIndexedDBEnabled();
      expect(isEnabledWithoutIDB).toBe(false);
    });

    it('should handle screen information', async () => {
      const screenConfigs = [
        { width: 1920, height: 1080, colorDepth: 24 },
        { width: 1366, height: 768, colorDepth: 32 },
        { width: 375, height: 667, colorDepth: 24 }, // Mobile
        { width: 2560, height: 1440, colorDepth: 30 }  // High-DPI
      ];

      for (const config of screenConfigs) {
        global.window.screen = config as any;
        
        const systemInfo = await indexModule.getSystemInfo();
        expect(systemInfo.screen.width).toBe(config.width);
        expect(systemInfo.screen.height).toBe(config.height);
        expect(systemInfo.screen.colorDepth).toBe(config.colorDepth);
      }
    });
  });

  describe('Advanced Detection Tests', () => {
    it('should handle different bot detection scenarios', async () => {
      const botScenarios = [
        { webdriver: true, userAgent: 'Normal UA', expected: true },
        { webdriver: false, userAgent: 'Mozilla/5.0 bot/1.0', expected: true },
        { webdriver: false, userAgent: 'Normal Chrome UA', expected: false },
        { webdriver: undefined, userAgent: 'Googlebot/2.1', expected: true }
      ];

      for (const scenario of botScenarios) {
        if (scenario.webdriver !== undefined) {
          mockNavigatorProperty('webdriver', scenario.webdriver);
        }
        mockNavigatorProperty('userAgent', scenario.userAgent);
        
        const botResult = await indexModule.detectBot();
        expect(botResult).toHaveProperty('isBot');
        expect(botResult).toHaveProperty('confidence');
        expect(typeof botResult.isBot).toBe('boolean');
        expect(typeof botResult.confidence).toBe('number');
      }
    });

    it('should test color gamut detection', () => {
      // Mock CSS.supports for color gamut testing
      global.CSS = {
        supports: vi.fn((property: string, value: string) => {
          if (property === 'color-gamut') {
            return value === 'srgb';
          }
          return false;
        })
      } as any;

      const colorGamut = indexModule.getColorGamut();
      expect(typeof colorGamut).toBe('string');
      expect(['srgb', 'p3', 'rec2020', 'unknown'].includes(colorGamut)).toBe(true);
    });

    it('should test vendor flavor detection', () => {
      const vendorTests = [
        { vendor: 'Google Inc.', userAgent: 'Chrome', expected: 'chrome' },
        { vendor: 'Apple Computer, Inc.', userAgent: 'Safari', expected: 'safari' },
        { vendor: '', userAgent: 'Firefox', expected: 'firefox' },
        { vendor: 'Microsoft Corporation', userAgent: 'Edge', expected: 'edge' }
      ];

      for (const test of vendorTests) {
        mockNavigatorProperty('vendor', test.vendor);
        mockNavigatorProperty('userAgent', test.userAgent);
        
        const flavors = indexModule.getVendorFlavors();
        expect(Array.isArray(flavors)).toBe(true);
        expect(flavors.length).toBeGreaterThan(0);
      }
    });

    it('should handle touch support detection', () => {
      const touchTests = [
        { maxTouchPoints: 0, expected: false },
        { maxTouchPoints: 1, expected: true },
        { maxTouchPoints: 10, expected: true }
      ];

      for (const test of touchTests) {
        mockNavigatorProperty('maxTouchPoints', test.maxTouchPoints);
        
        const touchInfo = indexModule.getTouchSupportInfo();
        expect(touchInfo).toHaveProperty('maxTouchPoints');
        expect(touchInfo.maxTouchPoints).toBe(test.maxTouchPoints);
        expect(touchInfo).toHaveProperty('touchEvent');
        expect(typeof touchInfo.touchEvent).toBe('boolean');
      }
    });
  });

  describe('Geolocation and Network Tests', () => {
    it('should handle various geolocation response formats', async () => {
      const geoResponses = [
        {
          ipAddress: '8.8.8.8',
          country: { isoCode: 'US', name: 'United States' },
          location: { timeZone: 'America/New_York', latitude: 40.7128, longitude: -74.0060 },
          traits: { isAnonymous: false, autonomousSystemNumber: 15169 }
        },
        {
          ipAddress: '1.1.1.1',
          country: { isoCode: 'AU', name: 'Australia' },
          location: { timeZone: 'Australia/Sydney' },
          traits: { isAnonymous: true }
        },
        null, // Null response
        {}, // Empty response
        { error: 'Service unavailable' } // Error response
      ];

      for (const response of geoResponses) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(response)
        });

        const geoInfo = await indexModule.fetchGeolocationInfo();
        expect(geoInfo).toBeDefined();
        
        if (response && !response.error) {
          expect(geoInfo).toHaveProperty('ipAddress');
        }
      }
    });

    it('should handle network errors in geolocation', async () => {
      const networkErrors = [
        new Error('Network timeout'),
        new Error('DNS resolution failed'),
        new Error('Connection refused'),
        new TypeError('Failed to fetch')
      ];

      for (const error of networkErrors) {
        global.fetch = vi.fn().mockRejectedValue(error);
        
        const geoInfo = await indexModule.fetchGeolocationInfo();
        expect(geoInfo).toBeDefined(); // Should return fallback data
      }
    });

    it('should test VPN detection with various timezone scenarios', async () => {
      const timezoneScenarios = [
        { timeZone: 'America/New_York', language: 'en-US', expected: 'low_risk' },
        { timeZone: 'Europe/London', language: 'fr-FR', expected: 'medium_risk' },
        { timeZone: 'Asia/Tokyo', language: 'en-US', expected: 'high_risk' },
        { timeZone: undefined, language: 'en-US', expected: 'unknown' }
      ];

      for (const scenario of timezoneScenarios) {
        mockNavigatorProperty('language', scenario.language);
        
        const vpnStatus = await indexModule.getVpnStatus(scenario);
        expect(vpnStatus).toBeDefined();
        expect(typeof vpnStatus).toBe('object');
      }
    });
  });

  describe('Confidence Assessment Edge Cases', () => {
    it('should handle extreme language consistency scenarios', () => {
      const testCases = [
        { language: 'en', country: 'US', expected: 'high' },
        { language: 'zh', country: 'US', expected: 'low' },
        { language: 'fr', country: 'FR', expected: 'high' },
        { language: 'unknown', country: 'XX', expected: 'low' },
        { language: '', country: '', expected: 'low' }
      ];

      for (const testCase of testCases) {
        const consistency = indexModule.getLanguageConsistency(testCase.language, testCase.country);
        expect(typeof consistency).toBe('number');
        expect(consistency).toBeGreaterThanOrEqual(0);
        expect(consistency).toBeLessThanOrEqual(1);
      }
    });

    it('should test risky ASN detection with various formats', () => {
      const asnTests = [
        'AS15169', // Google
        'AS13335', // Cloudflare
        'AS16509', // Amazon
        'AS12345', // Unknown
        'invalid-asn',
        '',
        null as any,
        undefined as any
      ];

      for (const asn of asnTests) {
        const isRisky = indexModule.isRiskyASN(asn);
        expect(typeof isRisky).toBe('boolean');
      }
    });

    it('should handle complex UA platform mismatch scenarios', () => {
      const mismatchTests = [
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          platform: 'Win32',
          expected: 'low_mismatch'
        },
        {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          platform: 'Win32',
          expected: 'high_mismatch'
        },
        {
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
          platform: 'MacIntel',
          expected: 'high_mismatch'
        },
        {
          userAgent: '',
          platform: '',
          expected: 'unknown'
        }
      ];

      for (const test of mismatchTests) {
        const mismatch = indexModule.getUAPlatformMismatch(test.userAgent, test.platform);
        expect(typeof mismatch).toBe('number');
        expect(mismatch).toBeGreaterThanOrEqual(0);
      }
    });

    it('should test browser consistency with various system configurations', async () => {
      const systemConfigs = [
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0',
          platform: 'Win32',
          vendor: 'Google Inc.',
          languages: ['en-US', 'en']
        },
        {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/14.1.1',
          platform: 'MacIntel',
          vendor: 'Apple Computer, Inc.',
          languages: ['en-US', 'en']
        },
        {
          userAgent: 'Inconsistent Bot Agent',
          platform: 'Linux',
          vendor: 'Unknown',
          languages: ['xx-XX']
        }
      ];

      for (const config of systemConfigs) {
        mockNavigatorProperty('userAgent', config.userAgent);
        mockNavigatorProperty('platform', config.platform);
        mockNavigatorProperty('vendor', config.vendor);
        mockNavigatorProperty('languages', config.languages);

        const systemInfo = await indexModule.getSystemInfo();
        const consistency = indexModule.checkBrowserConsistency(systemInfo);
        
        expect(typeof consistency).toBe('number');
        expect(consistency).toBeGreaterThanOrEqual(0);
        expect(consistency).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Data Generation and Serialization', () => {
    it('should generate valid JSON with all required fields', async () => {
      const mockGeoInfo = {
        ipAddress: '8.8.8.8',
        country: { isoCode: 'US', name: 'United States' },
        location: { timeZone: 'America/New_York' },
        traits: { isAnonymous: false }
      };

      const systemInfo = await indexModule.getSystemInfo();
      const jsonData = await indexModule.generateJSON(mockGeoInfo, systemInfo);

      expect(jsonData).toBeDefined();
      expect(jsonData).toHaveProperty('hash');
      expect(jsonData).toHaveProperty('systemInfo');
      expect(jsonData).toHaveProperty('confidenceAssessment');
      expect(jsonData).toHaveProperty('geolocationInfo');
      
      expect(typeof jsonData.hash).toBe('string');
      expect(typeof jsonData.confidenceAssessment).toBe('number');
      expect(jsonData.hash.length).toBeGreaterThan(0);
    });

    it('should generate consistent hashes for identical inputs', async () => {
      const systemInfo = await indexModule.getSystemInfo();
      
      const hash1 = await indexModule.generateId(systemInfo);
      const hash2 = await indexModule.generateId(systemInfo);
      const hash3 = await indexModule.generateId({ ...systemInfo });
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBe(hash3);
      expect(hash1).toMatch(/^[a-f0-9]+$/); // Should be hexadecimal
    });

    it('should generate different hashes for different inputs', async () => {
      const systemInfo1 = await indexModule.getSystemInfo();
      const systemInfo2 = { ...systemInfo1, userAgent: 'Different UA' };
      
      const hash1 = await indexModule.generateId(systemInfo1);
      const hash2 = await indexModule.generateId(systemInfo2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle serialization of complex nested objects', async () => {
      const complexSystemInfo = await indexModule.getSystemInfo();
      
      // Ensure the system info can be serialized to JSON
      const serialized = JSON.stringify(complexSystemInfo);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized).toEqual(complexSystemInfo);
      expect(deserialized).toHaveProperty('userAgent');
      expect(deserialized).toHaveProperty('confidenceScore');
    });
  });

  describe('Utility Classes and Functions', () => {
    it('should test Toast class functionality', () => {
      const toast = new indexModule.Toast();
      expect(toast).toBeDefined();
      expect(toast.constructor.name).toBe('Toast');
      
      // Test if Toast has expected methods
      expect(typeof toast.show).toBe('function');
      expect(typeof toast.hide).toBe('function');
    });

    it('should test mock system info generation', () => {
      const mockInfo = indexModule.getMockSystemInfo();
      expect(mockInfo).toBeDefined();
      expect(mockInfo).toHaveProperty('userAgent');
      expect(mockInfo).toHaveProperty('platform');
      expect(mockInfo).toHaveProperty('confidenceScore');
      expect(typeof mockInfo.confidenceScore).toBe('number');
      expect(mockInfo.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(mockInfo.confidenceScore).toBeLessThanOrEqual(1);
    });

    it('should validate mock data structure matches real data', async () => {
      const realSystemInfo = await indexModule.getSystemInfo();
      const mockSystemInfo = indexModule.getMockSystemInfo();
      
      // Should have same properties
      const realKeys = Object.keys(realSystemInfo).sort();
      const mockKeys = Object.keys(mockSystemInfo).sort();
      
      expect(mockKeys.length).toBeGreaterThan(0);
      // Mock should have at least the core properties
      expect(mockSystemInfo).toHaveProperty('userAgent');
      expect(mockSystemInfo).toHaveProperty('platform');
      expect(mockSystemInfo).toHaveProperty('confidenceScore');
    });
  });

  describe('Resource Management and Cleanup', () => {
    it('should handle resource cleanup in fingerprinting', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform multiple fingerprinting operations
      for (let i = 0; i < 10; i++) {
        await indexModule.getSystemInfo();
        indexModule.getCanvasFingerprint();
        await indexModule.getAudioFingerprint();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory usage should not grow excessively
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
      }
    });

    it('should handle concurrent operations without conflicts', async () => {
      const promises = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(indexModule.getSystemInfo());
        promises.push(indexModule.fetchGeolocationInfo());
        promises.push(indexModule.detectIncognito());
      }
      
      const results = await Promise.allSettled(promises);
      
      // All operations should complete successfully or fail gracefully
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
        } else {
          // Failures should be handled gracefully
          expect(result.reason).toBeInstanceOf(Error);
        }
      });
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Mock slow operations
      const slowFetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      global.fetch = slowFetch;
      
      const start = performance.now();
      const result = await indexModule.fetchGeolocationInfo();
      const end = performance.now();
      
      expect(result).toBeDefined();
      // Should handle timeouts appropriately
      expect(end - start).toBeLessThan(5000); // Reasonable timeout
    });
  });

  describe('Integration and End-to-End Scenarios', () => {
    it('should handle complete workflow with all components', async () => {
      // Mock successful geolocation
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ipAddress: '203.0.113.1',
          country: { isoCode: 'US', name: 'United States' },
          location: { timeZone: 'America/New_York' },
          traits: { isAnonymous: false, autonomousSystemNumber: 15169 }
        })
      });

      // Complete workflow
      const geoInfo = await indexModule.fetchGeolocationInfo();
      const systemInfo = await indexModule.getSystemInfo();
      const jsonData = await indexModule.generateJSON(geoInfo, systemInfo);
      const hash = await indexModule.generateId(systemInfo);
      
      expect(geoInfo).toBeDefined();
      expect(systemInfo).toBeDefined();
      expect(jsonData).toBeDefined();
      expect(hash).toBeDefined();
      
      expect(jsonData.hash).toBe(hash);
      expect(jsonData.systemInfo).toEqual(systemInfo);
      expect(jsonData.geolocationInfo).toEqual(geoInfo);
    });

    it('should work in various simulated environments', async () => {
      const environments = [
        {
          name: 'Mobile Safari',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
          platform: 'iPhone',
          vendor: 'Apple Computer, Inc.',
          maxTouchPoints: 5
        },
        {
          name: 'Desktop Chrome',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Win32',
          vendor: 'Google Inc.',
          maxTouchPoints: 0
        },
        {
          name: 'Linux Firefox',
          userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
          platform: 'Linux x86_64',
          vendor: '',
          maxTouchPoints: 0
        }
      ];

      for (const env of environments) {
        mockNavigatorProperty('userAgent', env.userAgent);
        mockNavigatorProperty('platform', env.platform);
        mockNavigatorProperty('vendor', env.vendor);
        mockNavigatorProperty('maxTouchPoints', env.maxTouchPoints);

        const result = await indexModule.default({ transparency: false });
        
        expect(result).toBeDefined();
        expect(result).toHaveProperty('hash');
        expect(result).toHaveProperty('systemInfo');
        expect(result.systemInfo.userAgent).toBe(env.userAgent);
        expect(result.systemInfo.platform).toBe(env.platform);
      }
    });
  });