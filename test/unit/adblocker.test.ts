import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectAdBlockers } from '@/src/adblocker';

// Mock global fetch
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset navigator properties
  Object.defineProperty(navigator, 'brave', {
    writable: true,
    value: undefined,
  });
  
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });
  
  Object.defineProperty(navigator, 'userAgentData', {
    writable: true,
    value: undefined,
  });
});

describe('AdBlocker Detection Module', () => {
  describe('detectAdBlockers', () => {
    it('should detect Brave browser via navigator.brave API', async () => {
      // Mock Brave browser detection
      Object.defineProperty(navigator, 'brave', {
        writable: true,
        value: {
          isBrave: vi.fn().mockResolvedValue(true),
        },
      });
      
      // Mock successful ad request (no ad blocker detected)
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal Google Ads script'),
      });

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(true);
      expect(result.adBlocker).toBe(false);
      expect(navigator.brave?.isBrave).toHaveBeenCalled();
    });

    it('should fallback to user agent detection for Brave when API fails', async () => {
      // Mock Brave API that throws an error
      Object.defineProperty(navigator, 'brave', {
        writable: true,
        value: {
          isBrave: vi.fn().mockRejectedValue(new Error('API Error')),
        },
      });
      
      // Set Brave user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Brave Chrome/91.0.4472.124 Safari/537.36',
      });
      
      // Mock successful ad request
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal Google Ads script'),
      });

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(true);
      expect(result.adBlocker).toBe(false);
    });

    it('should detect Brave via userAgentData', async () => {
      // Mock userAgentData with Brave brand
      Object.defineProperty(navigator, 'userAgentData', {
        writable: true,
        value: {
          brands: [
            { brand: 'Brave', version: '91' },
            { brand: 'Chromium', version: '91' },
          ],
        },
      });
      
      // Mock successful ad request
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal Google Ads script'),
      });

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(true);
      expect(result.adBlocker).toBe(false);
    });

    it('should not detect Brave in regular Chrome', async () => {
      // Standard Chrome user agent (no Brave indicators)
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });
      
      // Mock successful ad request
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal Google Ads script'),
      });

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(false);
      expect(result.adBlocker).toBe(false);
    });

    it('should detect ad blocker when fetch is completely blocked', async () => {
      // Mock fetch returning null (completely blocked)
      (global.fetch as any).mockResolvedValue(null);

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(true);
    });

    it('should detect ad blocker when fetch throws error', async () => {
      // Mock fetch throwing error
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(true);
    });

    it('should detect uBlock Origin modification in script', async () => {
      // Mock response with uBlock Origin signature
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Script modified by uBlock Origin'),
      });

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(true);
    });

    it('should detect adsbygoogle modification', async () => {
      // Mock response with adsbygoogle replacement
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('window.adsbygoogle = { loaded: true, push: function() {} };'),
      });

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(true);
    });

    it('should not detect ad blocker with normal script content', async () => {
      // Mock normal Google Ads script response
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue(`
          (function() {
            var adsbygoogle = window.adsbygoogle || [];
            adsbygoogle.push = function(config) {
              // Normal Google Ads functionality
            };
          })();
        `),
      });

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(false);
    });

    it('should handle mixed scenarios correctly', async () => {
      // Test Brave browser with ad blocker
      Object.defineProperty(navigator, 'brave', {
        writable: true,
        value: {
          isBrave: vi.fn().mockResolvedValue(true),
        },
      });
      
      // Mock ad blocker detection
      (global.fetch as any).mockRejectedValue(new Error('Blocked'));

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(true);
      expect(result.adBlocker).toBe(true);
    });

    it('should handle fetch with no-cors mode correctly', async () => {
      const mockFetch = global.fetch as any;
      
      // Mock successful response
      mockFetch.mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal script'),
      });

      await detectAdBlockers();
      
      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        {
          method: 'GET',
          mode: 'no-cors',
        }
      );
    });

    it('should handle userAgentData with multiple brands', async () => {
      Object.defineProperty(navigator, 'userAgentData', {
        writable: true,
        value: {
          brands: [
            { brand: 'Google Chrome', version: '91' },
            { brand: 'Chromium', version: '91' },
            { brand: 'Microsoft Edge', version: '91' },
          ],
        },
      });
      
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal script'),
      });

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(false);
    });

    it('should handle case-insensitive Brave detection in userAgentData', async () => {
      Object.defineProperty(navigator, 'userAgentData', {
        writable: true,
        value: {
          brands: [
            { brand: 'BRAVE', version: '91' },
            { brand: 'Chromium', version: '91' },
          ],
        },
      });
      
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal script'),
      });

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(true);
    });

    it('should handle missing userAgentData gracefully', async () => {
      Object.defineProperty(navigator, 'userAgentData', {
        writable: true,
        value: undefined,
      });
      
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal script'),
      });

      const result = await detectAdBlockers();
      
      expect(result).toHaveProperty('isBrave');
      expect(result).toHaveProperty('adBlocker');
    });

    it('should handle userAgentData without brands property', async () => {
      Object.defineProperty(navigator, 'userAgentData', {
        writable: true,
        value: {
          // Missing brands property
          mobile: false,
        },
      });
      
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal script'),
      });

      const result = await detectAdBlockers();
      
      expect(result.isBrave).toBe(false);
    });

    it('should handle text() method rejection gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockRejectedValue(new Error('Unable to read response')),
      });

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(true);
    });

    it('should return consistent results for multiple calls', async () => {
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('// Normal script'),
      });

      const result1 = await detectAdBlockers();
      const result2 = await detectAdBlockers();
      
      expect(result1).toEqual(result2);
    });

    it('should handle edge case where response exists but text is empty', async () => {
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(false);
    });

    it('should handle partial matches in ad blocker detection', async () => {
      (global.fetch as any).mockResolvedValue({
        text: vi.fn().mockResolvedValue('Some script with uBlock Origin signature inside'),
      });

      const result = await detectAdBlockers();
      
      expect(result.adBlocker).toBe(true);
    });
  });
}); 