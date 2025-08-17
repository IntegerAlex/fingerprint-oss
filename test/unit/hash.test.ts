import { describe, it, expect } from 'vitest';
import { generateId, generateIdWithDebug, compareInputs, HashGeneratorConfig, HashDebugInfo, InputComparisonResult } from '@/src/hash';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontPreferencesInfo, PluginInfo, MimeType } from '@/src/types';

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const baselineSystemInfo: SystemInfo = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    platform: "Win32",
    screenResolution: [1920, 1080],
    colorDepth: 24,
    colorGamut: "srgb",
    os: { os: "Windows", version: "10" },
    webGL: {
        vendor: "Google Inc. (NVIDIA)", // Kept for type completeness, not directly in hash
        renderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)", // Kept for type completeness
        imageHash: "mock_webgl_image_hash_v1"
    } as WebGLInfo,
    // hardwareConcurrency and deviceMemory removed
    canvas: {
        winding: true, // Not directly in hash, but part of CanvasInfo type
        geometry: "canvas-geometry-fingerprint", // This is used
        text: "canvas-text-fingerprint" // Not directly in hash
    } as CanvasInfo,
    audio: 123.456789,
    fontPreferences: { // Updated structure
        detectedFonts: ["Arial", "Calibri", "Courier New"].sort() // Ensure sorted
    } as FontPreferencesInfo,
    mathConstants: {
        acos: 1.2345,
        acosh: 2.3456,
        asinh: 3.4567,
        atanh: 4.5678,
        expm1: 5.6789,
        sinh: 6.7890,
        cosh: 7.8901,
        tanh: 8.9012,
    } as MathInfo,
    plugins: [
        { name: "Chrome PDF Viewer", description: "Portable Document Format", mimeTypes: [{ type: "application/pdf", suffixes: "pdf" } as MimeType] },
        { name: "Google Hangouts", description: "Google Talk Plugin", mimeTypes: [] }
    ] as PluginInfo[],

    // These are not part of stableInfo, so changes to them should not affect the hash
    languages: ["en-US", "en"],
    timezone: "America/New_York",

    // Other properties to make SystemInfo complete as per its type definition
    incognito: { isPrivate: false, browserName: "Chrome" },
    bot: { isBot: false, signals: [], confidence: 0 },
    cookiesEnabled: true,
    doNotTrack: "1",
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
    touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
    vendor: "Google Inc.", // Not directly in hash
    vendorFlavors: ["Google Chrome"], // Not directly in hash
    confidenceScore: 100,
    deviceMemory: undefined, // Explicitly set as undefined as it's optional in SystemInfo
    hardwareConcurrency: navigator.hardwareConcurrency || 0, // Keep for type, not in hash
};

