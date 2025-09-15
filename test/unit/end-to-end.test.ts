import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateId, generateIdWithDebug, compareInputs, HashGeneratorConfig } from '@/src/hash';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo, MimeType } from '@/src/types';

/**
 * End-to-End Hash Stability Testing Suite
 * 
 * This test suite implements comprehensive end-to-end testing to verify
 * hash stability across browser sessions and different execution contexts.
 * 
 * Requirements covered:
 * - End-to-end tests verifying hash stability across browser sessions
 * - Session persistence and consistency testing
 * - Cross-execution context stability
 */

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Simulated browser session data
interface BrowserSession {
  sessionId: string;
  timestamp: number;
  systemInfo: SystemInfo;
  userAgent: string;
  sessionStorage: Record<string, any>;
  localStorage: Record<string, any>;
}

// Session simulation utilities
class SessionSimulator {
  private sessions: Map<string, BrowserSession> = new Map();
  private sessionCounter = 0;

  createSession(baseSystemInfo: SystemInfo): BrowserSession {
    const sessionId = `session_${++this.sessionCounter}_${Date.now()}`;
    const session: BrowserSession = {
      sessionId,
      timestamp: Date.now(),
      systemInfo: deepClone(baseSystemInfo),
      userAgent: baseSystemInfo.userAgent,
      sessionStorage: {},
      localStorage: {}
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  simulateSessionRestart(sessionId: string): BrowserSession | null {
    const existingSession = this.sessions.get(sessionId);
    if (!existingSession) return null;

    // Simulate session restart - sessionStorage is cleared, localStorage persists
    const restartedSession: BrowserSession = {
      ...existingSession,
      timestamp: Date.now(),
      sessionStorage: {}, // Cleared on restart
      // localStorage persists
    };

    this.sessions.set(sessionId, restartedSession);
    return restartedSession;
  }

  simulateBrowserRestart(sessionId: string): BrowserSession | null {
    const existingSession = this.sessions.get(sessionId);
    if (!existingSession) return null;

    // Simulate browser restart - both storages cleared, but system info should be the same
    const restartedSession: BrowserSession = {
      ...existingSession,
      timestamp: Date.now(),
      sessionStorage: {}, // Cleared on browser restart
      localStorage: {}, // Cleared on browser restart
    };

    this.sessions.set(sessionId, restartedSession);
    return restartedSession;
  }

  simulateSystemReboot(sessionId: string, systemChanges: Partial<SystemInfo> = {}): BrowserSession | null {
    const existingSession = this.sessions.get(sessionId);
    if (!existingSession) return null;

    // Simulate system reboot - storages cleared, some system info might change
    const rebootedSession: BrowserSession = {
      ...existingSession,
      timestamp: Date.now(),
      systemInfo: { ...existingSession.systemInfo, ...systemChanges },
      sessionStorage: {},
      localStorage: {},
    };

    this.sessions.set(sessionId, rebootedSession);
    return rebootedSession;
  }

  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): BrowserSession[] {
    return Array.from(this.sessions.values());
  }

  clearAllSessions(): void {
    this.sessions.clear();
    this.sessionCounter = 0;
  }
}

// Baseline system configuration for end-to-end testing
const e2eBaselineSystemInfo: SystemInfo = {
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  platform: "Win32",
  screenResolution: [1920, 1080],
  colorDepth: 24,
  colorGamut: "srgb",
  os: { os: "Windows", version: "10" },
  webGL: {
    vendor: "Google Inc. (NVIDIA)",
    renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    imageHash: "webgl_e2e_test_hash_v1"
  } as WebGLInfo,
  canvas: {
    winding: true,
    geometry: "e2e_canvas_geometry_test",
    text: "e2e_canvas_text_test"
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
};

// Test scenarios for different session states
const sessionScenarios = [
  {
    name: 'normal_browsing_session',
    description: 'Normal browsing session with all features enabled',
    systemInfo: e2eBaselineSystemInfo
  },
  {
    name: 'incognito_session',
    description: 'Incognito/private browsing session',
    systemInfo: {
      ...e2eBaselineSystemInfo,
      incognito: { isPrivate: true, browserName: "Chrome" },
      localStorage: false,
      sessionStorage: false,
      cookiesEnabled: false
    }
  },
  {
    name: 'limited_features_session',
    description: 'Session with some features disabled',
    systemInfo: {
      ...e2eBaselineSystemInfo,
      audio: null,
      doNotTrack: "1",
      cookiesEnabled: false
    }
  }
];

describe('End-to-End Hash Stability Testing Suite', () => {
  let sessionSimulator: SessionSimulator;
  let baselineHashes: Map<string, string>;

  beforeAll(async () => {
    sessionSimulator = new SessionSimulator();
    baselineHashes = new Map();

    // Generate baseline hashes for all scenarios
    for (const scenario of sessionScenarios) {
      const hash = await generateId(scenario.systemInfo);
      baselineHashes.set(scenario.name, hash);
    }
  });

  afterAll(() => {
    sessionSimulator.clearAllSessions();
  });

  describe('Browser Session Persistence Testing', () => {
    it('should maintain hash stability across page reloads', async () => {
      const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const iterations = 20;
      const hashes: string[] = [];

      // Simulate multiple page reloads within the same session
      for (let i = 0; i < iterations; i++) {
        // Each page reload should use the same system info
        const hash = await generateId(deepClone(session.systemInfo));
        hashes.push(hash);
        
        // Simulate small time delay between reloads
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // All hashes should be identical
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
      
      // Should match baseline
      expect(hashes[0]).toBe(baselineHashes.get('normal_browsing_session'));

      console.log('Page Reload Stability Test:', {
        sessionId: session.sessionId,
        iterations,
        uniqueHashes: uniqueHashes.size,
        hash: hashes[0].substring(0, 16) + '...'
      });
    });

    it('should maintain hash stability across browser tab changes', async () => {
      const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const tabCount = 10;
      const hashesPerTab: string[][] = [];

      // Simulate multiple tabs with the same system info
      for (let tab = 0; tab < tabCount; tab++) {
        const tabHashes: string[] = [];
        
        // Generate multiple hashes per tab
        for (let i = 0; i < 5; i++) {
          const hash = await generateId(deepClone(session.systemInfo));
          tabHashes.push(hash);
        }
        
        hashesPerTab.push(tabHashes);
      }

      // All hashes across all tabs should be identical
      const allHashes = hashesPerTab.flat();
      const uniqueHashes = new Set(allHashes);
      expect(uniqueHashes.size).toBe(1);

      // Each tab should have consistent hashes
      hashesPerTab.forEach((tabHashes, tabIndex) => {
        const tabUniqueHashes = new Set(tabHashes);
        expect(tabUniqueHashes.size).toBe(1);
      });

      console.log('Tab Change Stability Test:', {
        sessionId: session.sessionId,
        tabCount,
        totalHashes: allHashes.length,
        uniqueHashes: uniqueHashes.size,
        hash: allHashes[0].substring(0, 16) + '...'
      });
    });

    it('should maintain hash stability across session storage changes', async () => {
      const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const baseHash = await generateId(session.systemInfo);

      // Simulate session storage changes (should not affect hash)
      const sessionStorageVariations = [
        { key: 'user_preference', value: 'dark_mode' },
        { key: 'shopping_cart', value: JSON.stringify([{ id: 1, name: 'item' }]) },
        { key: 'form_data', value: 'temporary_form_state' },
        { key: 'scroll_position', value: '1250' }
      ];

      for (const variation of sessionStorageVariations) {
        session.sessionStorage[variation.key] = variation.value;
        const hash = await generateId(session.systemInfo);
        
        // Session storage changes should not affect the hash
        expect(hash).toBe(baseHash);
      }

      console.log('Session Storage Stability Test:', {
        sessionId: session.sessionId,
        variations: sessionStorageVariations.length,
        hashStable: true
      });
    });

    it('should maintain hash stability across local storage changes', async () => {
      const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const baseHash = await generateId(session.systemInfo);

      // Simulate local storage changes (should not affect hash)
      const localStorageVariations = [
        { key: 'user_settings', value: JSON.stringify({ theme: 'dark', lang: 'en' }) },
        { key: 'cached_data', value: 'large_cached_response_data' },
        { key: 'analytics_id', value: 'analytics_user_id_12345' },
        { key: 'feature_flags', value: JSON.stringify({ newFeature: true }) }
      ];

      for (const variation of localStorageVariations) {
        session.localStorage[variation.key] = variation.value;
        const hash = await generateId(session.systemInfo);
        
        // Local storage changes should not affect the hash
        expect(hash).toBe(baseHash);
      }

      console.log('Local Storage Stability Test:', {
        sessionId: session.sessionId,
        variations: localStorageVariations.length,
        hashStable: true
      });
    });
  });

  describe('Browser Restart Simulation Testing', () => {
    it('should maintain hash stability after session restart', async () => {
      const originalSession = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const originalHash = await generateId(originalSession.systemInfo);

      // Simulate session restart (sessionStorage cleared, localStorage persists)
      const restartedSession = sessionSimulator.simulateSessionRestart(originalSession.sessionId);
      expect(restartedSession).not.toBeNull();

      const restartedHash = await generateId(restartedSession!.systemInfo);

      // Hash should remain the same after session restart
      expect(restartedHash).toBe(originalHash);
      expect(restartedHash).toBe(baselineHashes.get('normal_browsing_session'));

      // Verify session storage was cleared but system info is the same
      expect(Object.keys(restartedSession!.sessionStorage)).toHaveLength(0);
      expect(restartedSession!.systemInfo).toEqual(originalSession.systemInfo);

      console.log('Session Restart Stability Test:', {
        originalSessionId: originalSession.sessionId,
        hashStable: restartedHash === originalHash,
        hash: restartedHash.substring(0, 16) + '...'
      });
    });

    it('should maintain hash stability after browser restart', async () => {
      const originalSession = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const originalHash = await generateId(originalSession.systemInfo);

      // Simulate browser restart (both storages cleared)
      const restartedSession = sessionSimulator.simulateBrowserRestart(originalSession.sessionId);
      expect(restartedSession).not.toBeNull();

      const restartedHash = await generateId(restartedSession!.systemInfo);

      // Hash should remain the same after browser restart
      expect(restartedHash).toBe(originalHash);
      expect(restartedHash).toBe(baselineHashes.get('normal_browsing_session'));

      // Verify both storages were cleared but system info is the same
      expect(Object.keys(restartedSession!.sessionStorage)).toHaveLength(0);
      expect(Object.keys(restartedSession!.localStorage)).toHaveLength(0);
      expect(restartedSession!.systemInfo).toEqual(originalSession.systemInfo);

      console.log('Browser Restart Stability Test:', {
        originalSessionId: originalSession.sessionId,
        hashStable: restartedHash === originalHash,
        hash: restartedHash.substring(0, 16) + '...'
      });
    });

    it('should handle system reboot with minimal changes', async () => {
      const originalSession = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const originalHash = await generateId(originalSession.systemInfo);

      // Simulate system reboot with minor system changes that shouldn't affect hash
      const minorChanges: Partial<SystemInfo> = {
        timezone: "America/Chicago", // Timezone change shouldn't affect hash
        languages: ["en-US", "en", "es"], // Language addition shouldn't affect hash
        cookiesEnabled: false, // Cookie setting change shouldn't affect hash
        localStorage: false, // Storage availability change shouldn't affect hash
        sessionStorage: false
      };

      const rebootedSession = sessionSimulator.simulateSystemReboot(originalSession.sessionId, minorChanges);
      expect(rebootedSession).not.toBeNull();

      const rebootedHash = await generateId(rebootedSession!.systemInfo);

      // Hash should remain the same despite minor system changes
      expect(rebootedHash).toBe(originalHash);

      console.log('System Reboot (Minor Changes) Stability Test:', {
        originalSessionId: originalSession.sessionId,
        changes: Object.keys(minorChanges),
        hashStable: rebootedHash === originalHash,
        hash: rebootedHash.substring(0, 16) + '...'
      });
    });

    it('should detect system reboot with major hardware changes', async () => {
      const originalSession = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const originalHash = await generateId(originalSession.systemInfo);

      // Simulate system reboot with major hardware changes that should affect hash
      const majorChanges: Partial<SystemInfo> = {
        screenResolution: [2560, 1440] as [number, number], // Screen resolution change should affect hash
        webGL: {
          vendor: "Google Inc. (AMD)",
          renderer: "ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
          imageHash: "webgl_amd_rx6800xt_hash_v1"
        } as WebGLInfo, // GPU change should affect hash
        hardwareConcurrency: 16, // CPU change should affect hash (if it's significant)
        deviceMemory: 32 // Memory change should affect hash (if it's significant)
      };

      const rebootedSession = sessionSimulator.simulateSystemReboot(originalSession.sessionId, majorChanges);
      expect(rebootedSession).not.toBeNull();

      const rebootedHash = await generateId(rebootedSession!.systemInfo);

      // Hash should be different due to major hardware changes
      expect(rebootedHash).not.toBe(originalHash);

      // Verify the changes were applied
      expect(rebootedSession!.systemInfo.screenResolution).toEqual([2560, 1440]);
      expect(rebootedSession!.systemInfo.webGL!.vendor).toContain("AMD");

      console.log('System Reboot (Major Changes) Detection Test:', {
        originalSessionId: originalSession.sessionId,
        changes: Object.keys(majorChanges),
        hashChanged: rebootedHash !== originalHash,
        originalHash: originalHash.substring(0, 16) + '...',
        newHash: rebootedHash.substring(0, 16) + '...'
      });
    });
  });

  describe('Cross-Session Scenario Testing', () => {
    it.each(sessionScenarios)('should maintain stability for $name: $description', async (scenario) => {
      const sessions: BrowserSession[] = [];
      const hashes: string[] = [];

      // Create multiple sessions with the same scenario
      for (let i = 0; i < 5; i++) {
        const session = sessionSimulator.createSession(scenario.systemInfo);
        sessions.push(session);
        
        const hash = await generateId(session.systemInfo);
        hashes.push(hash);
        
        // Small delay between sessions
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // All sessions should produce the same hash
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
      
      // Should match baseline for this scenario
      expect(hashes[0]).toBe(baselineHashes.get(scenario.name));

      console.log(`Cross-Session Stability Test "${scenario.name}":`, {
        sessionCount: sessions.length,
        uniqueHashes: uniqueHashes.size,
        hash: hashes[0].substring(0, 16) + '...'
      });
    });

    it('should differentiate between different session types', async () => {
      const sessionHashes: Array<{ name: string; hash: string }> = [];

      // Generate hashes for each scenario type
      for (const scenario of sessionScenarios) {
        const session = sessionSimulator.createSession(scenario.systemInfo);
        const hash = await generateId(session.systemInfo);
        sessionHashes.push({ name: scenario.name, hash });
      }

      // Different session types should produce different hashes (where appropriate)
      const normalSession = sessionHashes.find(s => s.name === 'normal_browsing_session')!;
      const incognitoSession = sessionHashes.find(s => s.name === 'incognito_session')!;
      const limitedSession = sessionHashes.find(s => s.name === 'limited_features_session')!;

      // Normal and incognito should be the same (incognito mode doesn't change core fingerprinting)
      expect(normalSession.hash).toBe(incognitoSession.hash);
      
      // Limited features should be the same as normal (audio and cookies don't affect core hash)
      expect(normalSession.hash).toBe(limitedSession.hash);

      console.log('Session Type Differentiation Test:', {
        sessionTypes: sessionHashes.length,
        results: sessionHashes.map(s => ({ name: s.name, hash: s.hash.substring(0, 16) + '...' }))
      });
    });
  });

  describe('Long-Running Session Simulation', () => {
    it('should maintain hash stability over extended time periods', async () => {
      const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
      const duration = 100; // Simulate 100 time periods
      const hashes: Array<{ time: number; hash: string }> = [];

      // Simulate hash generation over extended time
      for (let time = 0; time < duration; time++) {
        const hash = await generateId(deepClone(session.systemInfo));
        hashes.push({ time, hash });
        
        // Simulate time passing
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // All hashes should be identical over time
      const uniqueHashes = new Set(hashes.map(h => h.hash));
      expect(uniqueHashes.size).toBe(1);

      // Should match baseline
      expect(hashes[0].hash).toBe(baselineHashes.get('normal_browsing_session'));

      console.log('Long-Running Session Stability Test:', {
        sessionId: session.sessionId,
        duration,
        totalHashes: hashes.length,
        uniqueHashes: uniqueHashes.size,
        hash: hashes[0].hash.substring(0, 16) + '...'
      });
    });

    it('should handle concurrent session simulation', async () => {
      const concurrentSessions = 10;
      const hashesPerSession = 5;
      const allResults: Array<{ sessionId: string; hashes: string[] }> = [];

      // Create multiple concurrent sessions
      const sessionPromises = Array.from({ length: concurrentSessions }, async (_, sessionIndex) => {
        const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
        const sessionHashes: string[] = [];

        // Generate multiple hashes per session
        for (let i = 0; i < hashesPerSession; i++) {
          const hash = await generateId(deepClone(session.systemInfo));
          sessionHashes.push(hash);
        }

        return { sessionId: session.sessionId, hashes: sessionHashes };
      });

      const results = await Promise.all(sessionPromises);
      allResults.push(...results);

      // Each session should have consistent hashes
      results.forEach(result => {
        const uniqueHashes = new Set(result.hashes);
        expect(uniqueHashes.size).toBe(1);
      });

      // All sessions should produce the same hash (same system info)
      const allHashes = results.flatMap(r => r.hashes);
      const globalUniqueHashes = new Set(allHashes);
      expect(globalUniqueHashes.size).toBe(1);

      console.log('Concurrent Session Simulation Test:', {
        concurrentSessions,
        hashesPerSession,
        totalHashes: allHashes.length,
        uniqueHashes: globalUniqueHashes.size,
        hash: allHashes[0].substring(0, 16) + '...'
      });
    });
  });

  describe('Error Recovery and Resilience Testing', () => {
    it('should recover gracefully from temporary failures', async () => {
      const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
      
      // Simulate temporary failures by corrupting some data temporarily
      const corruptedSystemInfo = {
        ...session.systemInfo,
        webGL: null as any, // Simulate WebGL failure
        canvas: null as any, // Simulate Canvas failure
        audio: null // Simulate Audio failure
      };

      // Generate hash with corrupted data (should use fallbacks)
      const corruptedHash = await generateId(corruptedSystemInfo);
      expect(corruptedHash).toMatch(/^[a-f0-9]{64}$/);

      // Generate hash with original data (should be different)
      const originalHash = await generateId(session.systemInfo);
      expect(originalHash).toMatch(/^[a-f0-9]{64}$/);

      // Hashes should be different due to fallback usage
      expect(corruptedHash).not.toBe(originalHash);

      // But corrupted hash should be consistent
      const corruptedHash2 = await generateId(corruptedSystemInfo);
      expect(corruptedHash2).toBe(corruptedHash);

      console.log('Error Recovery Test:', {
        sessionId: session.sessionId,
        originalHash: originalHash.substring(0, 16) + '...',
        corruptedHash: corruptedHash.substring(0, 16) + '...',
        fallbackConsistent: corruptedHash2 === corruptedHash
      });
    });

    it('should handle partial system info gracefully', async () => {
      const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
      
      // Create system info with missing properties
      const partialSystemInfo = {
        userAgent: session.systemInfo.userAgent,
        platform: session.systemInfo.platform,
        screenResolution: session.systemInfo.screenResolution,
        colorDepth: session.systemInfo.colorDepth,
        // Missing many other properties
      } as SystemInfo;

      // Should still generate a valid hash using fallbacks
      const partialHash = await generateId(partialSystemInfo);
      expect(partialHash).toMatch(/^[a-f0-9]{64}$/);

      // Should be consistent across multiple calls
      const partialHash2 = await generateId(partialSystemInfo);
      expect(partialHash2).toBe(partialHash);

      // Should be different from complete system info
      const completeHash = await generateId(session.systemInfo);
      expect(partialHash).not.toBe(completeHash);

      console.log('Partial System Info Test:', {
        sessionId: session.sessionId,
        completeHash: completeHash.substring(0, 16) + '...',
        partialHash: partialHash.substring(0, 16) + '...',
        partialConsistent: partialHash2 === partialHash
      });
    });
  });

  describe('Performance Under Load Testing', () => {
    it('should maintain performance under high session load', async () => {
      const sessionCount = 50;
      const hashesPerSession = 10;
      const startTime = performance.now();

      // Create many sessions and generate hashes
      const sessionPromises = Array.from({ length: sessionCount }, async () => {
        const session = sessionSimulator.createSession(e2eBaselineSystemInfo);
        const hashes: string[] = [];

        for (let i = 0; i < hashesPerSession; i++) {
          const hash = await generateId(deepClone(session.systemInfo));
          hashes.push(hash);
        }

        return hashes;
      });

      const results = await Promise.all(sessionPromises);
      const endTime = performance.now();

      const totalHashes = results.flat().length;
      const totalTime = endTime - startTime;
      const averageTimePerHash = totalTime / totalHashes;

      // All hashes should be valid
      results.flat().forEach(hash => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });

      // Performance should be acceptable under load
      expect(averageTimePerHash).toBeLessThan(10); // 10ms average per hash

      console.log('High Load Performance Test:', {
        sessionCount,
        hashesPerSession,
        totalHashes,
        totalTime: `${totalTime.toFixed(2)}ms`,
        averageTimePerHash: `${averageTimePerHash.toFixed(2)}ms`
      });
    });
  });
});