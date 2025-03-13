import { SystemInfo} from './types.js';
import { detectIncognito } from './incognito.js';
import { getMockSystemInfo } from './mock.js';
import { detectAdBlockers } from './adblocker.js';
import {getWebGLInfo , getColorGamut ,getPluginsInfo , getVendorFlavors ,getCanvasFingerprint ,getAudioFingerprint ,getFontPreferences ,getMathFingerprint ,isLocalStorageEnabled ,isSessionStorageEnabled ,isIndexedDBEnabled , getTouchSupportInfo , getOSInfo} from './helper.js';
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
 * Computes a confidence score based on incognito mode status and bot detection results, with additional adjustments for browser consistency.
 *
 * The function starts with a base score of 0.7 and subtracts points if the browser is in incognito mode or if bot detection indicates likely bot behavior. Conversely, it adds a small bonus when bot detection confidence is low. It also performs checks to ensure consistency between the user agent and expected browser features on Chrome and Firefox. The final score is clamped between 0.1 and 0.9.
 *
 * @param hasIncognito - Indicates whether the browser is in incognito (private) mode.
 * @param botInfo - An object containing bot detection details:
 *   - isBot: Whether a bot is detected.
 *   - signals: An array of detection signals.
 *   - confidence: The base confidence level from bot detection.
 * @returns The adjusted confidence score, bounded between 0.1 and 0.9.
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
 * Retrieves comprehensive system information including OS, browser, device, and bot detection details.
 *
 * This function asynchronously gathers a wide range of data from the current environment, such as user agent, platform details, hardware capabilities, display attributes, and privacy-related settings. It also performs bot detection by analyzing various signals and computes an overall confidence score based on these findings. In a non-browser environment, it returns mock system information.
 *
 * @returns A promise that resolves to a SystemInfo object with collected details.
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
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,
	os: getOSInfo(),
        
        // Audio capabilities
        audio: await getAudioFingerprint(),
        
        // Browser features
        localStorage: isLocalStorageEnabled(),
        sessionStorage: isSessionStorageEnabled(),
        indexedDB: isIndexedDBEnabled(),
        
        // Graphics & Canvas
        webGL: getWebGLInfo(),
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

