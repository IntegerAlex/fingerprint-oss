import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectIncognito } from '@/src/incognito';

describe('Incognito Detection Module', () => {
  describe('detectIncognito', () => {
    beforeEach(() => {
      // Reset all mocks and restore environment for each test
      vi.clearAllMocks();
      
      // Reset browser globals to known state
      resetBrowserEnvironment();
    });

    it('should detect normal browsing mode in Chrome', async () => {
      setupChromeEnvironment();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      expect(typeof result.isPrivate).toBe('boolean');
      expect(typeof result.browserName).toBe('string');
    });

    it('should detect incognito mode in Chrome using quota detection', async () => {
      setupChromeEnvironment();
      mockChromeIncognitoQuota();
      
      const result = await detectIncognito();
      
      expect(result.isPrivate).toBe(true);
      expect(result.browserName).toContain('Chrome');
    });

    it('should detect normal browsing mode in Firefox', async () => {
      setupFirefoxEnvironment();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      expect(result.browserName).toContain('Firefox');
    });

    it('should detect private mode in Firefox using indexedDB detection', async () => {
      setupFirefoxEnvironment();
      mockFirefoxPrivateMode();
      
      const result = await detectIncognito();
      
      expect(result.isPrivate).toBe(true);
      expect(result.browserName).toContain('Firefox');
    });

    it('should detect normal browsing mode in Safari', async () => {
      setupSafariEnvironment();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      expect(result.browserName).toContain('Safari');
    });

    it('should detect private mode in Safari using storage detection', async () => {
      setupSafariEnvironment();
      mockSafariPrivateMode();
      
      const result = await detectIncognito();
      
      expect(result.isPrivate).toBe(true);
      expect(result.browserName).toContain('Safari');
    });

    it('should handle unknown browsers gracefully', async () => {
      setupUnknownBrowserEnvironment();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      expect(typeof result.isPrivate).toBe('boolean');
      expect(typeof result.browserName).toBe('string');
    });

    it('should handle storage errors gracefully', async () => {
      setupBrokenStorageEnvironment();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      // Should not throw even with broken storage
    });

    it('should handle quota API errors gracefully', async () => {
      setupChromeEnvironment();
      mockBrokenQuotaAPI();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      // Should fallback to other detection methods
    });

    it('should provide consistent results on multiple calls', async () => {
      setupChromeEnvironment();
      
      const result1 = await detectIncognito();
      const result2 = await detectIncognito();
      
      expect(result1).toEqual(result2);
    });

    it('should handle non-browser environments', async () => {
      // Mock non-browser environment
      const originalWindow = global.window;
      const originalNavigator = global.navigator;
      
      delete (global as any).window;
      delete (global as any).navigator;
      
      try {
        const result = await detectIncognito();
        
        expect(result).toHaveProperty('isPrivate');
        expect(result).toHaveProperty('browserName');
        expect(result.isPrivate).toBe(false);
        expect(result.browserName).toBe('Unknown');
      } finally {
        // Restore globals
        global.window = originalWindow;
        global.navigator = originalNavigator;
      }
    });

    it('should detect Edge browser correctly', async () => {
      setupEdgeEnvironment();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      expect(result.browserName).toContain('Edge');
    });

    it('should handle mobile Safari on iOS', async () => {
      setupMobileSafariEnvironment();
      
      const result = await detectIncognito();
      
      expect(result).toHaveProperty('isPrivate');
      expect(result).toHaveProperty('browserName');
      expect(result.browserName).toContain('Safari');
    });
  });
});

// Helper functions for setting up test environments

function resetBrowserEnvironment() {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });
  
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    configurable: true,
    value: {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
  });
  
  Object.defineProperty(window, 'indexedDB', {
    writable: true,
    configurable: true,
    value: {
      open: vi.fn(),
      deleteDatabase: vi.fn(),
    },
  });
  
  // Reset navigator.storage
  Object.defineProperty(navigator, 'storage', {
    writable: true,
    configurable: true,
    value: {
      estimate: vi.fn().mockResolvedValue({ quota: 5000000, usage: 1000 }),
    },
  });
}

function setupChromeEnvironment() {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });
}

function setupFirefoxEnvironment() {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  });
}

function setupSafariEnvironment() {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  });
}

function setupEdgeEnvironment() {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  });
}

function setupMobileSafariEnvironment() {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  });
}

function setupUnknownBrowserEnvironment() {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Unknown Browser/1.0',
  });
}

function setupBrokenStorageEnvironment() {
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      setItem: vi.fn().mockImplementation(() => {
        throw new Error('Storage is disabled');
      }),
      getItem: vi.fn().mockImplementation(() => {
        throw new Error('Storage is disabled');
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
  });
}

function mockChromeIncognitoQuota() {
  Object.defineProperty(navigator, 'storage', {
    writable: true,
    configurable: true,
    value: {
      estimate: vi.fn().mockResolvedValue({ quota: 0, usage: 0 }),
    },
  });
}

function mockFirefoxPrivateMode() {
  Object.defineProperty(window, 'indexedDB', {
    writable: true,
    configurable: true,
    value: null,
  });
}

function mockSafariPrivateMode() {
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      setItem: vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      }),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
  });
}

function mockBrokenQuotaAPI() {
  Object.defineProperty(navigator, 'storage', {
    writable: true,
    configurable: true,
    value: {
      estimate: vi.fn().mockRejectedValue(new Error('API not available')),
    },
  });
} 