import { beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Global test setup for enterprise-grade reliability

// Enhanced navigator mocking utilities
export interface MockNavigator {
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
  storage?: any;
  brave?: any;
}

// Create a mock navigator that can be easily modified
export function createMockNavigator(overrides: Partial<MockNavigator> = {}): MockNavigator {
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

// Create a safe way to mock navigator properties
export function mockNavigatorProperty<K extends keyof Navigator>(
  property: K,
  value: Navigator[K]
) {
  const originalValue = navigator[property];
  
  // Try different approaches for mocking
  try {
    // Method 1: Use vi.spyOn if possible
    const spy = vi.spyOn(navigator, property as any, 'get').mockReturnValue(value as any);
    return () => spy.mockRestore();
  } catch {
    try {
      // Method 2: Use Object.defineProperty if configurable
      Object.defineProperty(navigator, property, {
        configurable: true,
        writable: true,
        value
      });
      return () => {
        Object.defineProperty(navigator, property, {
          configurable: true,
          writable: true,
          value: originalValue
        });
      };
    } catch {
      // Method 3: Replace the whole navigator object
      const originalNavigator = global.navigator;
      (global as any).navigator = { ...originalNavigator, [property]: value };
      return () => {
        (global as any).navigator = originalNavigator;
      };
    }
  }
}

// Enhanced window mocking utilities
export function mockWindowProperty<K extends keyof Window>(
  property: K,
  value: Window[K]
) {
  const originalValue = window[property];
  
  try {
    // Try to use defineProperty first
    Object.defineProperty(window, property, {
      configurable: true,
      writable: true,
      value
    });
    return () => {
      Object.defineProperty(window, property, {
        configurable: true,
        writable: true,
        value: originalValue
      });
    };
  } catch {
    // Fallback to direct assignment
    (window as any)[property] = value;
    return () => {
      (window as any)[property] = originalValue;
    };
  }
}

// Mock plugins utility
export function createMockPlugins(length: number = 0): PluginArray {
  const plugins: Plugin[] = [];
  
  for (let i = 0; i < length; i++) {
    plugins.push({
      name: `Plugin ${i}`,
      description: `Test plugin ${i}`,
      filename: `plugin${i}.dll`,
      length: 0,
      item: () => null,
      namedItem: () => null,
      [Symbol.iterator]: function* () {}
    } as Plugin);
  }
  
  return {
    length: plugins.length,
    item: (index: number) => plugins[index] || null,
    namedItem: (name: string) => plugins.find(p => p.name === name) || null,
    refresh: () => {},
    [Symbol.iterator]: function* () {
      for (const plugin of plugins) {
        yield plugin;
      }
    },
    ...Object.fromEntries(plugins.map((plugin, index) => [index, plugin]))
  } as PluginArray;
}

// Global setup for all tests
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Mock console methods to reduce noise
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Mock common browser APIs that might be missing in jsdom
  if (!global.window?.matchMedia) {
    global.window = global.window || {} as any;
    global.window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  
  if (!global.window?.AudioContext) {
    global.window = global.window || {} as any;
    global.window.AudioContext = vi.fn().mockImplementation(() => ({
      createOscillator: vi.fn(() => ({
        type: 'triangle',
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      })),
      createAnalyser: vi.fn(() => ({
        connect: vi.fn(),
        getFloatFrequencyData: vi.fn(),
        frequencyBinCount: 1024
      })),
      createGain: vi.fn(() => ({
        gain: { value: 0 },
        connect: vi.fn()
      })),
      createScriptProcessor: vi.fn(() => ({
        connect: vi.fn()
      })),
      destination: {},
      close: vi.fn().mockResolvedValue(undefined)
    }));
  }
  
  if (!global.window?.indexedDB) {
    global.window = global.window || {} as any;
    global.window.indexedDB = {
      open: vi.fn(),
      deleteDatabase: vi.fn(),
      cmp: vi.fn()
    } as any;
  }
  
  if (!global.window?.localStorage) {
    global.window = global.window || {} as any;
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    global.window.localStorage = localStorageMock as any;
  }
  
  if (!global.window?.sessionStorage) {
    global.window = global.window || {} as any;
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    global.window.sessionStorage = sessionStorageMock as any;
  }

  // Mock screen properties
  if (!global.window?.screen) {
    global.window = global.window || {} as any;
    global.window.screen = {
      width: 1920,
      height: 1080,
      colorDepth: 24,
      pixelDepth: 24
    } as any;
  }
  
  // Mock performance API
  if (!global.window?.performance) {
    global.window = global.window || {} as any;
    global.window.performance = {
      now: vi.fn(() => Date.now()),
      memory: {
        jsHeapSizeLimit: 1073741824
      }
    } as any;
  }

  // Ensure document exists
  if (!global.document) {
    global.document = {} as any;
  }
  
  // Mock document.createElement for canvas
  if (!global.document.createElement) {
    global.document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 300,
          height: 150,
          getContext: vi.fn().mockImplementation((type: string) => {
            if (type === '2d') {
              return {
                font: '',
                measureText: vi.fn().mockReturnValue({
                  width: 100,
                  actualBoundingBoxAscent: 10,
                  actualBoundingBoxDescent: 2
                }),
                fillText: vi.fn(),
                getImageData: vi.fn().mockReturnValue({
                  data: new Uint8ClampedArray(4)
                })
              };
            }
            if (type === 'webgl' || type === 'experimental-webgl') {
              return {
                getParameter: vi.fn().mockReturnValue('Mock WebGL'),
                getExtension: vi.fn().mockReturnValue(null),
                createShader: vi.fn().mockReturnValue({}),
                shaderSource: vi.fn(),
                compileShader: vi.fn(),
                createProgram: vi.fn().mockReturnValue({}),
                attachShader: vi.fn(),
                linkProgram: vi.fn(),
                useProgram: vi.fn(),
                createBuffer: vi.fn().mockReturnValue({}),
                bindBuffer: vi.fn(),
                bufferData: vi.fn(),
                getAttribLocation: vi.fn().mockReturnValue(0),
                enableVertexAttribArray: vi.fn(),
                vertexAttribPointer: vi.fn(),
                drawArrays: vi.fn(),
                readPixels: vi.fn(),
                VERTEX_SHADER: 35633,
                FRAGMENT_SHADER: 35632,
                ARRAY_BUFFER: 34962,
                STATIC_DRAW: 35044,
                TRIANGLES: 4,
                VENDOR: 7936,
                RENDERER: 7937
              };
            }
            return null;
          }),
          toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock')
        };
      }
      return {};
    });
  }
});