describe('generateId', () => {
    it('should generate a deterministic hash for identical inputs', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const identicalSystemInfo = deepClone(baselineSystemInfo);
        const hash2 = await generateId(identicalSystemInfo);
        expect(hash1).toBe(hash2);
    });

    it('should produce the same hash when irrelevant properties (timezone, languages) change', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.timezone = "Europe/London";
        modifiedInfo.languages = ["en-GB", "en"];
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).toBe(hash2);
    });

    // New tests for webGLImageHash
    it('should produce a different hash when webGL.imageHash changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.webGL.imageHash = "new_mock_webgl_image_hash";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should use placeholder and produce consistent hash if webGL.imageHash is null', async () => {
        const infoWithNullHash = deepClone(baselineSystemInfo);
        infoWithNullHash.webGL.imageHash = null;
        const hash1 = await generateId(infoWithNullHash);

        const infoWithNullHash2 = deepClone(baselineSystemInfo);
        infoWithNullHash2.webGL.imageHash = null;
        const hash2 = await generateId(infoWithNullHash2);
        expect(hash1).toBe(hash2);

        // Also check it's different from baseline
        const baselineHash = await generateId(baselineSystemInfo);
        expect(hash1).not.toBe(baselineHash);
    });

    it('should use placeholder and produce consistent hash if webGL itself is missing (for imageHash)', async () => {
        const infoWithoutWebGL = deepClone(baselineSystemInfo);
        // @ts-ignore: Testing robustness against missing webGL property
        delete infoWithoutWebGL.webGL;
        const hash1 = await generateId(infoWithoutWebGL as SystemInfo);

        const infoWithoutWebGL2 = deepClone(baselineSystemInfo);
        // @ts-ignore: Testing robustness
        delete infoWithoutWebGL2.webGL;
        const hash2 = await generateId(infoWithoutWebGL2 as SystemInfo);
        expect(hash1).toBe(hash2);

        const baselineHash = await generateId(baselineSystemInfo);
        expect(hash1).not.toBe(baselineHash); // Expect 'webgl_hash_unavailable' placeholder
    });


    // New tests for detectedFontsString
    it('should produce a different hash when fontPreferences.detectedFonts content changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.fontPreferences.detectedFonts = ["Arial", "Calibri", "Verdana"].sort();
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should use placeholder and produce consistent hash if fontPreferences.detectedFonts is empty', async () => {
        const infoWithEmptyFonts = deepClone(baselineSystemInfo);
        infoWithEmptyFonts.fontPreferences.detectedFonts = [];
        const hash1 = await generateId(infoWithEmptyFonts);

        const infoWithEmptyFonts2 = deepClone(baselineSystemInfo);
        infoWithEmptyFonts2.fontPreferences.detectedFonts = [];
        const hash2 = await generateId(infoWithEmptyFonts2);
        expect(hash1).toBe(hash2);

        // Also check it's different from baseline
        const baselineHash = await generateId(baselineSystemInfo);
        expect(hash1).not.toBe(baselineHash); // Expect 'no_fonts_detected'
    });

    it('should use placeholder and produce consistent hash if fontPreferences itself is missing', async () => {
        const infoWithoutFontPrefs = deepClone(baselineSystemInfo);
        // @ts-ignore: Testing robustness
        delete infoWithoutFontPrefs.fontPreferences;
        const hash1 = await generateId(infoWithoutFontPrefs as SystemInfo);

        const infoWithoutFontPrefs2 = deepClone(baselineSystemInfo);
        // @ts-ignore: Testing robustness
        delete infoWithoutFontPrefs2.fontPreferences;
        const hash2 = await generateId(infoWithoutFontPrefs2 as SystemInfo);
        expect(hash1).toBe(hash2);

        const baselineHash = await generateId(baselineSystemInfo);
        expect(hash1).not.toBe(baselineHash); // Expect 'no_fonts_detected'
    });

    it('should produce the same hash regardless of fontPreferences.detectedFonts order (as it should be pre-sorted)', async () => {
        // generateId relies on getFontPreferences to sort, or sorts itself.
        // The mock data in baselineSystemInfo already has sorted fonts.
        // This test assumes the sorting happens prior to generateId or by it.
        const hash1 = await generateId(baselineSystemInfo); // Uses ["Arial", "Calibri", "Courier New"]

        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.fontPreferences.detectedFonts = ["Courier New", "Arial", "Calibri"]; // Unsorted
        // If generateId expects pre-sorted, or if the source (getFontPreferences) sorts, this should still yield same hash
        // as the join(',') would be on a sorted list. Our current generateId joins what it gets.
        // The getFontPreferences function *does* sort. So this test is valid.
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).toBe(hash2);
    });

    // Adapted/Reviewed existing tests
    it('should produce a different hash when userAgent changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.userAgent = "New User Agent String";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when canvas.geometry (canvasFingerprint) changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.canvas.geometry = "new-canvas-geometry-fingerprint";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when audio (audioFingerprint) changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.audio = 987.654321;
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should use placeholder if audio is null', async () => {
        const infoWithNullAudio = deepClone(baselineSystemInfo);
        infoWithNullAudio.audio = null;
        const hash1 = await generateId(infoWithNullAudio);

        const infoWithNullAudio2 = deepClone(baselineSystemInfo);
        infoWithNullAudio2.audio = null;
        const hash2 = await generateId(infoWithNullAudio2);
        expect(hash1).toBe(hash2);

        const baselineHash = await generateId(baselineSystemInfo);
        expect(hash1).not.toBe(baselineHash);
    });


    it('should correctly filter Brave plugins and be sensitive to other plugin changes', async () => {
        const basePlugins = [
            { name: "Chrome PDF Viewer", description: "Desc1", mimeTypes: [{ type: "app/pdf", suffixes: "pdf" } as MimeType] }
        ] as PluginInfo[];

        const infoWithNonBravePlugin = deepClone(baselineSystemInfo);
        infoWithNonBravePlugin.plugins = basePlugins;
        const hashBaseline = await generateId(infoWithNonBravePlugin);

        const infoWithBravePlugin = deepClone(infoWithNonBravePlugin);
        infoWithBravePlugin.plugins = [
            ...basePlugins,
            { name: "Brave Shields", description: "Brave stuff", mimeTypes: [] } as PluginInfo
        ];
        const hashBrave = await generateId(infoWithBravePlugin);
        expect(hashBrave).toBe(hashBaseline); // Brave plugin filtered out

        const infoWithAnotherNonBravePlugin = deepClone(infoWithNonBravePlugin);
        infoWithAnotherNonBravePlugin.plugins = [
            ...basePlugins,
            { name: "VLC Web Plugin", description: "VLC", mimeTypes: [{ type: "app/vlc", suffixes: "vlc" } as MimeType] } as PluginInfo
        ];
        const hashOtherPlugin = await generateId(infoWithAnotherNonBravePlugin);
        expect(hashOtherPlugin).not.toBe(hashBaseline);
    });

    it('should be insensitive to minor changes in math constants (value change within toFixed(3) rounding)', async () => {
        const hash1 = await generateId(baselineSystemInfo); // acos: 1.2345 -> "1.235"

        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.mathConstants.acos = 1.2345000001; // also -> "1.235" via reliableRound

        const hash2 = await generateId(modifiedInfo);
        expect(hash1).toBe(hash2);
    });

    it('should be sensitive to changes in math constants (value change beyond toFixed(3) rounding)', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.mathConstants.acos = 1.238; // -> "1.238"
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    // Tests for other stableInfo properties
    it('should produce a different hash when platform changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.platform = "MacIntel";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when screenResolution changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.screenResolution = [1024, 768];
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when colorDepth changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.colorDepth = 16;
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when colorGamut changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.colorGamut = "p3";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when os changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.os = { os: "Linux", version: "Ubuntu" };
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });
});
describe('generateIdWithDebug', () => {
    it('should return hash and debug info when debugMode is enabled', async () => {
        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(baselineSystemInfo, config);

        expect(result.hash).toBeDefined();
        expect(typeof result.hash).toBe('string');
        expect(result.hash.length).toBe(64); // SHA-256 hex length

        expect(result.debugInfo).toBeDefined();
        expect(result.debugInfo!.originalInput).toEqual(baselineSystemInfo);
        expect(result.debugInfo!.normalizedInput).toBeDefined();
        expect(result.debugInfo!.appliedFallbacks).toBeDefined();
        expect(result.debugInfo!.validationErrors).toBeDefined();
        expect(result.debugInfo!.hashInput).toBeDefined();
        expect(result.debugInfo!.processingTime).toBeGreaterThan(0);
    });

    it('should not return debug info when debugMode is disabled', async () => {
        const config: HashGeneratorConfig = { debugMode: false };
        const result = await generateIdWithDebug(baselineSystemInfo, config);

        expect(result.hash).toBeDefined();
        expect(result.debugInfo).toBeUndefined();
    });

    it('should track applied fallbacks in debug info', async () => {
        const incompleteInfo = deepClone(baselineSystemInfo);
        incompleteInfo.audio = null;
        // @ts-ignore: Testing fallback behavior
        delete incompleteInfo.webGL;

        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(incompleteInfo, config);

        expect(result.debugInfo!.appliedFallbacks).toBeDefined();
        expect(Object.keys(result.debugInfo!.appliedFallbacks).length).toBeGreaterThan(0);

        // Check that fallbacks were applied for missing properties
        const fallbackKeys = Object.keys(result.debugInfo!.appliedFallbacks);
        expect(fallbackKeys).toContain('audio');
        expect(fallbackKeys).toContain('webGL');
    });

    it('should track validation errors in debug info', async () => {
        const invalidInfo = deepClone(baselineSystemInfo);
        // Create some invalid data
        invalidInfo.screenResolution = [-1, -1] as [number, number];

        const config: HashGeneratorConfig = { debugMode: true, enableValidation: true };
        const result = await generateIdWithDebug(invalidInfo, config);

        expect(result.debugInfo!.validationErrors).toBeDefined();
        expect(Array.isArray(result.debugInfo!.validationErrors)).toBe(true);
    });

    it('should provide normalized input in debug info', async () => {
        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(baselineSystemInfo, config);

        expect(result.debugInfo!.normalizedInput).toBeDefined();
        expect(typeof result.debugInfo!.normalizedInput).toBe('object');

        // Check that normalization occurred
        expect(result.debugInfo!.normalizedInput).not.toEqual(baselineSystemInfo);
    });

    it('should provide hash input string in debug info', async () => {
        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(baselineSystemInfo, config);

        expect(result.debugInfo!.hashInput).toBeDefined();
        expect(typeof result.debugInfo!.hashInput).toBe('string');
        expect(result.debugInfo!.hashInput.length).toBeGreaterThan(0);

        // Should be valid JSON
        expect(() => JSON.parse(result.debugInfo!.hashInput)).not.toThrow();
    });

    it('should measure processing time accurately', async () => {
        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(baselineSystemInfo, config);

        expect(result.debugInfo!.processingTime).toBeGreaterThan(0);
        expect(result.debugInfo!.processingTime).toBeLessThan(1000); // Should be less than 1 second
    });
});

