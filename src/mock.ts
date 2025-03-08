import { getMathFingerprint } from './helper';

/**
 * Mock data for testing
 */

export function getMockSystemInfo() {
    const botInfo = { isBot: false, signals: [], confidence: 0.82 };
    return {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        platform: 'Test Platform',
        languages: ['en-US'],
        cookiesEnabled: true,
        doNotTrack: null,
        screenResolution: [1920, 1080] as [number, number],
        colorDepth: 24,
        colorGamut: 'srgb',
        hardwareConcurrency: 8,
        deviceMemory: 8,
        audio: null,
        localStorage: true,
        sessionStorage: true,
        indexedDB: true,
        webGL: { vendor: 'Test Vendor', renderer: 'Test Renderer' },
        canvas: { winding: false, geometry: '', text: '' },
        plugins: [],
        timezone: 'America/New_York',
        touchSupport: {
            maxTouchPoints: 0,
            touchEvent: false,
            touchStart: false
        },
        vendor: 'Test Vendor',
        vendorFlavors: ['test'],
        mathConstants: getMathFingerprint(),
        fontPreferences: { fonts: [] },
        incognito: { isPrivate: false, browserName: 'Test Browser' },
        bot: botInfo,
        confidenceScore: 0.85
    };
}

