/**
 * Helper functions for fingerprinting
 */
import { FontInfo , MathInfo, PluginInfo, TouchSupportInfo, WebGLInfo, CanvasInfo } from './types';

/**
 * Get color gamut of the device
 * @returns Color gamut of the device (rec2020, p3, srgb, unknown)
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut
 */
export function getColorGamut(): string {
    if (!window.matchMedia) return 'unknown';
    if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020';
    if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
    if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb';
    return 'unknown';
}

/**
 * Computes a numeric audio fingerprint for the device.
 *
 * This function generates a synthetic audio signal using the Web Audio API and calculates a fingerprint by summing its frequency data.
 * If any error occurs during the process, it returns null.
 *
 * @returns The computed audio fingerprint value, or null if the computation fails.
 */
export async function getAudioFingerprint(): Promise<number | null> {
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


/**
 * Retrieves the browser vendor flavors by inspecting the user agent string.
 *
 * This function checks the navigator's user agent for indicators of Chrome, Firefox, and Safari. It adds "safari" only when the user agent
 * contains "Safari" but not "Chrome" to avoid false positives.
 *
 * @returns An array of vendor flavor strings, such as "chrome", "firefox", and/or "safari", based on the detected browser.
 */
export function getVendorFlavors(): string[] {
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


/**
 * Checks whether localStorage is available and functional.
 *
 * The function attempts to set and remove a test item in localStorage.
 * Returns true if both operations succeed, indicating that localStorage is enabled;
 * otherwise, returns false.
 */
export function isLocalStorageEnabled(): boolean {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch {
        return false;
    }
}


/**
 * Checks if sessionStorage is enabled in the current environment.
 *
 * The function attempts to set and remove an item in sessionStorage. If both operations
 * succeed, it returns true, indicating that sessionStorage is available. If an error occurs,
 * such as when sessionStorage is restricted by browser settings, it returns false.
 *
 * @returns True if sessionStorage is enabled, false otherwise.
 */
export function isSessionStorageEnabled(): boolean {
    try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
    } catch {
        return false;
    }
}

/**
 * Determines whether IndexedDB is supported in the current environment.
 *
 * Checks for the presence of the `indexedDB` property on the window object.
 *
 * @returns True if IndexedDB is available; otherwise, false.
 */
export function isIndexedDBEnabled(): boolean {
    return !!window.indexedDB;
}

/**
 * Retrieves the device's WebGL vendor and renderer information.
 *
 * This function creates an offscreen canvas and attempts to obtain a WebGL context along with its debug extension to extract the unmasked vendor and renderer details. If the context or extension is unavailable, or if an error occurs, it returns "unknown" for both values.
 *
 * @returns An object containing the WebGL vendor and renderer information, or default "unknown" values if they cannot be obtained.
 */
export function getWebGLInfo(): WebGLInfo {
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

/**
 * Generates a canvas fingerprint by rendering shapes and text.
 *
 * This function creates a canvas element and draws a rectangle and text to capture subtle differences in the device's
 * canvas rendering behavior. It extracts fingerprint properties including:
 * - **winding**: A boolean based on the canvas's path winding rules.
 * - **geometry**: A data URL of the rendered canvas content.
 * - **text**: The font settings used during drawing.
 *
 * If an error occurs or the canvas 2D context is unavailable, it returns default empty values.
 *
 * @returns An object containing canvas fingerprint details.
 */
export function getCanvasFingerprint(): CanvasInfo {
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

/**
 * Retrieves information about installed browser plugins.
 *
 * This function extracts plugin details from the navigator's plugins collection and returns them as an array of objects. Each object includes the plugin's name, description, and a list of supported MIME types with their type and suffixes. If an error occurs during retrieval, an empty array is returned.
 *
 * @returns An array of plugin information objects.
 */
export function getPluginsInfo(): PluginInfo[] {
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

/**
 * Computes a mathematical fingerprint.
 *
 * Calculates several values using native Math functions with fixed inputs. The resulting object contains values
 * from operations such as acos, acosh, asinh, atanh, expm1, sinh, cosh, and tanh, which can be used for device fingerprinting.
 *
 * @returns An object containing computed mathematical values.
 */
export function getMathFingerprint(): MathInfo {
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

/**
 * Retrieves the device's base font preferences by measuring text widths on a canvas.
 *
 * This function creates a canvas element and uses its 2D context to measure the width of a test string
 * rendered with common base fonts (monospace, sans-serif, serif). It returns an object with a `fonts` array,
 * where each entry contains a font name and its measured width. If the canvas 2D context is unavailable,
 * the function returns an object with an empty `fonts` array.
 *
 * @returns An object containing the measured font preferences.
 */
export function getFontPreferences(): FontInfo {
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

/**
 * Retrieves touch support information for the current device.
 *
 * Checks if the device supports touch events by verifying the presence of the 'ontouchstart' property on the window object, and returns details about available touch capabilities.
 *
 * @returns An object containing:
 * - maxTouchPoints: The maximum number of supported touch points (defaults to 0 if unavailable).
 * - touchEvent: A boolean indicating if touch events are supported.
 * - touchStart: A boolean indicating if the 'touchstart' event is recognized.
 */
export function getTouchSupportInfo(): TouchSupportInfo {
    return {
	maxTouchPoints: navigator.maxTouchPoints || 0,
	touchEvent: 'ontouchstart' in window,
	touchStart: 'ontouchstart' in window
    };
}