describe('compareInputs', () => {
    it('should identify identical inputs correctly', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);

        const comparison = await compareInputs(info1, info2);

        expect(comparison.identical).toBe(true);
        expect(comparison.differences).toHaveLength(0);
        expect(comparison.hashInput1).toBe(comparison.hashInput2);
    });

    it('should identify differences in hash-affecting properties', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);
        info2.userAgent = "Different User Agent";

        const comparison = await compareInputs(info1, info2);

        expect(comparison.identical).toBe(false);
        expect(comparison.differences.length).toBeGreaterThan(0);

        const userAgentDiff = comparison.differences.find(d => d.property === 'userAgent');
        expect(userAgentDiff).toBeDefined();
        expect(userAgentDiff!.affectsHash).toBe(true);
        expect(userAgentDiff!.value1).toBe(info1.userAgent);
        expect(userAgentDiff!.value2).toBe(info2.userAgent);
    });

    it('should identify differences in non-hash-affecting properties', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);
        info2.timezone = "Europe/London"; // This should not affect hash

        const comparison = await compareInputs(info1, info2);

        expect(comparison.identical).toBe(true); // Hash should be identical
        expect(comparison.differences.length).toBeGreaterThan(0);

        const timezoneDiff = comparison.differences.find(d => d.property === 'timezone');
        expect(timezoneDiff).toBeDefined();
        expect(timezoneDiff!.affectsHash).toBe(false);
        expect(timezoneDiff!.value1).toBe(info1.timezone);
        expect(timezoneDiff!.value2).toBe(info2.timezone);
    });

    it('should handle nested property differences', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);
        info2.webGL.imageHash = "different_hash";

        const comparison = await compareInputs(info1, info2);

        expect(comparison.identical).toBe(false);
        expect(comparison.differences.length).toBeGreaterThan(0);

        const webGLDiff = comparison.differences.find(d => d.property.includes('webGL'));
        expect(webGLDiff).toBeDefined();
        expect(webGLDiff!.affectsHash).toBe(true);
    });

    it('should handle array differences correctly', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);
        info2.fontPreferences.detectedFonts = ["Arial", "Helvetica", "Times"];

        const comparison = await compareInputs(info1, info2);

        expect(comparison.identical).toBe(false);
        expect(comparison.differences.length).toBeGreaterThan(0);

        const fontDiff = comparison.differences.find(d => d.property.includes('detectedFonts'));
        expect(fontDiff).toBeDefined();
        expect(fontDiff!.affectsHash).toBe(true);
    });

    it('should show normalization effects in comparison', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);

        // Create a difference that gets normalized away
        info1.mathConstants.acos = 1.2345;
        info2.mathConstants.acos = 1.2345000001; // Should normalize to same value

        const comparison = await compareInputs(info1, info2);

        expect(comparison.identical).toBe(true); // Should be identical after normalization

        const acosDiff = comparison.differences.find(d => d.property.includes('acos'));
        if (acosDiff) {
            expect(acosDiff.affectsHash).toBe(false);
            expect(acosDiff.normalizedValue1).toBe(acosDiff.normalizedValue2);
        }
    });

    it('should provide normalized inputs for analysis', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);
        info2.userAgent = "Different User Agent";

        const comparison = await compareInputs(info1, info2);

        expect(comparison.normalizedInput1).toBeDefined();
        expect(comparison.normalizedInput2).toBeDefined();
        expect(typeof comparison.normalizedInput1).toBe('object');
        expect(typeof comparison.normalizedInput2).toBe('object');

        // Normalized inputs should be different from original inputs
        expect(comparison.normalizedInput1).not.toEqual(info1);
        expect(comparison.normalizedInput2).not.toEqual(info2);
    });

    it('should provide hash input strings for detailed analysis', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);
        info2.userAgent = "Different User Agent";

        const comparison = await compareInputs(info1, info2);

        expect(comparison.hashInput1).toBeDefined();
        expect(comparison.hashInput2).toBeDefined();
        expect(typeof comparison.hashInput1).toBe('string');
        expect(typeof comparison.hashInput2).toBe('string');
        expect(comparison.hashInput1).not.toBe(comparison.hashInput2);

        // Both should be valid JSON
        expect(() => JSON.parse(comparison.hashInput1)).not.toThrow();
        expect(() => JSON.parse(comparison.hashInput2)).not.toThrow();
    });

    it('should handle missing properties gracefully', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);

        // @ts-ignore: Testing missing property handling
        delete info2.audio;

        const comparison = await compareInputs(info1, info2);

        expect(comparison.identical).toBe(false);
        expect(comparison.differences.length).toBeGreaterThan(0);

        const audioDiff = comparison.differences.find(d => d.property === 'audio');
        expect(audioDiff).toBeDefined();
        expect(audioDiff!.value1).toBe(info1.audio);
        expect(audioDiff!.value2).toBeUndefined();
    });

    it('should work with custom configuration', async () => {
        const info1 = deepClone(baselineSystemInfo);
        const info2 = deepClone(baselineSystemInfo);
        info2.userAgent = "Different User Agent";

        const config: HashGeneratorConfig = {
            debugMode: true,
            strictMode: true,
            enableValidation: true
        };

        const comparison = await compareInputs(info1, info2, config);

        expect(comparison.identical).toBe(false);
        expect(comparison.differences.length).toBeGreaterThan(0);
    });
});

