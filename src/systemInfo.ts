import { SystemInfo, WebGLInfo, CanvasInfo, PluginInfo, MathInfo, FontInfo } from './types';
import { isIncognito } from './incognito';
export async function getSystemInfo() {
    const browserInfo = {
        // Basic info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: Array.from(navigator.languages),
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        
        // Screen & Display
        screenResolution: [window.screen.width, window.screen.height],
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
        incognito: await isIncognito()
    };

    return browserInfo;
}

function getColorGamut(): string {
    if (!window.matchMedia) return 'unknown';
    if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020';
    if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
    if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb';
    return 'unknown';
}

async function getAudioFingerprint(): Promise<number> {
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
        audioContext.close();

        return audioData.reduce((a, b) => a + b, 0);
    } catch (e) {
        return 0;
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
            mimeTypes: Array.from(plugin.mimeTypes).map(mime => ({
                type: mime.type as string,
                suffixes: (mime as any).suffixes as string
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
