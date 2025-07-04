/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import { SystemInfo} from './types.js';
import { detectIncognito } from './incognito.js';
import { getMockSystemInfo } from './mock.js';
import { detectAdBlockers } from './adblocker.js';
import {getWebGLInfo , getColorGamut ,getPluginsInfo , getVendorFlavors ,getCanvasFingerprint ,getAudioFingerprint ,getFontPreferences ,getMathFingerprint ,isLocalStorageEnabled ,isSessionStorageEnabled ,isIndexedDBEnabled , getTouchSupportInfo , getOSInfo, estimateCores} from './helper.js';
/**
 * Determines if the current user is likely operating as a bot by evaluating multiple environmental signals.
 *
 * If executed outside of a browser environment, it returns a default bot detection result with a confidence score of 0.8.
 * The function inspects the user agent for known bot patterns and checks for indicators such as the webdriver flag,
 * missing storage APIs, few browser plugins, small screen dimensions, and unusual hardware concurrency.
 *
 * It computes a weighted confidence score by aggregating strong, medium, and weak signals, capping the final score at 0.9.
 * A score exceeding 0.7 indicates bot-like behavior.
 *
 * @returns An object containing:
 *  - isBot: A boolean value that is true if bot-like behavior is detected.
 *  - signals: An array of strings describing the detected signals with their associated strength.
 *  - confidence: The computed confidence score reflecting the likelihood of bot detection.
 */
export function detectBot(): { isBot: boolean; signals: string[]; confidence: number } {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return { isBot: true, signals: ['non-browser-environment'], confidence: 0.8 };
    }

    const signals: string[] = [];
    const confidenceWeights = {
        strong: 0.3,
        medium: 0.15,
        weak: 0.05
    };

    // Strong signals (high confidence)
    const strongPatterns = ['bot', 'crawler', 'selenium', 'webdriver', 'headless', 'puppeteer', 'playwright'];
    for (const pattern of strongPatterns) {
        if (navigator.userAgent.toLowerCase().includes(pattern)) {
            signals.push(`strong:ua-${pattern}`);
        }
    }

    if (navigator.webdriver) {
        signals.push('strong:webdriver-flag');
    }

    // Medium signals
    if (!window.localStorage || !window.sessionStorage) {
        signals.push('medium:missing-storage');
    }

    if (!navigator.plugins || navigator.plugins.length < 2) {
        signals.push('medium:few-plugins');
    }

    // Weak signals
    if (window.screen?.width <= 300 || window.screen?.height <= 300) {
        signals.push('weak:small-screen');
    }

    if (navigator.hardwareConcurrency < 2 || navigator.hardwareConcurrency > 32) {
        signals.push('weak:unusual-concurrency');
    }

    // Calculate confidence score
    let confidence = 0.5;
    confidence += signals.filter(s => s.startsWith('strong:')).length * confidenceWeights.strong;
    confidence += signals.filter(s => s.startsWith('medium:')).length * confidenceWeights.medium;
    confidence += signals.filter(s => s.startsWith('weak:')).length * confidenceWeights.weak;

    return {
        isBot: confidence > 0.7,
        signals,
        confidence: Math.min(0.9, confidence)
    };
}

/**
 * Calculates an adjusted confidence score based on privacy mode and bot detection results.
 *
 * Starting from a base score of 0.7, the function subtracts a fixed amount if the browser is in incognito mode, and further adjusts the score using the bot detection data. If bot-like behavior is detected, it deducts points scaled by the provided bot confidence value; otherwise, it adds a small bonus based on low bot confidence. It also performs consistency checks for Chrome and Firefox by verifying expected browser features, applying additional deductions for mismatches. The final score is clamped between 0.1 and 0.9.
 *
 * @param hasIncognito - Indicates whether the browser is in incognito (private) mode.
 * @param botInfo - An object containing bot detection details:
 *   - isBot: Whether bot-like behavior is detected.
 *   - signals: An array of signals used in the detection process.
 *   - confidence: The base confidence level from bot detection.
 * @returns The adjusted confidence score, restricted between 0.1 and 0.9.
 */
function calculateConfidenceScore(hasIncognito: boolean, botInfo: { isBot: boolean; signals: string[]; confidence: number }): number {
    let score = 0.7;

    // Adjust for privacy modes
    if (hasIncognito) {
        score -= 0.1;
    }

    // Adjust based on bot detection
    if (botInfo.isBot) {
        score -= botInfo.confidence * 0.3;
    } else {
        score += (1 - botInfo.confidence) * 0.1;
    }

    // Check for basic browser consistency
    if (typeof navigator !== 'undefined') {
	    const win = window as any;
        if (navigator.userAgent.includes('Chrome') && !win.chrome ) {
            score -= 0.1;
        }
        if (navigator.userAgent.includes('Firefox') && !win.InstallTrigger) {
            score -= 0.1;
        }
    }

    return Math.max(0.1, Math.min(0.9, score));
}
/**
 * Asynchronously collects detailed system information from the browser, including OS, browser, device, privacy settings, and bot detection results.
 *
 * Gathers a comprehensive set of attributes such as user agent, hardware capabilities, display properties, privacy modes, browser features, and environmental fingerprints. Performs bot detection and computes an overall confidence score. Returns mock data if not executed in a browser environment.
 *
 * @returns A promise that resolves to a SystemInfo object containing all collected system and browser details.
 */
export async function getSystemInfo(): Promise<SystemInfo> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        console.log('Not in browser environment, returning mock data');
        return getMockSystemInfo();
    }

    // Get bot detection results
    const botInfo = detectBot();

    // Check for incognito mode
    const incognitoMode = await detectIncognito(); 
    
    // Calculate confidence score - now including bot info
    const confidenceScore = calculateConfidenceScore(incognitoMode.isPrivate, botInfo);

    const browserInfo = {
	    
        // Privacy modes
        incognito: incognitoMode,
	adBlocker: await detectAdBlockers(),
 
        // Basic info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: Array.from(navigator.languages),
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
	        
        // Screen & Display
        screenResolution: [window.screen.width, window.screen.height] as [number, number],
        colorDepth: window.screen.colorDepth,
        colorGamut: getColorGamut(),
	touchSupport: getTouchSupportInfo(),
        
        // Hardware
        hardwareConcurrency: await estimateCores(),
        deviceMemory: (navigator as any).deviceMemory,
	os: getOSInfo(),
        
        // Audio capabilities
        audio: await getAudioFingerprint(),
        
        // Browser features
        localStorage: isLocalStorageEnabled(),
        sessionStorage: isSessionStorageEnabled(),
        indexedDB: isIndexedDBEnabled(),
        
        // Graphics & Canvas
        webGL: await getWebGLInfo(), // getWebGLInfo is now async
        canvas: getCanvasFingerprint(),
        
        // Plugins & MIME
        plugins: getPluginsInfo(),
        
        // System
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Vendor info
        vendor: navigator.vendor,
        vendorFlavors: getVendorFlavors(),
        
        // Additional features
        mathConstants: getMathFingerprint(),
        fontPreferences: getFontPreferences(),
        
        // Bot detection
        bot: {
            isBot: botInfo.isBot,
            signals: botInfo.signals,
            confidence: botInfo.confidence
        },
        
        // Overall confidence score for the collected data
        confidenceScore: confidenceScore
    };

    return browserInfo;
}