describe('Debug Information Accuracy', () => {
    it('should provide accurate fallback information', async () => {
        const incompleteInfo = deepClone(baselineSystemInfo);
        incompleteInfo.audio = null;
        incompleteInfo.fontPreferences.detectedFonts = [];

        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(incompleteInfo, config);

        const fallbacks = result.debugInfo!.appliedFallbacks;

        expect(fallbacks.audio).toBeDefined();
        expect(fallbacks.audio.reason).toBeDefined();
        expect(fallbacks.audio.originalValue).toBe(null);
        expect(fallbacks.audio.fallbackValue).toBeDefined();

        expect(fallbacks.fontPreferences).toBeDefined();
        expect(fallbacks.fontPreferences.reason).toBeDefined();
        expect(fallbacks.fontPreferences.originalValue).toEqual([]);
        expect(fallbacks.fontPreferences.fallbackValue).toBeDefined();
    });

    it('should track all normalization steps accurately', async () => {
        const testInfo = deepClone(baselineSystemInfo);
        testInfo.mathConstants.acos = 1.23456789; // Will be normalized
        testInfo.userAgent = "  Spaced User Agent  "; // Will be trimmed

        const config: HashGeneratorConfig = { debugMode: true };
        const result = await generateIdWithDebug(testInfo, config);

        expect(result.debugInfo!.normalizedInput).toBeDefined();

        // Check that normalization occurred
        const normalizedMath = result.debugInfo!.normalizedInput.mathConstants;
        expect(normalizedMath.acos).toBe("1.235"); // Should be normalized to 3 decimal places
    });

    it('should provide complete debug information for complex scenarios', async () => {
        const complexInfo = deepClone(baselineSystemInfo);
        complexInfo.audio = null; // Will trigger fallback
        complexInfo.mathConstants.acos = 1.23456789; // Will be normalized
        complexInfo.fontPreferences.detectedFonts = []; // Will trigger fallback
        // @ts-ignore: Testing missing property
        delete complexInfo.webGL; // Will trigger fallback

        const config: HashGeneratorConfig = { debugMode: true, enableValidation: true };
        const result = await generateIdWithDebug(complexInfo, config);

        const debug = result.debugInfo!;

        // Should have original input
        expect(debug.originalInput).toEqual(complexInfo);

        // Should have normalized input
        expect(debug.normalizedInput).toBeDefined();
        expect(debug.normalizedInput).not.toEqual(complexInfo);

        // Should have fallback information
        expect(Object.keys(debug.appliedFallbacks).length).toBeGreaterThan(0);
        expect(debug.appliedFallbacks.audio).toBeDefined();
        expect(debug.appliedFallbacks.fontPreferences).toBeDefined();
        expect(debug.appliedFallbacks.webGL).toBeDefined();

        // Should have validation errors (if any)
        expect(debug.validationErrors).toBeDefined();
        expect(Array.isArray(debug.validationErrors)).toBe(true);

        // Should have hash input
        expect(debug.hashInput).toBeDefined();
        expect(typeof debug.hashInput).toBe('string');

        // Should have processing time
        expect(debug.processingTime).toBeGreaterThan(0);
    });
});