afterEach(() => {
  // Restore all mocks
  vi.restoreAllMocks();
});

function resetGlobalMocks() {
  // Reset window properties
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: createMockStorage(),
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: createMockStorage(),
  });
  
  Object.defineProperty(window, 'indexedDB', {
    writable: true,
    value: {},
  });
  
  Object.defineProperty(window, 'screen', {
    writable: true,
    value: {
      width: 1920,
      height: 1080,
      colorDepth: 24,
    },
  });
  
  // Reset navigator properties
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });
  
  Object.defineProperty(navigator, 'platform', {
    writable: true,
    value: 'Win32',
  });
  
  Object.defineProperty(navigator, 'languages', {
    writable: true,
    value: ['en-US', 'en'],
  });
  
  Object.defineProperty(navigator, 'language', {
    writable: true,
    value: 'en-US',
  });
  
  Object.defineProperty(navigator, 'cookieEnabled', {
    writable: true,
    value: true,
  });
  
  Object.defineProperty(navigator, 'doNotTrack', {
    writable: true,
    value: null,
  });
  
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    writable: true,
    value: 8,
  });
  
  Object.defineProperty(navigator, 'deviceMemory', {
    writable: true,
    value: 8,
  });
  
  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    value: 0,
  });
  
  Object.defineProperty(navigator, 'webdriver', {
    writable: true,
    value: undefined,
  });
  
  Object.defineProperty(navigator, 'plugins', {
    writable: true,
    value: {
      length: 5,
      item: () => null,
      namedItem: () => null,
      refresh: () => {},
    },
  });
  
  Object.defineProperty(navigator, 'mimeTypes', {
    writable: true,
    value: {
      length: 2,
      item: () => null,
      namedItem: () => null,
    },
  });
  
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  // Mock document
  Object.defineProperty(document, 'createElement', {
    writable: true,
    value: vi.fn().mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return createMockCanvas();
      }
      return {
        style: {},
        appendChild: vi.fn(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      };
    }),
  });
}

function createMockStorage() {
  const storage = new Map();
  return {
    getItem: vi.fn((key) => storage.get(key) || null),
    setItem: vi.fn((key, value) => storage.set(key, value)),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    length: storage.size,
    key: vi.fn((index) => Array.from(storage.keys())[index] || null),
  };
}

function createMockCanvas() {
  const context = {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    isPointInPath: vi.fn().mockReturnValue(true),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
    }),
    createImageData: vi.fn(),
    putImageData: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  };
  
  return {
    getContext: vi.fn().mockReturnValue(context),
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='),
    width: 300,
    height: 150,
    style: {},
  };
}

function setupConsistentEnvironment() {
  // Set consistent timezone for tests
  process.env.TZ = 'UTC';
  
  // Mock Date.now for consistent timestamps
  const now = new Date('2023-01-01T00:00:00.000Z').getTime();
  vi.setSystemTime(now);
  
  // Mock Math.random for consistent results
  let randomIndex = 0;
  const randomValues = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = randomValues[randomIndex % randomValues.length];
    randomIndex++;
    return value;
  });
}

function resetGlobalState() {
  // Reset any global variables or state
  process.env.TZ = 'UTC';
  
  // Clear any global event listeners
  if (typeof window !== 'undefined') {
    window.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
  }
} 