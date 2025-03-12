/**
 * Helper functions for fingerprinting
 */
import { FontInfo , MathInfo, PluginInfo, MimeType , TouchSupportInfo, WebGLInfo, CanvasInfo } from './types';

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
 * Get audio fingerprint of the device
 * @returns Audio fingerprint of the device or null if an error occurred
 * explaination of the code
 * 		- The function creates an AudioContext object to handle audio operations.
	 * 		- It then creates an OscillatorNode object to generate a periodic waveform.
	 * 			- The oscillator is connected to an AnalyserNode object to provide real-time frequency and time-domain analysis information.
	 * 				- The analyser is connected to a ScriptProcessorNode object to process audio data in chunks.
	 * 					- The script processor is connected to a GainNode object to control the audio volume.
	 * 				
	 * 					- The oscillator is started and the analyser is used to get the frequency data.
	 * 						- The oscillator is stopped and the audio context is closed.
	 * 							- The sum of the frequency data is returned as the audio fingerprint.
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
 * get vendor flavors of the device 
 * @returns Array of vendor flavors (chrome, firefox, safari)
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
 * check localStorage is enabled or not
 * @returns boolean value 
 * explaination of the code
 * 		- The function tries to set an item in localStorage and then remove it.
 * 			- If an error occurs, it returns false.
 * 				- If no error occurs, it returns true.
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
 * check sessionStorage is enabled or not
 * @returns boolean value
 * explaination of the code
 * 		- The function tries to set an item in sessionStorage and then remove it.
 * 			- If an error occurs, it returns false.
 * 				- If no error occurs, it returns true.
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
 * check indexedDB is enabled or not
 * @returns boolean value
 * explaination of the code
 * 		- The function checks if the window object has an indexedDB property.
 * 			- If it does, it returns true.
 * 				- If it doesn't, it returns false.
 */
export function isIndexedDBEnabled(): boolean {
    return !!window.indexedDB;
}

/**
 * get WebGL information of the device
 * @returns WebGL information of the device
 * explaination of the code
 * 		- The function creates a canvas element and gets the WebGL context.
	 * 		- It then gets the vendor and renderer information from the context.
	 * 			- If an error occurs, it returns unknown values.
 */
export function getWebGLInfo(): WebGLInfo {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        if (!gl) return { vendor: 'unknown', renderer: 'unknown' };

        let vendor = 'unknown';
        let renderer = 'unknown';

        try {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
                renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
            } else {
                vendor = gl.getParameter(gl.VENDOR) || vendor;
                renderer = gl.getParameter(gl.RENDERER) || renderer;
            }
        } catch (extensionError) {
            console.warn('WEBGL_debug_renderer_info extension not available:', extensionError);
        }

        return { vendor, renderer };
    } catch (error) {
        console.error('Error retrieving WebGL information:', error);
        return { vendor: 'unknown', renderer: 'unknown' };
    }
}
/**
 * get canvas fingerprint of the device
 * @returns Canvas fingerprint of the device
 * explaination of the code
 * 		- The function creates a canvas element and gets the 2D context.
	 * 		- It then draws a rectangle and text on the canvas.
	 * 			- If an error occurs, it returns empty values.
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
 * get plugins information of the device
 * @returns Array of plugin information
 * explaination of the code
 * 		- The function gets the plugins from the navigator object.
	 * 		- It then maps the plugins to an array of objects with name, description, and mimeTypes properties.
	 * 			- If an error occurs, it returns an empty array.
 */
export function getPluginsInfo(): PluginInfo[] {
    if (!navigator.plugins) {
        console.warn('Navigator plugins not available');
        return [];
    }

    try {
        return Array.from(navigator.plugins).map(plugin => {
            if (!plugin) return null;
            
            // Get all properties that are MimeType instances
            const mimeTypes: MimeType[] = [];
            for (const key in plugin) {
                const value = plugin[key];
                if (value && typeof value === 'object' && value.type && value.suffixes) {
                    mimeTypes.push({
                        type: value.type,
                        suffixes: value.suffixes
                    });
                }
            }

            return {
                name: plugin.name || '',
                description: plugin.description || '',
                mimeTypes
            };
        }).filter(Boolean) as PluginInfo[];
    } catch (error) {
        console.error('Error getting plugins:', error);
        return [];
    }
}

/**
 * get math constants of the device
 * @returns Math constants of the device
 * explaination of the code
 * 		- The function calculates various math constants using the Math object.
 * 			- If an error occurs, it returns default values.
 *  				- If no error occurs, it returns the calculated values.
 *  			 				
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
 * get font preferences of the device
 * @returns Font preferences of the device
 * explaination of the code
 * 		- The function creates a canvas element and gets the 2D context.
	 * 		- It then measures the width of a test string using different font families.
	 * 			- If an error occurs, it returns an empty array.
 * 				- If no error occurs, it returns an array of objects with name and width properties.
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
 * get touch support information of the device
 * @returns Touch support information of the device
 * explaination of the code
 * 		- The function checks if the window object has touch event properties.
	 * 		- It then returns an object with maxTouchPoints, touchEvent, and touchStart properties.
 */
export function getTouchSupportInfo(): TouchSupportInfo {
    return {
	maxTouchPoints: navigator.maxTouchPoints || 0,
	touchEvent: 'ontouchstart' in window,
	touchStart: 'ontouchstart' in window
    };
}


