import { SystemInfo, WebGLInfo, CanvasInfo, PluginInfo, MathInfo, FontInfo } from './types.js';
import { isIncognito } from './incognito.js';

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

export async function getSystemInfo() {
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
        
        // Screen & Display
        screenResolution: [window.screen.width, window.screen.height] as [number, number],
        colorDepth: window.screen.colorDepth,
        colorGamut: getColorGamut(),
        
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
        touchSupport: {
            maxTouchPoints: navigator.maxTouchPoints || 0,
            touchEvent: 'ontouchstart' in window,
            touchStart: Boolean(window.TouchEvent)
        },
        
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

function getMockSystemInfo() {
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
        incognito: false,
        bot: botInfo,
        confidenceScore: 0.85
    };
}

function getColorGamut(): string {
    if (!window.matchMedia) return 'unknown';
    if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020';
    if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
    if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb';
    return 'unknown';
}

async function getAudioFingerprint(): Promise<number | null> {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        gainNode.gain.value = 0;
        oscillator.type = 'triangle';
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(0);
        
        const audioData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(audioData);
        
        oscillator.stop();
        await audioContext.close();

        return audioData.reduce((a, b) => a + b, 0);
    } catch (e) {
        return null;
    }
}

function getVendorFlavors(): string[] {
    const flavors = [];
    if (navigator.userAgent.includes('Chrome')) {
        flavors.push('chrome');
    }
    if (navigator.userAgent.includes('Firefox')) {
        flavors.push('firefox');
    }
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
        flavors.push('safari');
    }
    return flavors;
}

function isLocalStorageEnabled(): boolean {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch {
        return false;
    }
}

function isSessionStorageEnabled(): boolean {
    try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
    } catch {
        return false;
    }
}

function isIndexedDBEnabled(): boolean {
    return !!window.indexedDB;
}

function getWebGLInfo(): WebGLInfo {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        if (!gl) return { vendor: 'unknown', renderer: 'unknown' };

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return { vendor: 'unknown', renderer: 'unknown' };

        return {
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown'
        };
    } catch {
        return { vendor: 'unknown', renderer: 'unknown' };
    }
}

function getCanvasFingerprint(): CanvasInfo {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return { winding: false, geometry: '', text: '' };

        // Text with custom font
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = '#069';
        ctx.fillText('Fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Test', 4, 17);

        return {
            winding: ctx.isPointInPath(0, 0, 'evenodd') !== ctx.isPointInPath(0, 0, 'nonzero'),
            geometry: canvas.toDataURL(),
            text: ctx.font
        };
    } catch {
        return { winding: false, geometry: '', text: '' };
    }
}

function getPluginsInfo(): PluginInfo[] {
    try {
        return Array.from(navigator.plugins).map(plugin => ({
            name: plugin.name,
            description: plugin.description,
            mimeTypes: Array.from(plugin.mimeTypes).map((mime: any) => ({
                type: mime.type as string,
                suffixes: mime.suffixes as string
            }))
        }));
    } catch {
        return [];
    }
}

function getMathFingerprint(): MathInfo {
    return {
        acos: Math.acos(0.123456789),
        acosh: Math.acosh(1.123456789),
        asinh: Math.asinh(0.123456789),
        atanh: Math.atanh(0.123456789),
        expm1: Math.expm1(0.123456789),
        sinh: Math.sinh(0.123456789),
        cosh: Math.cosh(0.123456789),
        tanh: Math.tanh(0.123456789)
    };
}

function getFontPreferences(): FontInfo {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    if (!context) return { fonts: [] };

    const getWidth = (fontFamily: string): number => {
        context!.font = `${testSize} ${fontFamily}`;
        return context!.measureText(testString).width;
    };

    const baseWidths = baseFonts.map(getWidth);

    return {
        fonts: baseFonts.map((font, index) => ({
            name: font,
            width: baseWidths[index]
        }))
    };
}
