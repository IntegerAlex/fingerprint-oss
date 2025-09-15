import { describe, it, expect, beforeAll } from 'vitest';
import { generateId, generateIdWithDebug, compareInputs, HashGeneratorConfig } from '@/src/hash';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo, MimeType } from '@/src/types';

/**
 * Comprehensive Integration Testing Suite
 * 
 * This test suite implements comprehensive integration testing with real SystemInfo data
 * to ensure the hash generation works correctly with actual browser fingerprinting data.
 * 
 * Requirements covered:
 * - Integration testing with real SystemInfo data
 * - Cross-browser compatibility verification
 * - Real-world scenario testing
 */

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Real-world SystemInfo configurations from different browsers and environments
const realWorldConfigurations: Array<{ name: string; config: SystemInfo; description: string }> = [
  {
    name: 'chrome_windows_desktop',
    description: 'Chrome 120 on Windows 10 Desktop with NVIDIA GPU',
    config: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      platform: "Win32",
      screenResolution: [1920, 1080],
      colorDepth: 24,
      colorGamut: "srgb",
      os: { os: "Windows", version: "10" },
      webGL: {
        vendor: "Google Inc. (NVIDIA)",
        renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
        imageHash: "webgl_chrome_nvidia_rtx3070_hash_v1"
      } as WebGLInfo,
      canvas: {
        winding: true,
        geometry: "chrome_canvas_geometry_nvidia",
        text: "chrome_canvas_text_nvidia"
      } as CanvasInfo,
      audio: 124.04344968475198,
      fontPreferences: {
        detectedFonts: [
          "Arial", "Arial Black", "Calibri", "Cambria", "Comic Sans MS", "Consolas",
          "Courier New", "Georgia", "Impact", "Lucida Console", "Lucida Sans Unicode",
          "Microsoft Sans Serif", "Palatino Linotype", "Segoe UI", "Tahoma", "Times New Roman",
          "Trebuchet MS", "Verdana"
        ].sort()
      } as FontPreferencesInfo,
      mathConstants: {
        acos: 1.4455469250725552,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649,
      } as MathInfo,
      plugins: [
        {
          name: "PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "Chrome PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "Chromium PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "Microsoft Edge PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "WebKit built-in PDF",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        }
      ] as PluginInfo[],
      languages: ["en-US", "en"],
      timezone: "America/New_York",
      incognito: { isPrivate: false, browserName: "Chrome" },
      bot: { isBot: false, signals: [], confidence: 0 },
      cookiesEnabled: true,
      doNotTrack: null,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: "Google Inc.",
      vendorFlavors: ["Google Chrome"],
      confidenceScore: 95.7,
      deviceMemory: 8,
      hardwareConcurrency: 8,
    }
  },
  {
    name: 'firefox_windows_desktop',
    description: 'Firefox 121 on Windows 10 Desktop with NVIDIA GPU',
    config: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      platform: "Win32",
      screenResolution: [1920, 1080],
      colorDepth: 24,
      colorGamut: "srgb",
      os: { os: "Windows", version: "10" },
      webGL: {
        vendor: "Mozilla",
        renderer: "Mozilla -- ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11-27.21.14.5671)",
        imageHash: "webgl_firefox_nvidia_rtx3070_hash_v1"
      } as WebGLInfo,
      canvas: {
        winding: false,
        geometry: "firefox_canvas_geometry_nvidia",
        text: "firefox_canvas_text_nvidia"
      } as CanvasInfo,
      audio: 35.73833402246237,
      fontPreferences: {
        detectedFonts: [
          "Arial", "Arial Black", "Calibri", "Cambria", "Comic Sans MS", "Consolas",
          "Courier New", "Georgia", "Impact", "Lucida Console", "Lucida Sans Unicode",
          "Microsoft Sans Serif", "Palatino Linotype", "Segoe UI", "Tahoma", "Times New Roman",
          "Trebuchet MS", "Verdana", "Wingdings"
        ].sort()
      } as FontPreferencesInfo,
      mathConstants: {
        acos: 1.4455469250725552,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649,
      } as MathInfo,
      plugins: [] as PluginInfo[], // Firefox typically shows no plugins in modern versions
      languages: ["en-US", "en"],
      timezone: "America/New_York",
      incognito: { isPrivate: false, browserName: "Firefox" },
      bot: { isBot: false, signals: [], confidence: 0 },
      cookiesEnabled: true,
      doNotTrack: "unspecified",
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: "",
      vendorFlavors: [],
      confidenceScore: 92.3,
      deviceMemory: undefined, // Firefox doesn't expose this
      hardwareConcurrency: 8,
    }
  },
  {
    name: 'safari_macos_desktop',
    description: 'Safari 17 on macOS Sonoma with Apple Silicon',
    config: {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
      platform: "MacIntel",
      screenResolution: [2560, 1440],
      colorDepth: 30,
      colorGamut: "p3",
      os: { os: "macOS", version: "14.2.1" },
      webGL: {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        imageHash: "webgl_safari_apple_silicon_hash_v1"
      } as WebGLInfo,
      canvas: {
        winding: true,
        geometry: "safari_canvas_geometry_apple",
        text: "safari_canvas_text_apple"
      } as CanvasInfo,
      audio: 35.73833402246237,
      fontPreferences: {
        detectedFonts: [
          "American Typewriter", "Andale Mono", "Arial", "Arial Black", "Arial Narrow",
          "Arial Rounded MT Bold", "Arial Unicode MS", "Avenir", "Avenir Next",
          "Baskerville", "Big Caslon", "Brush Script MT", "Chalkboard", "Chalkboard SE",
          "Cochin", "Comic Sans MS", "Copperplate", "Courier", "Courier New",
          "Didot", "Futura", "Geneva", "Georgia", "Gill Sans", "Helvetica",
          "Helvetica Neue", "Herculanum", "Impact", "Lucida Grande", "Luminari",
          "Marker Felt", "Menlo", "Monaco", "Noteworthy", "Optima", "Palatino",
          "Papyrus", "Phosphate", "Rockwell", "Savoye LET", "SignPainter",
          "Skia", "Snell Roundhand", "Tahoma", "Times", "Times New Roman",
          "Trattatello", "Trebuchet MS", "Verdana", "Zapfino"
        ].sort()
      } as FontPreferencesInfo,
      mathConstants: {
        acos: 1.4455469250725552,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649,
      } as MathInfo,
      plugins: [
        {
          name: "WebKit built-in PDF",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        }
      ] as PluginInfo[],
      languages: ["en-US", "en"],
      timezone: "America/Los_Angeles",
      incognito: { isPrivate: false, browserName: "Safari" },
      bot: { isBot: false, signals: [], confidence: 0 },
      cookiesEnabled: true,
      doNotTrack: null,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: "Apple Computer, Inc.",
      vendorFlavors: ["Apple Safari"],
      confidenceScore: 89.1,
      deviceMemory: undefined, // Safari doesn't expose this
      hardwareConcurrency: 10,
    }
  },
  {
    name: 'chrome_android_mobile',
    description: 'Chrome 120 on Android 14 Mobile Device',
    config: {
      userAgent: "Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      screenResolution: [412, 915],
      colorDepth: 24,
      colorGamut: "srgb",
      os: { os: "Android", version: "14" },
      webGL: {
        vendor: "Google Inc. (Qualcomm)",
        renderer: "ANGLE (Qualcomm, Adreno (TM) 660, OpenGL ES 3.2)",
        imageHash: "webgl_chrome_android_adreno660_hash_v1"
      } as WebGLInfo,
      canvas: {
        winding: true,
        geometry: "chrome_android_canvas_geometry",
        text: "chrome_android_canvas_text"
      } as CanvasInfo,
      audio: 35.73833402246237,
      fontPreferences: {
        detectedFonts: [
          "Droid Sans", "Droid Sans Mono", "Droid Serif", "Roboto", "Roboto Condensed",
          "Roboto Mono", "Roboto Slab", "Noto Sans", "Noto Serif"
        ].sort()
      } as FontPreferencesInfo,
      mathConstants: {
        acos: 1.4455469250725552,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649,
      } as MathInfo,
      plugins: [] as PluginInfo[], // Mobile browsers typically don't show plugins
      languages: ["en-US", "en"],
      timezone: "America/New_York",
      incognito: { isPrivate: false, browserName: "Chrome" },
      bot: { isBot: false, signals: [], confidence: 0 },
      cookiesEnabled: true,
      doNotTrack: null,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      touchSupport: { maxTouchPoints: 10, touchEvent: true, touchStart: true },
      vendor: "Google Inc.",
      vendorFlavors: ["Google Chrome"],
      confidenceScore: 87.4,
      deviceMemory: 8,
      hardwareConcurrency: 8,
    }
  },
  {
    name: 'edge_windows_desktop',
    description: 'Microsoft Edge 120 on Windows 11 Desktop',
    config: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      platform: "Win32",
      screenResolution: [1920, 1080],
      colorDepth: 24,
      colorGamut: "srgb",
      os: { os: "Windows", version: "11" },
      webGL: {
        vendor: "Google Inc. (Microsoft)",
        renderer: "ANGLE (Microsoft, D3D11 vs_5_0 ps_5_0, D3D11)",
        imageHash: "webgl_edge_windows11_hash_v1"
      } as WebGLInfo,
      canvas: {
        winding: true,
        geometry: "edge_canvas_geometry_windows11",
        text: "edge_canvas_text_windows11"
      } as CanvasInfo,
      audio: 124.04344968475198,
      fontPreferences: {
        detectedFonts: [
          "Arial", "Arial Black", "Bahnschrift", "Calibri", "Cambria", "Candara",
          "Comic Sans MS", "Consolas", "Constantia", "Corbel", "Courier New",
          "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia",
          "HoloLens MDL2 Assets", "Impact", "Ink Free", "Javanese Text",
          "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic",
          "Marlett", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue",
          "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le",
          "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti",
          "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI", "Palatino Linotype",
          "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI",
          "Segoe UI Historic", "Segoe UI Symbol", "SimSun", "Sitka", "Sylfaen",
          "Symbol", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana",
          "Webdings", "Wingdings", "Yu Gothic"
        ].sort()
      } as FontPreferencesInfo,
      mathConstants: {
        acos: 1.4455469250725552,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649,
      } as MathInfo,
      plugins: [
        {
          name: "PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "Chrome PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "Chromium PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "Microsoft Edge PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        },
        {
          name: "WebKit built-in PDF",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        }
      ] as PluginInfo[],
      languages: ["en-US", "en"],
      timezone: "America/New_York",
      incognito: { isPrivate: false, browserName: "Edge" },
      bot: { isBot: false, signals: [], confidence: 0 },
      cookiesEnabled: true,
      doNotTrack: null,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: "Google Inc.",
      vendorFlavors: ["Microsoft Edge"],
      confidenceScore: 94.2,
      deviceMemory: 16,
      hardwareConcurrency: 12,
    }
  }
];

