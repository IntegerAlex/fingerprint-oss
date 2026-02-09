/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import { getMathFingerprint } from './helper';

/**
 * Returns a mock system information object simulating browser, device, and environment attributes for testing.
 *
 * The returned object includes representative values for browser details, device properties, operating system, feature support, graphics capabilities, font preferences, incognito status, bot detection metrics, and a mathematical constants fingerprint.
 *
 * @returns A mock object containing system information fields suitable for use in tests.
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
	os : {  os:'test', version:'T' },
        audio: null,
        localStorage: true,
        sessionStorage: true,
        indexedDB: true,
        webGL: { vendor: 'Test Vendor', renderer: 'Test Renderer', imageHash: null },
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
        fontPreferences: { detectedFonts: [] },
        incognito: { isPrivate: false, browserName: 'Test Browser' },
        browser: { name: 'Test Browser', version: '1.0' },
        bot: botInfo,
        deviceType: {
            type: 'desktop' as const,
            confidence: 0.85,
            signals: [
                { name: 'mock', value: true, weight: 1, detected: true }
            ],
            method: 'mock'
        },
        confidenceScore: 0.85,
        // Hash will be generated dynamically by generateId function
        hash: '5d41402abc4b2a76b9719d911017c592'
    };
}

