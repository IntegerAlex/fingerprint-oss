import { SystemInfo, WebGLInfo, CanvasInfo, PluginInfo, MathInfo, FontInfo } from './types.js';
import { isIncognito } from './incognito.js';
import { getMockSystemInfo } from './mock.js';
import { detectAdBlockers } from './adblocker.js';
import {getWebGLInfo , getColorGamut ,getPluginsInfo , getVendorFlavors ,getCanvasFingerprint ,getAudioFingerprint ,getFontPreferences ,getMathFingerprint ,isLocalStorageEnabled ,isSessionStorageEnabled ,isIndexedDBEnabled , getTouchSupportInfo} from './helper.js';
/**
 * Detects if the current user is likely a bot
 * @returns Object containing bot detection result and confidence score
 */
export function detectBot(): { isBot: boolean; signals: string[]; confidence: number } {
    // If not in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return { isBot: true, signals: ['non-browser-environment'], confidence: 0.7 };
    }

    const signals: string[] = [];
    
    // Check user agent for common bot patterns
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
        'bot', 'crawler', 'spider', 'headless', 'phantomjs', 'selenium', 'webdriver', 'puppeteer',
        'playwright', 'cypress', 'lighthouse', 'pagespeed', 'chromium', 'chrome-lighthouse'
    ];
    
    for (const pattern of botPatterns) {
        if (userAgent.includes(pattern)) {
            signals.push(`bot-ua-pattern:${pattern}`);
        }
    }
    
    // Check for missing or inconsistent browser features
    if (!window.localStorage || !window.sessionStorage) {
        signals.push('missing-storage-api');
    }
    
    if (!navigator.plugins || navigator.plugins.length === 0) {
        signals.push('no-plugins');
    }
    
    if (navigator.webdriver) {
        signals.push('webdriver-present');
    }
    
    // Check if user agent is too perfect/clean
    if (/Mozilla\/5\.0 \(Windows NT 10\.0; Win64; x64\) AppleWebKit\/537\.36 \(KHTML, like Gecko\) Chrome\/\d+\.0\.\d+\.\d+ Safari\/537\.36/.test(navigator.userAgent)) {
        signals.push('generic-chrome-ua');
    }
    
    // Additional checks for bot signals
    
    // Check for non-standard behavior of navigator properties
    if (navigator.userAgent === navigator.appVersion) {
        signals.push('identical-ua-appversion');
    }
    
    // Check for unusual screen dimensions
    if (window.screen && (window.screen.width === window.screen.height || 
                         window.screen.width <= 0 || window.screen.height <= 0)) {
        signals.push('unusual-screen-dimensions');
    }
    
    // Check for unusual hardware concurrency
    if (navigator.hardwareConcurrency > 32 || navigator.hardwareConcurrency === 0) {
        signals.push('unusual-hardware-concurrency');
    }
    
    // Check for errors in standard browser functions
    try {
        const testDiv = document.createElement('div');
        document.body.appendChild(testDiv);
        document.body.removeChild(testDiv);
    } catch (e) {
        signals.push('dom-manipulation-error');
    }
    
    // Calculate confidence score - more complex calculation with wider range
    // Base confidence based on multiple factors
    
    let confidence = 0.5; // Neutral starting point
    
    // If many strong signals, confidence goes very high that it's a bot
    if (signals.length > 5) {
        confidence = 0.85 + (Math.min(signals.length - 5, 5) * 0.01);
    } 
    // Some signals, moderate confidence
    else if (signals.length > 2) {
        confidence = 0.7 + (signals.length * 0.05);
    } 
    // Few signals, lower confidence
    else if (signals.length > 0) {
        confidence = 0.5 + (signals.length * 0.1);
    } 
    // No signals, very low confidence that it's a bot
    else {
        confidence = 0.3;
        
        // Additional checks to further lower confidence if likely a real user
        if (navigator.plugins && navigator.plugins.length > 2) {
            confidence -= 0.1;
        }
        
        if (window.history && window.history.length > 1) {
            confidence -= 0.1;
        }
    }
    
    return {
        isBot: signals.length > 0,
        signals,
        confidence: Math.max(0.1, Math.min(0.9, confidence)) // Cap between 0.1 and 0.9
    };
}

/**
 * Calculate the overall confidence score of the system information
 * @param hasIncognito Whether incognito mode is detected
 * @param botInfo Bot detection results
 * @returns Confidence score between 0.1 and 0.9
 */