// Edge case configurations that might occur in real-world scenarios
const edgeCaseConfigurations: Array<{ name: string; config: SystemInfo; description: string }> = [
  {
    name: 'headless_chrome',
    description: 'Headless Chrome with minimal features',
    config: {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
      platform: "Linux x86_64",
      screenResolution: [1280, 720],
      colorDepth: 24,
      colorGamut: "srgb",
      os: { os: "Linux", version: "Ubuntu 20.04" },
      webGL: {
        vendor: "Google Inc. (Google)",
        renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
        imageHash: "webgl_headless_swiftshader_hash_v1"
      } as WebGLInfo,
      canvas: {
        winding: true,
        geometry: "headless_canvas_geometry",
        text: "headless_canvas_text"
      } as CanvasInfo,
      audio: null, // Audio often unavailable in headless
      fontPreferences: {
        detectedFonts: ["DejaVu Sans", "Liberation Sans", "Ubuntu"].sort()
      } as FontPreferencesInfo,
      mathConstants: {
        acos: 1.4455469250725552,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649,
      } as MathInfo,
      plugins: [] as PluginInfo[],
      languages: ["en-US"],
      timezone: "UTC",
      incognito: { isPrivate: false, browserName: "Chrome" },
      bot: { isBot: true, signals: ["headless"], confidence: 0.9 },
      cookiesEnabled: false,
      doNotTrack: null,
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: "Google Inc.",
      vendorFlavors: ["Headless Chrome"],
      confidenceScore: 45.2,
      deviceMemory: undefined,
      hardwareConcurrency: 4,
    }
  },
  {
    name: 'privacy_focused_browser',
    description: 'Privacy-focused browser with many features disabled',
    config: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      platform: "Win32",
      screenResolution: [1024, 768], // Common resolution to blend in
      colorDepth: 24,
      colorGamut: "srgb",
      os: { os: "Windows", version: "10" },
      webGL: null as any, // WebGL disabled for privacy
      canvas: null as any, // Canvas disabled for privacy
      audio: null, // Audio fingerprinting disabled
      fontPreferences: {
        detectedFonts: [] // Font enumeration blocked
      } as FontPreferencesInfo,
      mathConstants: {} as MathInfo, // Math constants spoofed/disabled
      plugins: [] as PluginInfo[], // Plugin enumeration blocked
      languages: ["en-US"], // Minimal language info
      timezone: "UTC", // Timezone spoofed
      incognito: { isPrivate: true, browserName: "Chrome" },
      bot: { isBot: false, signals: [], confidence: 0 },
      cookiesEnabled: false, // Cookies disabled
      doNotTrack: "1",
      localStorage: false, // Storage disabled
      sessionStorage: false,
      indexedDB: false,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: "Google Inc.",
      vendorFlavors: ["Google Chrome"],
      confidenceScore: 25.1, // Low confidence due to privacy measures
      deviceMemory: undefined, // Not exposed
      hardwareConcurrency: 4, // Generic value
    }
  },
  {
    name: 'virtual_machine_browser',
    description: 'Browser running in a virtual machine environment',
    config: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      platform: "Win32",
      screenResolution: [1024, 768],
      colorDepth: 32,
      colorGamut: "srgb",
      os: { os: "Windows", version: "10" },
      webGL: {
        vendor: "Google Inc. (VMware)",
        renderer: "ANGLE (VMware, VMware SVGA 3D (Microsoft Corporation - WDDM 2.6), D3D11)",
        imageHash: "webgl_vmware_svga3d_hash_v1"
      } as WebGLInfo,
      canvas: {
        winding: true,
        geometry: "vmware_canvas_geometry",
        text: "vmware_canvas_text"
      } as CanvasInfo,
      audio: 35.73833402246237,
      fontPreferences: {
        detectedFonts: [
          "Arial", "Calibri", "Courier New", "Georgia", "Times New Roman", "Verdana"
        ].sort() // Limited font set in VM
      } as FontPreferencesInfo,
      mathConstants: {
        acos: 1.4455469250725552,
        acosh: 0.8813735870195429,
        asinh: 0.8813735870195429,
        atanh: 0.5493061443340549,
        expm1: 1.718281828459045,
        sinh: 1.1752011936438014,
        cosh: 1.5430806348152437,
        tanh: 0.7615941559557649,
      } as MathInfo,
      plugins: [
        {
          name: "PDF Viewer",
          description: "Portable Document Format",
          mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType]
        }
      ] as PluginInfo[],
      languages: ["en-US", "en"],
      timezone: "America/New_York",
      incognito: { isPrivate: false, browserName: "Chrome" },
      bot: { isBot: false, signals: ["vm"], confidence: 0.3 },
      cookiesEnabled: true,
      doNotTrack: null,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: "Google Inc.",
      vendorFlavors: ["Google Chrome"],
      confidenceScore: 72.8,
      deviceMemory: 4, // Limited memory in VM
      hardwareConcurrency: 2, // Limited cores in VM
    }
  }
];

