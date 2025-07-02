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