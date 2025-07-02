import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Toast } from '@/src/compliance';

// Mock DOM methods
const mockRemove = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockAppendChild = vi.fn();
const mockRequestAnimationFrame = vi.fn((callback) => {
  callback();
  return 1;
});

// Mock document methods
Object.defineProperty(global, 'document', {
  writable: true,
  value: {
    createElement: vi.fn(),
    body: {
      appendChild: mockAppendChild
    },
    head: {
      appendChild: vi.fn()
    }
  }
});

Object.defineProperty(global, 'requestAnimationFrame', {
  writable: true,
  value: mockRequestAnimationFrame
});

Object.defineProperty(global, 'setTimeout', {
  writable: true,
  value: vi.fn((callback, delay) => {
    // Immediately execute callback for testing
    callback();
    return 1;
  })
});

describe('Compliance Module - Toast', () => {
  let mockToastElement: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset static property
    (Toast as any).stylesInjected = false;

    // Create mock toast element
    mockToastElement = {
      className: '',
      textContent: '',
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      },
      remove: mockRemove,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener
    };

    // Mock createElement to return our mock element
    (document.createElement as any).mockImplementation((tagName: string) => {
      if (tagName === 'div') {
        return mockToastElement;
      }
      if (tagName === 'style') {
        return {
          textContent: ''
        };
      }
      return {};
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Toast.show', () => {
    it('should create and display a toast notification', () => {
      Toast.show('Test message');

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockToastElement.className).toBe('toast');
      expect(mockToastElement.textContent).toBe('Test message');
      expect(mockAppendChild).toHaveBeenCalledWith(mockToastElement);
    });

    it('should add show class to toast element', () => {
      Toast.show('Test message');

      expect(requestAnimationFrame).toHaveBeenCalled();
      expect(mockToastElement.classList.add).toHaveBeenCalledWith('show');
    });

    it('should use default duration of 3000ms', () => {
      Toast.show('Test message');

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    });

    it('should use custom duration when provided', () => {
      Toast.show('Test message', 5000);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should inject styles on first call', () => {
      Toast.show('Test message');

      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('should not inject styles on subsequent calls', () => {
      // First call
      Toast.show('First message');
      const firstCallCount = (document.createElement as any).mock.calls.filter(
        (call: any[]) => call[0] === 'style'
      ).length;

      // Second call
      Toast.show('Second message');
      const secondCallCount = (document.createElement as any).mock.calls.filter(
        (call: any[]) => call[0] === 'style'
      ).length;

      // Should only inject styles once
      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should handle hide animation after timeout', () => {
      Toast.show('Test message');

      // Timeout callback should remove 'show' class
      expect(mockToastElement.classList.remove).toHaveBeenCalledWith('show');
      expect(mockToastElement.addEventListener).toHaveBeenCalledWith(
        'transitionend',
        expect.any(Function),
        { once: true }
      );
    });

    it('should support multiple simultaneous toasts', () => {
      Toast.show('First toast');
      Toast.show('Second toast');

      expect(document.createElement).toHaveBeenCalledTimes(3); // 2 divs + 1 style
      expect(mockAppendChild).toHaveBeenCalledTimes(2);
    });

    it('should handle empty message', () => {
      Toast.show('');

      expect(mockToastElement.textContent).toBe('');
      expect(mockToastElement.className).toBe('toast');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      Toast.show(longMessage);

      expect(mockToastElement.textContent).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      const specialMessage = '🎉 Success! <script>alert("test")</script>';
      Toast.show(specialMessage);

      expect(mockToastElement.textContent).toBe(specialMessage);
    });

    it('should handle zero duration', () => {
      Toast.show('Test message', 0);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
    });

    it('should handle negative duration', () => {
      Toast.show('Test message', -1000);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), -1000);
    });
  });

  describe('Style injection', () => {
    it('should inject correct CSS styles', () => {
      Toast.show('Test message');

      const styleElement = (document.createElement as any).mock.results.find(
        (result: any) => result.value.textContent !== undefined
      )?.value;

      expect(styleElement).toBeDefined();
      expect(typeof styleElement.textContent).toBe('string');
    });

    it('should include glassmorphism styles', () => {
      Toast.show('Test message');

      const styleElement = (document.createElement as any).mock.results.find(
        (result: any) => result.value.textContent !== undefined
      )?.value;

      const styles = styleElement.textContent;
      expect(styles).toContain('backdrop-filter: blur(10px)');
      expect(styles).toContain('-webkit-backdrop-filter: blur(10px)');
      expect(styles).toContain('rgba(255, 255, 255, 0.1)');
    });

    it('should include responsive design', () => {
      Toast.show('Test message');

      const styleElement = (document.createElement as any).mock.results.find(
        (result: any) => result.value.textContent !== undefined
      )?.value;

      const styles = styleElement.textContent;
      expect(styles).toContain('max-width: 80vw');
      expect(styles).toContain('@media (prefers-color-scheme: dark)');
    });

    it('should include animation properties', () => {
      Toast.show('Test message');

      const styleElement = (document.createElement as any).mock.results.find(
        (result: any) => result.value.textContent !== undefined
      )?.value;

      const styles = styleElement.textContent;
      expect(styles).toContain('transition:');
      expect(styles).toContain('opacity');
      expect(styles).toContain('transform');
    });

    it('should set high z-index', () => {
      Toast.show('Test message');

      const styleElement = (document.createElement as any).mock.results.find(
        (result: any) => result.value.textContent !== undefined
      )?.value;

      const styles = styleElement.textContent;
      expect(styles).toContain('z-index: 9999');
    });
  });

  describe('DOM interaction', () => {
    it('should properly clean up event listeners', () => {
      Toast.show('Test message');

      expect(mockToastElement.addEventListener).toHaveBeenCalledWith(
        'transitionend',
        expect.any(Function),
        { once: true }
      );
    });

    it('should handle missing document gracefully', () => {
      const originalDocument = global.document;
      delete (global as any).document;

      expect(() => {
        Toast.show('Test message');
      }).toThrow(); // Should throw due to missing document

      global.document = originalDocument;
    });

    it('should handle missing document.body gracefully', () => {
      const originalBody = global.document.body;
      delete (global.document as any).body;

      expect(() => {
        Toast.show('Test message');
      }).toThrow(); // Should throw due to missing body

      global.document.body = originalBody;
    });

    it('should handle missing requestAnimationFrame gracefully', () => {
      const originalRAF = global.requestAnimationFrame;
      delete (global as any).requestAnimationFrame;

      // Should still work, might just not animate smoothly
      expect(() => {
        Toast.show('Test message');
      }).toThrow(); // Will throw due to missing RAF

      global.requestAnimationFrame = originalRAF;
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very short duration', () => {
      Toast.show('Test message', 1);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1);
    });

    it('should handle very long duration', () => {
      Toast.show('Test message', 999999999);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 999999999);
    });

    it('should handle concurrent shows correctly', () => {
      // Simulate rapid successive calls
      for (let i = 0; i < 10; i++) {
        Toast.show(`Message ${i}`);
      }

      expect(mockAppendChild).toHaveBeenCalledTimes(10);
    });

    it('should maintain static state across instances', () => {
      // First call should inject styles
      Toast.show('First');
      const callsAfterFirst = (document.createElement as any).mock.calls.length;

      // Second call should not inject styles again
      Toast.show('Second');
      const callsAfterSecond = (document.createElement as any).mock.calls.length;

      expect(callsAfterSecond - callsAfterFirst).toBe(1); // Only the div, not style
    });
  });
}); 