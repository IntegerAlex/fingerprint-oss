import { describe, it, expect } from 'vitest';
import { generateId } from '../src/hash';
import { SystemInfo, WebGLInfo, CanvasInfo, MathInfo, FontInfo, PluginInfo, MimeType } from '../src/types';

// Utility for deep cloning to ensure test independence
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const baselineSystemInfo: SystemInfo = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    platform: "Win32",
    screenResolution: [1920, 1080],
    colorDepth: 24,
    colorGamut: "srgb",
    os: { os: "Windows", version: "10" }, // Corrected to match SystemInfo.os type
    webGL: { 
        vendor: "Google Inc. (NVIDIA)", 
        renderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)" 
    } as WebGLInfo,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    canvas: { // Assuming CanvasInfo structure based on type
        winding: true,
        geometry: "canvas-geometry-fingerprint",
        text: "canvas-text-fingerprint"
    } as CanvasInfo,
    audio: 123.456789, // generateId normalizes this to 3 decimal places
    fontPreferences: {
        fonts: [{ name: "Arial", width: 100.234 }, { name: "Times New Roman", width: 110.789 }], // widths will be rounded
    } as FontInfo,
    mathConstants: { // Values will be rounded to 3 decimal places
        acos: 1.2345, // This is the key value for the failing test
        acosh: 2.3456,
        asinh: 3.4567,
        atanh: 4.5678,
        expm1: 5.6789,
        sinh: 6.7890,
        cosh: 7.8901,
        tanh: 8.9012,
    } as MathInfo,
    plugins: [
        { name: "Chrome PDF Viewer", description: "Portable Document Format", mimeTypes: [{type: "application/pdf", suffixes: "pdf"} as MimeType] },
        { name: "Google Hangouts", description: "Google Talk Plugin", mimeTypes: [] }
    ] as PluginInfo[],
    
    languages: ["en-US", "en"],
    timezone: "America/New_York",
    incognito: { isPrivate: false, browserName: "Chrome" },
    bot: { isBot: false, signals: [], confidence: 0 },
    cookiesEnabled: true,
    doNotTrack: "1",
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
    touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
    vendor: "Google Inc.",
    vendorFlavors: ["Google Chrome"],
    confidenceScore: 100, 
};

describe('generateId', () => {
    it('should generate a deterministic hash for identical inputs', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const identicalSystemInfo = deepClone(baselineSystemInfo);
        const hash2 = await generateId(identicalSystemInfo);
        expect(hash1).toBe(hash2);
    });

    it('should produce the same hash when irrelevant properties like timezone or languages change', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.timezone = "Europe/London";
        modifiedInfo.languages = ["en-GB", "en"];
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).toBe(hash2);
    });

    it('should produce a different hash when webGL.renderer changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.webGL.renderer = "ANGLE (Intel, Intel Iris Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when hardwareConcurrency changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.hardwareConcurrency = 12;
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });
    
    it('should produce a different hash when deviceMemory changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.deviceMemory = 16;
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when userAgent changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });
    
    it('should produce a different hash when canvas fingerprint (geometry) changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.canvas.geometry = "new-canvas-geometry-fingerprint";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when audio fingerprint changes', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.audio = 987.654321;
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should correctly filter Brave plugins and be sensitive to other plugin changes', async () => {
        const basePlugins = [
            { name: "Chrome PDF Viewer", description: "Portable Document Format", mimeTypes: [{type: "application/pdf", suffixes: "pdf"} as MimeType] }
        ] as PluginInfo[];

        const infoWithNonBravePlugin = deepClone(baselineSystemInfo);
        infoWithNonBravePlugin.plugins = basePlugins;
        const hashBaseline = await generateId(infoWithNonBravePlugin);

        const infoWithBravePlugin = deepClone(infoWithNonBravePlugin);
        infoWithBravePlugin.plugins = [
            ...basePlugins,
            { name: "Brave Shields", description: "Brave browser feature", mimeTypes: [] } as PluginInfo
        ];
        const hashBrave = await generateId(infoWithBravePlugin);
        expect(hashBrave).toBe(hashBaseline);
        
        const infoWithAnotherNonBravePlugin = deepClone(infoWithNonBravePlugin);
        infoWithAnotherNonBravePlugin.plugins = [
            ...basePlugins,
            { name: "VLC Web Plugin", description: "VLC media player plugin", mimeTypes: [{type: "application/vlc", suffixes: "vlc"} as MimeType] } as PluginInfo
        ];
        const hashOtherPlugin = await generateId(infoWithAnotherNonBravePlugin);
        expect(hashOtherPlugin).not.toBe(hashBaseline);

        const infoWithModifiedNonBravePlugin = deepClone(infoWithNonBravePlugin);
        infoWithModifiedNonBravePlugin.plugins = [
            { name: "Chrome PDF Viewer MODIFIED", description: "Portable Document Format", mimeTypes: [{type: "application/pdf", suffixes: "pdf"} as MimeType] }
        ] as PluginInfo[];
        const hashModifiedPlugin = await generateId(infoWithModifiedNonBravePlugin);
        expect(hashModifiedPlugin).not.toBe(hashBaseline);
    });
    
    it('should be sensitive to changes in font preferences (font name)', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.fontPreferences.fonts[0].name = "Verdana";
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });

    it('should be sensitive to changes in font preferences (font width, beyond rounding)', async () => {
        const hash1 = await generateId(baselineSystemInfo); 
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.fontPreferences.fonts[0].width = 115.0; 
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });
    
    it('should be insensitive to minor changes in font preferences (font width, within rounding)', async () => {
        const hash1 = await generateId(baselineSystemInfo); 
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.fontPreferences.fonts[0].width = 102.1; 
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).toBe(hash2); 
    });

    it('should be sensitive to changes in math constants (value change)', async () => {
        const hash1 = await generateId(baselineSystemInfo);
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.mathConstants.acos = 1.238; 
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).not.toBe(hash2);
    });
    
    it('should be insensitive to minor changes in math constants (value change within toFixed(3) rounding)', async () => {
        // This test previously failed due to inconsistent rounding of 1.2345 by toFixed(3).
        // The fix involves using a reliable rounding function before toFixed(3).
        const hash1 = await generateId(baselineSystemInfo); // acos: 1.2345
        
        const modifiedInfo = deepClone(baselineSystemInfo);
        modifiedInfo.mathConstants.acos = 1.2345000001; 
        
        const hash2 = await generateId(modifiedInfo);
        expect(hash1).toBe(hash2);
    });
});
