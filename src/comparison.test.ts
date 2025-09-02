/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

/**
 * Tests for hash comparison utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  HashComparator,
  DifferenceType,
  DifferenceSeverity,
  compareSystemInfo,
  analyzeHashVariations,
  getHashTroubleshooter
} from './comparison';
import { SystemInfo } from './types';

// Mock SystemInfo objects for testing
const createMockSystemInfo = (overrides: Partial<SystemInfo> = {}): SystemInfo => ({
  incognito: { isPrivate: false, browserName: 'chrome' },
  bot: { isBot: false, signals: [], confidence: 0 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    renderer: 'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    imageHash: 'webgl_hash_123'
  },
  canvas: {
    winding: true,
    geometry: 'canvas_geo_123',
    text: 'canvas_text_123'
  },
  plugins: [
    { name: 'Chrome PDF Plugin', description: 'Portable Document Format', mimeTypes: [] }
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
    detectedFonts: ['Arial', 'Times New Roman', 'Courier New']
  },
  confidenceScore: 0.95,
  ...overrides
});

describe('HashComparator', () => {
  let comparator: HashComparator;

  beforeEach(() => {
    comparator = new HashComparator();
  });

  it('should detect identical inputs', async () => {
    const info1 = createMockSystemInfo();
    const info2 = createMockSystemInfo();

    const result = await comparator.compareSystemInfo(info1, info2);

    expect(result.identical).toBe(true);
    expect(result.hashesMatch).toBe(true);
    expect(result.differences).toHaveLength(0);
  });

  it('should detect value differences', async () => {
    const info1 = createMockSystemInfo({ userAgent: 'Mozilla/5.0 Chrome' });
    const info2 = createMockSystemInfo({ userAgent: 'Mozilla/5.0 Firefox' });

    const result = await comparator.compareSystemInfo(info1, info2);

    expect(result.identical).toBe(false);
    expect(result.differences.length).toBeGreaterThan(0);
    
    const userAgentDiff = result.differences.find(d => d.property === 'userAgent');
    expect(userAgentDiff).toBeDefined();
    expect(userAgentDiff?.type).toBe(DifferenceType.VALUE_CHANGE);
    expect(userAgentDiff?.value1).toBe('Mozilla/5.0 Chrome');
    expect(userAgentDiff?.value2).toBe('Mozilla/5.0 Firefox');
  });

  it('should detect type changes', async () => {
    const info1 = createMockSystemInfo({ screenResolution: [1920, 1080] });
    const info2 = createMockSystemInfo({ screenResolution: '1920x1080' as any });

    const result = await comparator.compareSystemInfo(info1, info2);

    const resolutionDiff = result.differences.find(d => d.property === 'screenResolution');
    expect(resolutionDiff?.type).toBe(DifferenceType.TYPE_CHANGE);
    expect(resolutionDiff?.severity).toBe(DifferenceSeverity.HIGH);
  });

  it('should detect precision differences', async () => {
    const info1 = createMockSystemInfo({ audio: 124.04344968475198 });
    const info2 = createMockSystemInfo({ audio: 124.04344968475199 });

    const result = await comparator.compareSystemInfo(info1, info2);

    const audioDiff = result.differences.find(d => d.property === 'audio');
    expect(audioDiff?.type).toBe(DifferenceType.PRECISION_DIFFERENCE);
    expect(audioDiff?.severity).toBe(DifferenceSeverity.LOW);
  });

  it('should detect whitespace differences', async () => {
    const info1 = createMockSystemInfo({ userAgent: 'Mozilla/5.0 Chrome' });
    const info2 = createMockSystemInfo({ userAgent: '  Mozilla/5.0 Chrome  ' });

    const result = await comparator.compareSystemInfo(info1, info2);

    const userAgentDiff = result.differences.find(d => d.property === 'userAgent');
    expect(userAgentDiff?.type).toBe(DifferenceType.WHITESPACE_DIFFERENCE);
    expect(userAgentDiff?.severity).toBe(DifferenceSeverity.NEGLIGIBLE);
  });

  it('should analyze impact correctly', async () => {
    const info1 = createMockSystemInfo({ 
      userAgent: 'Mozilla/5.0 Chrome',
      audio: 124.043,
      languages: ['en-US']
    });
    const info2 = createMockSystemInfo({ 
      userAgent: 'Mozilla/5.0 Firefox', // Critical difference
      audio: 124.044, // Precision difference (should be normalized away)
      languages: ['en-GB'] // Value change
    });

    const result = await comparator.compareSystemInfo(info1, info2);

    expect(result.impactAnalysis.totalDifferences).toBeGreaterThan(0);
    expect(result.impactAnalysis.criticalDifferences).toBeGreaterThan(0);
    expect(result.impactAnalysis.hashStabilityScore).toBeLessThan(1.0);
    expect(result.impactAnalysis.recommendations.length).toBeGreaterThan(0);
  });

  it('should create detailed difference reports', async () => {
    const info1 = createMockSystemInfo({ userAgent: 'Chrome' });
    const info2 = createMockSystemInfo({ userAgent: 'Firefox' });

    const result = await comparator.compareSystemInfo(info1, info2);
    const report = comparator.createDifferenceReport(result);

    expect(report).toContain('Hash Comparison Report');
    expect(report).toContain('Hash Results');
    expect(report).toContain('Impact Analysis');
    expect(report).toContain('userAgent');
  });
});

describe('Hash variation analysis', () => {
  it('should analyze variations across multiple inputs', async () => {
    const inputs = [
      createMockSystemInfo({ userAgent: 'Chrome v1' }),
      createMockSystemInfo({ userAgent: 'Chrome v2' }),
      createMockSystemInfo({ userAgent: 'Firefox v1' }),
      createMockSystemInfo({ userAgent: 'Chrome v1' }) // Duplicate
    ];

    const analysis = await analyzeHashVariations(inputs);

    expect(analysis.inputHashes).toHaveLength(4);
    expect(analysis.uniqueHashes.length).toBeLessThanOrEqual(3);
    expect(analysis.variationRate).toBeGreaterThan(0);
    expect(analysis.stabilityMetrics).toBeDefined();
    expect(analysis.recommendations).toBeDefined();
  });

  it('should calculate stability metrics', async () => {
    const identicalInputs = Array(5).fill(null).map(() => createMockSystemInfo());
    const analysis = await analyzeHashVariations(identicalInputs);

    expect(analysis.variationRate).toBe(0); // All identical
    expect(analysis.stabilityMetrics.consistency).toBe(1); // Perfect consistency
    expect(analysis.stabilityMetrics.predictability).toBe(1); // Perfect predictability
  });
});

describe('HashTroubleshooter', () => {
  it('should diagnose hash differences', async () => {
    const troubleshooter = getHashTroubleshooter();
    
    const info1 = createMockSystemInfo({ userAgent: 'Chrome' });
    const info2 = createMockSystemInfo({ userAgent: 'Firefox' });

    const diagnosis = await troubleshooter.diagnoseHashDifference(info1, info2);

    expect(diagnosis.summary).toBeDefined();
    expect(diagnosis.rootCauses.length).toBeGreaterThan(0);
    expect(diagnosis.fixRecommendations.length).toBeGreaterThan(0);
    expect(diagnosis.testCases.length).toBeGreaterThan(0);
  });

  it('should identify instability factors', async () => {
    const troubleshooter = getHashTroubleshooter();
    
    const inputs = [
      createMockSystemInfo({ userAgent: 'Chrome v1', audio: 124.1 }),
      createMockSystemInfo({ userAgent: 'Chrome v2', audio: 124.2 }),
      createMockSystemInfo({ userAgent: 'Firefox v1', audio: 124.3 })
    ];

    const report = await troubleshooter.identifyInstabilityFactors(inputs);

    expect(report.totalInputs).toBe(3);
    expect(report.topInstabilityFactors.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('should generate stability test suites', () => {
    const troubleshooter = getHashTroubleshooter();
    const baselineInput = createMockSystemInfo();
    
    const variationPatterns = [
      {
        name: 'User Agent Variations',
        description: 'Test different user agent strings',
        variations: [
          {
            name: 'Chrome to Firefox',
            description: 'Change browser type',
            shouldBeStable: false,
            modifications: [
              { property: 'userAgent', newValue: 'Mozilla/5.0 Firefox', reason: 'browser_change' }
            ]
          },
          {
            name: 'Minor version change',
            description: 'Change minor version number',
            shouldBeStable: true,
            modifications: [
              { property: 'userAgent', newValue: 'Mozilla/5.0 Chrome/91.0.4472.124', reason: 'version_update' }
            ]
          }
        ]
      }
    ];

    const testSuite = troubleshooter.generateStabilityTestSuite(baselineInput, variationPatterns);

    expect(testSuite.testCases).toHaveLength(1);
    expect(testSuite.testCases[0].variations).toHaveLength(2);
    expect(testSuite.metadata.totalVariations).toBe(2);
  });
});

describe('Convenience functions', () => {
  it('should provide convenient comparison function', async () => {
    const info1 = createMockSystemInfo({ userAgent: 'Chrome' });
    const info2 = createMockSystemInfo({ userAgent: 'Firefox' });

    const result = await compareSystemInfo(info1, info2);

    expect(result.differences.length).toBeGreaterThan(0);
    expect(result.comparisonMetadata).toBeDefined();
  });
});