describe('Comprehensive Integration Testing Suite', () => {
  let configurationHashes: Map<string, string>;

  beforeAll(async () => {
    // Generate baseline hashes for all configurations
    configurationHashes = new Map();
    
    for (const { name, config } of [...realWorldConfigurations, ...edgeCaseConfigurations]) {
      const hash = await generateId(config);
      configurationHashes.set(name, hash);
    }
  });

  describe('Real-World Browser Configuration Testing', () => {
    it.each(realWorldConfigurations)('should generate stable hash for $name: $description', async ({ name, config }) => {
      const iterations = 10;
      const hashes: string[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const hash = await generateId(deepClone(config));
        hashes.push(hash);
      }
      
      // All hashes should be identical
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
      
      // Hash should be valid SHA-256
      const hash = hashes[0];
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Hash should match baseline
      expect(hash).toBe(configurationHashes.get(name));
      
      console.log(`Integration Test "${name}": Hash = ${hash.substring(0, 16)}...`);
    });

    it('should generate different hashes for different browser configurations', async () => {
      const hashes = Array.from(configurationHashes.values());
      const uniqueHashes = new Set(hashes);
      
      // All configurations should produce different hashes
      expect(uniqueHashes.size).toBe(hashes.length);
      
      console.log('Browser Configuration Uniqueness:', {
        totalConfigurations: hashes.length,
        uniqueHashes: uniqueHashes.size,
        allUnique: uniqueHashes.size === hashes.length
      });
    });

    it('should handle cross-browser font differences correctly', async () => {
      const chromeConfig = realWorldConfigurations.find(c => c.name === 'chrome_windows_desktop')!.config;
      const firefoxConfig = realWorldConfigurations.find(c => c.name === 'firefox_windows_desktop')!.config;
      const safariConfig = realWorldConfigurations.find(c => c.name === 'safari_macos_desktop')!.config;
      
      const chromeHash = await generateId(chromeConfig);
      const firefoxHash = await generateId(firefoxConfig);
      const safariHash = await generateId(safariConfig);
      
      // Different browsers should have different hashes due to font differences
      expect(chromeHash).not.toBe(firefoxHash);
      expect(firefoxHash).not.toBe(safariHash);
      expect(chromeHash).not.toBe(safariHash);
      
      // Test font normalization specifically
      const chromeResult = await generateIdWithDebug(chromeConfig, { debugMode: true });
      const firefoxResult = await generateIdWithDebug(firefoxConfig, { debugMode: true });
      
      expect(chromeResult.debugInfo!.normalizedInput.detectedFontsString).toBeDefined();
      expect(firefoxResult.debugInfo!.normalizedInput.detectedFontsString).toBeDefined();
      expect(chromeResult.debugInfo!.normalizedInput.detectedFontsString)
        .not.toBe(firefoxResult.debugInfo!.normalizedInput.detectedFontsString);
    });

    it('should handle mobile vs desktop differences correctly', async () => {
      const desktopConfig = realWorldConfigurations.find(c => c.name === 'chrome_windows_desktop')!.config;
      const mobileConfig = realWorldConfigurations.find(c => c.name === 'chrome_android_mobile')!.config;
      
      const desktopHash = await generateId(desktopConfig);
      const mobileHash = await generateId(mobileConfig);
      
      // Desktop and mobile should have different hashes
      expect(desktopHash).not.toBe(mobileHash);
      
      // Compare specific differences
      const comparison = await compareInputs(desktopConfig, mobileConfig);
      expect(comparison.identical).toBe(false);
      
      // Should detect key differences
      const significantDifferences = comparison.differences.filter(d => d.affectsHash);
      expect(significantDifferences.length).toBeGreaterThan(0);
      
      // Touch support should be different
      const touchDifference = significantDifferences.find(d => d.property.includes('touchSupport'));
      expect(touchDifference).toBeDefined();
    });
  });

  describe('Edge Case Configuration Testing', () => {
    it.each(edgeCaseConfigurations)('should handle edge case $name: $description', async ({ name, config }) => {
      const iterations = 5;
      const hashes: string[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const hash = await generateId(deepClone(config));
        hashes.push(hash);
      }
      
      // All hashes should be identical (consistent fallback behavior)
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
      
      // Hash should be valid SHA-256
      const hash = hashes[0];
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Hash should match baseline
      expect(hash).toBe(configurationHashes.get(name));
      
      console.log(`Edge Case Test "${name}": Hash = ${hash.substring(0, 16)}...`);
    });

    it('should handle privacy-focused browser with consistent fallbacks', async () => {
      const privacyConfig = edgeCaseConfigurations.find(c => c.name === 'privacy_focused_browser')!.config;
      
      const result = await generateIdWithDebug(privacyConfig, { debugMode: true });
      
      // Should have many fallbacks applied
      const fallbackCount = Object.keys(result.debugInfo!.appliedFallbacks).length;
      expect(fallbackCount).toBeGreaterThan(3);
      
      // Should still generate a valid hash
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Fallbacks should be consistent
      const fallbackKeys = Object.keys(result.debugInfo!.appliedFallbacks);
      expect(fallbackKeys).toContain('webGL');
      expect(fallbackKeys).toContain('canvas');
      expect(fallbackKeys).toContain('audio');
      
      console.log('Privacy Browser Fallbacks:', {
        fallbackCount,
        fallbackProperties: fallbackKeys,
        hash: result.hash.substring(0, 16) + '...'
      });
    });

    it('should detect and handle headless browser characteristics', async () => {
      const headlessConfig = edgeCaseConfigurations.find(c => c.name === 'headless_chrome')!.config;
      
      const result = await generateIdWithDebug(headlessConfig, { debugMode: true });
      
      // Should generate a valid hash
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Should handle headless-specific characteristics
      expect(result.debugInfo!.normalizedInput.userAgent).toContain('HeadlessChrome');
      expect(result.debugInfo!.normalizedInput.canvasFingerprint).toBeDefined();
      
      // Bot detection should be reflected
      expect(headlessConfig.bot.isBot).toBe(true);
      expect(headlessConfig.bot.signals).toContain('headless');
    });

    it('should handle virtual machine environment consistently', async () => {
      const vmConfig = edgeCaseConfigurations.find(c => c.name === 'virtual_machine_browser')!.config;
      
      const result = await generateIdWithDebug(vmConfig, { debugMode: true });
      
      // Should generate a valid hash
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Should handle VM-specific WebGL characteristics
      expect(result.debugInfo!.normalizedInput.webGLImageHash).toContain('vmware');
      
      // Should have limited hardware characteristics
      expect(vmConfig.hardwareConcurrency).toBeLessThanOrEqual(4);
      expect(vmConfig.deviceMemory).toBeLessThanOrEqual(8);
    });
  });

  describe('Cross-Configuration Comparison Testing', () => {
    it('should provide detailed comparison between similar configurations', async () => {
      const chromeConfig = realWorldConfigurations.find(c => c.name === 'chrome_windows_desktop')!.config;
      const edgeConfig = realWorldConfigurations.find(c => c.name === 'edge_windows_desktop')!.config;
      
      const comparison = await compareInputs(chromeConfig, edgeConfig);
      
      expect(comparison.identical).toBe(false);
      
      // Should detect specific differences
      const userAgentDiff = comparison.differences.find(d => d.property === 'userAgent');
      expect(userAgentDiff).toBeDefined();
      expect(userAgentDiff!.affectsHash).toBe(true);
      
      const vendorFlavorsDiff = comparison.differences.find(d => d.property === 'vendorFlavors');
      expect(vendorFlavorsDiff).toBeDefined();
      
      console.log('Chrome vs Edge Comparison:', {
        identical: comparison.identical,
        totalDifferences: comparison.differences.length,
        hashAffectingDifferences: comparison.differences.filter(d => d.affectsHash).length,
        sampleDifferences: comparison.differences.slice(0, 3).map(d => ({
          property: d.property,
          affectsHash: d.affectsHash
        }))
      });
    });

    it('should identify non-fingerprinting property changes', async () => {
      const baseConfig = realWorldConfigurations.find(c => c.name === 'chrome_windows_desktop')!.config;
      
      // Create variations that shouldn't affect the hash
      const timezoneVariation = { ...deepClone(baseConfig), timezone: "Europe/London" };
      const languageVariation = { ...deepClone(baseConfig), languages: ["fr-FR", "fr", "en"] };
      const cookieVariation = { ...deepClone(baseConfig), cookiesEnabled: false };
      
      const baseHash = await generateId(baseConfig);
      const timezoneHash = await generateId(timezoneVariation);
      const languageHash = await generateId(languageVariation);
      const cookieHash = await generateId(cookieVariation);
      
      // These variations should not affect the hash
      expect(timezoneHash).toBe(baseHash);
      expect(languageHash).toBe(baseHash);
      expect(cookieHash).toBe(baseHash);
      
      console.log('Non-Fingerprinting Property Test:', {
        baseHash: baseHash.substring(0, 16) + '...',
        timezoneUnchanged: timezoneHash === baseHash,
        languageUnchanged: languageHash === baseHash,
        cookieUnchanged: cookieHash === baseHash
      });
    });

    it('should identify fingerprinting property changes', async () => {
      const baseConfig = realWorldConfigurations.find(c => c.name === 'chrome_windows_desktop')!.config;
      
      // Create variations that should affect the hash
      const screenVariation = { ...deepClone(baseConfig), screenResolution: [2560, 1440] as [number, number] };
      const webglVariation = { 
        ...deepClone(baseConfig), 
        webGL: { 
          ...baseConfig.webGL, 
          renderer: "Different GPU Renderer" 
        } as WebGLInfo 
      };
      const fontVariation = { 
        ...deepClone(baseConfig), 
        fontPreferences: { 
          detectedFonts: ["Arial", "Times New Roman"] // Reduced font set
        } as FontPreferencesInfo 
      };
      
      const baseHash = await generateId(baseConfig);
      const screenHash = await generateId(screenVariation);
      const webglHash = await generateId(webglVariation);
      const fontHash = await generateId(fontVariation);
      
      // These variations should affect the hash
      expect(screenHash).not.toBe(baseHash);
      expect(webglHash).not.toBe(baseHash);
      expect(fontHash).not.toBe(baseHash);
      
      console.log('Fingerprinting Property Test:', {
        baseHash: baseHash.substring(0, 16) + '...',
        screenChanged: screenHash !== baseHash,
        webglChanged: webglHash !== baseHash,
        fontChanged: fontHash !== baseHash
      });
    });
  });

  describe('Performance Integration Testing', () => {
    it('should maintain acceptable performance with real-world data', async () => {
      const performanceResults: Array<{ name: string; averageTime: number }> = [];
      
      for (const { name, config } of realWorldConfigurations) {
        const iterations = 20;
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
          const result = await generateIdWithDebug(deepClone(config), { debugMode: true });
          times.push(result.debugInfo!.processingTime);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        performanceResults.push({ name, averageTime });
        
        // Each configuration should process within reasonable time
        expect(averageTime).toBeLessThan(100); // 100ms max
      }
      
      const overallAverage = performanceResults.reduce((sum, result) => sum + result.averageTime, 0) / performanceResults.length;
      
      console.log('Real-World Performance Results:', {
        configurations: performanceResults.length,
        overallAverage: `${overallAverage.toFixed(2)}ms`,
        results: performanceResults.map(r => ({ name: r.name, time: `${r.averageTime.toFixed(2)}ms` }))
      });
      
      expect(overallAverage).toBeLessThan(75); // Overall average should be under 75ms
    });

    it('should handle concurrent hash generation efficiently', async () => {
      const testConfigs = realWorldConfigurations.slice(0, 3).map(c => c.config);
      const concurrentCount = 10;
      
      const startTime = performance.now();
      
      // Generate hashes concurrently
      const promises = Array.from({ length: concurrentCount }, (_, i) => 
        generateId(deepClone(testConfigs[i % testConfigs.length]))
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const averageTimePerHash = totalTime / concurrentCount;
      
      // All results should be valid hashes
      results.forEach(hash => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });
      
      // Concurrent processing should be efficient
      expect(averageTimePerHash).toBeLessThan(50); // 50ms average per hash
      
      console.log('Concurrent Processing Test:', {
        concurrentCount,
        totalTime: `${totalTime.toFixed(2)}ms`,
        averageTimePerHash: `${averageTimePerHash.toFixed(2)}ms`
      });
    });
  });

  describe('Validation Integration Testing', () => {
    it('should validate real-world configurations successfully', async () => {
      for (const { name, config } of realWorldConfigurations) {
        const result = await generateIdWithDebug(config, { 
          debugMode: true, 
          enableValidation: true,
          strictMode: false
        });
        
        // Should generate valid hash
        expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        
        // Should have minimal validation errors for real-world data
        expect(result.debugInfo!.validationErrors.length).toBeLessThan(5);
        
        console.log(`Validation Test "${name}":`, {
          hash: result.hash.substring(0, 16) + '...',
          validationErrors: result.debugInfo!.validationErrors.length,
          fallbacks: Object.keys(result.debugInfo!.appliedFallbacks).length
        });
      }
    });

    it('should handle edge case validation appropriately', async () => {
      for (const { name, config } of edgeCaseConfigurations) {
        const result = await generateIdWithDebug(config, { 
          debugMode: true, 
          enableValidation: true,
          strictMode: false
        });
        
        // Should still generate valid hash even with edge cases
        expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        
        console.log(`Edge Case Validation "${name}":`, {
          hash: result.hash.substring(0, 16) + '...',
          validationErrors: result.debugInfo!.validationErrors.length,
          fallbacks: Object.keys(result.debugInfo!.appliedFallbacks).length
        });
      }
    });
  });
});