function calculateConfidenceScore(hasIncognito: boolean, botInfo: { isBot: boolean; signals: string[]; confidence: number }): number {
    // Start with a neutral base score
    let score = 0.6;
    
    // Adjust for privacy features
    if (hasIncognito) {
        score -= 0.15; // Significant reduction for incognito mode
    }
    
    // Adjust based on bot detection with more weight
    if (botInfo.isBot) {
        // Inverse the bot confidence (higher bot confidence = lower data confidence)
        // Scale is non-linear to emphasize strong bot signals
        score -= Math.pow(botInfo.confidence, 1.5) * 0.3;
    } else {
        // If not a bot, increase confidence, but with diminishing returns
        score += (1 - botInfo.confidence) * 0.15;
    }
    
    // Check for inconsistencies that might indicate spoofing
    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent;
        
        // Inconsistent platform and user agent
        if (
            (ua.includes('Windows') && navigator.platform.includes('Mac')) ||
            (ua.includes('Mac') && navigator.platform.includes('Win')) ||
            (ua.includes('Linux') && navigator.platform.includes('Win'))
        ) {
            score -= 0.2; // Major inconsistency
        }
        
        // Check for impossible combinations
        if (
            (ua.includes('iPhone') && navigator.hardwareConcurrency > 6) ||
            (ua.includes('Android') && ua.includes('Win64')) ||
            (ua.includes('iPad') && navigator.hardwareConcurrency > 8)
        ) {
            score -= 0.25; // Impossible device characteristics
        }
        
        // Check for unusual browser features
        if (!('deviceMemory' in navigator)) {
            score -= 0.05;
        }
        
        if (!('languages' in navigator)) {
            score -= 0.07;
        }
        
        // Evaluate timezone consistency
        try {
            const timezoneOffset = new Date().getTimezoneOffset();
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            // Check for common timezone offsets and names
            // This is a simplified check - would need a mapping table for complete validation
            const hasInconsistentTimezone = (
                (timezone.includes('America') && timezoneOffset < -600) || 
                (timezone.includes('Europe') && (timezoneOffset < -60 || timezoneOffset > -540)) ||
                (timezone.includes('Asia') && timezoneOffset < 0)
            );
            
            if (hasInconsistentTimezone) {
                score -= 0.1;
            }
        } catch (e) {
            score -= 0.05; // Error in timezone check
        }
    }
    
    // Test data coherence with browser behavior
    try {
        // Check screen consistency
        if (window.screen) {
            const aspectRatio = window.screen.width / window.screen.height;
            if (aspectRatio < 0.5 || aspectRatio > 3.5) {
                // Extremely unusual aspect ratio
                score -= 0.1;
            }
        }
        
        // Evaluate storage consistency
        const storageInconsistency = (
            !window.localStorage !== !window.sessionStorage || 
            !window.localStorage !== !window.indexedDB
        );
        
        if (storageInconsistency) {
            score -= 0.07; // Browsers should support all or none
        }
    } catch (e) {
        // Errors in consistency tests
        score -= 0.08;
    }
    
    // Additional factors that may affect confidence
    const browserFingerprintingResistance = 
        navigator.userAgent.includes('Firefox') && 
        typeof window.matchMedia === 'function' && 
        window.matchMedia('(prefers-color-scheme: dark)').media === 'not all';
    
    if (browserFingerprintingResistance) {
        score -= 0.15; // Browser is actively resisting fingerprinting
    }
    
    // Ensure the score stays within the 0.1-0.9 range
    return Math.max(0.1, Math.min(0.9, score));
}

/**
 * Get system information including OS, browser, device, and bot detection
 * @returns SystemInfo object with collected details
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
    const incognitoMode = await isIncognito();
    
    // Calculate confidence score - now including bot info
    const confidenceScore = calculateConfidenceScore(incognitoMode, botInfo);

    const browserInfo = {
        // Basic info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: Array.from(navigator.languages),
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
	adblockers: await detectAdBlockers(),
	        
        // Screen & Display
        screenResolution: [window.screen.width, window.screen.height] as [number, number],
        colorDepth: window.screen.colorDepth,
        colorGamut: getColorGamut(),
	touchSupport: getTouchSupportInfo(),
        
        // Hardware
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,
        
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
        
        // Privacy modes
        incognito: incognitoMode,
        
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

