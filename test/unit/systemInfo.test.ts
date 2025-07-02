import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectBot } from '@/src/systemInfo';

// Mock DOM APIs with proper isolation
beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  
  // Reset all global properties to clean state
  resetTestEnvironment();
});

function resetTestEnvironment() {
  // Reset DOM mocks
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    configurable: true,
    value: {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
  });
  
  Object.defineProperty(window, 'screen', {
    writable: true,
    configurable: true,
    value: {
      width: 1920,
      height: 1080,
    },
  });
  
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });
  
  Object.defineProperty(navigator, 'webdriver', {
    writable: true,
    configurable: true,
    value: undefined,
  });
  
  Object.defineProperty(navigator, 'plugins', {
    writable: true,
    configurable: true,
    value: {
      length: 5,
    },
  });
  
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    writable: true,
    configurable: true,
    value: 8,
  });
}

describe('SystemInfo Module', () => {
  describe('detectBot', () => {
    it('should return bot detected for non-browser environment', () => {
      // Mock non-browser environment
      const originalWindow = global.window;
      const originalNavigator = global.navigator;
      
      delete (global as any).window;
      delete (global as any).navigator;
      
      const result = detectBot();
      
      expect(result.isBot).toBe(true);
      expect(result.signals).toContain('non-browser-environment');
      expect(result.confidence).toBe(0.8);
      
      // Restore globals
      global.window = originalWindow;
      global.navigator = originalNavigator;
    });

    it('should detect bots based on user agent patterns', () => {
      const botUserAgents = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'HeadlessChrome/91.0.4472.124',
        'WebDriver Chrome/91.0.4472.124',
        'Selenium/3.141.59',
        'Puppeteer/10.1.0',
        'Playwright/1.22.2',
        'CrawlerBot/1.0'
      ];

      botUserAgents.forEach((userAgent, index) => {
        // Reset environment for each test to ensure isolation
        resetTestEnvironment();
        
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          configurable: true,
          value: userAgent,
        });

        const result = detectBot();
        
        expect(result.isBot, `Failed for userAgent: ${userAgent} (index: ${index})`).toBe(true);
        expect(result.signals.some(s => s.startsWith('strong:ua-')), `No strong UA signal for: ${userAgent}`).toBe(true);
        expect(result.confidence, `Low confidence for: ${userAgent}`).toBeGreaterThan(0.7);
      });
    });

    it('should detect webdriver flag', () => {
      Object.defineProperty(navigator, 'webdriver', {
        writable: true,
        value: true,
      });

      const result = detectBot();
      
      expect(result.isBot).toBe(true);
      expect(result.signals).toContain('strong:webdriver-flag');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect missing storage as medium signal', () => {
      Object.defineProperty(window, 'localStorage', {
        writable: true,
        value: undefined,
      });

      const result = detectBot();
      
      expect(result.signals).toContain('medium:missing-storage');
    });

    it('should detect few plugins as medium signal', () => {
      Object.defineProperty(navigator, 'plugins', {
        writable: true,
        value: {
          length: 1,
        },
      });

      const result = detectBot();
      
      expect(result.signals).toContain('medium:few-plugins');
    });

    it('should detect no plugins as medium signal', () => {
      Object.defineProperty(navigator, 'plugins', {
        writable: true,
        value: undefined,
      });

      const result = detectBot();
      
      expect(result.signals).toContain('medium:few-plugins');
    });

    it('should detect small screen as weak signal', () => {
      Object.defineProperty(window, 'screen', {
        writable: true,
        value: {
          width: 200,
          height: 150,
        },
      });

      const result = detectBot();
      
      expect(result.signals).toContain('weak:small-screen');
    });

    it('should detect unusual hardware concurrency as weak signal', () => {
      // Test very low concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 1,
      });

      let result = detectBot();
      expect(result.signals).toContain('weak:unusual-concurrency');

      // Test very high concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 64,
      });

      result = detectBot();
      expect(result.signals).toContain('weak:unusual-concurrency');
    });

    it('should return false for normal browsers', () => {
      // Setup normal browser environment
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });
      
      Object.defineProperty(navigator, 'webdriver', {
        writable: true,
        value: undefined,
      });
      
      Object.defineProperty(navigator, 'plugins', {
        writable: true,
        value: { length: 5 },
      });
      
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 8,
      });
      
      Object.defineProperty(window, 'screen', {
        writable: true,
        value: {
          width: 1920,
          height: 1080,
        },
      });

      const result = detectBot();
      
      expect(result.isBot).toBe(false);
      expect(result.confidence).toBeLessThanOrEqual(0.7);
    });

    it('should calculate confidence score correctly with multiple signals', () => {
      // Setup multiple signals
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'HeadlessChrome Bot Crawler',
      });
      
      Object.defineProperty(navigator, 'webdriver', {
        writable: true,
        value: true,
      });
      
      Object.defineProperty(window, 'localStorage', {
        writable: true,
        value: undefined,
      });
      
      Object.defineProperty(navigator, 'plugins', {
        writable: true,
        value: { length: 0 },
      });

      const result = detectBot();
      
      // Should have multiple strong and medium signals
      const strongSignals = result.signals.filter(s => s.startsWith('strong:')).length;
      const mediumSignals = result.signals.filter(s => s.startsWith('medium:')).length;
      
      expect(strongSignals).toBeGreaterThan(0);
      expect(mediumSignals).toBeGreaterThan(0);
      expect(result.isBot).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.confidence).toBeLessThanOrEqual(0.9); // Should be capped at 0.9
    });

    it('should cap confidence score at 0.9', () => {
      // Setup extreme bot signals
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'bot crawler selenium webdriver headless puppeteer playwright',
      });
      
      Object.defineProperty(navigator, 'webdriver', {
        writable: true,
        value: true,
      });
      
      Object.defineProperty(window, 'localStorage', {
        writable: true,
        value: undefined,
      });
      
      Object.defineProperty(window, 'sessionStorage', {
        writable: true,
        value: undefined,
      });
      
      Object.defineProperty(navigator, 'plugins', {
        writable: true,
        value: undefined,
      });
      
      Object.defineProperty(window, 'screen', {
        writable: true,
        value: {
          width: 100,
          height: 100,
        },
      });
      
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 1,
      });

      const result = detectBot();
      
      expect(result.confidence).toBeLessThanOrEqual(0.9);
    });

    it('should handle edge cases gracefully', () => {
      // Test with undefined screen
      Object.defineProperty(window, 'screen', {
        writable: true,
        value: undefined,
      });

      let result = detectBot();
      expect(result).toHaveProperty('isBot');
      expect(result).toHaveProperty('signals');
      expect(result).toHaveProperty('confidence');

      // Test with null navigator properties
      Object.defineProperty(navigator, 'plugins', {
        writable: true,
        value: null,
      });

      result = detectBot();
      expect(result.signals).toContain('medium:few-plugins');
    });
  });
}); 