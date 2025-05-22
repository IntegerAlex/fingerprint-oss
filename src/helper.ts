/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
/**
 * Helper functions for fingerprinting
 */
import { sha256 } from 'hash-wasm';
import { FontPreferencesInfo , MathInfo, PluginInfo, MimeType , TouchSupportInfo, WebGLInfo, CanvasInfo } from './types';

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
        console.warn('Error getting audio fingerprint:', e);
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


export function isLocalStorageEnabled(): boolean {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch {
        return false;
    }
}

export function isSessionStorageEnabled(): boolean {
    try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
    } catch {
        return false;
    }
}

export function isIndexedDBEnabled(): boolean {
    return !!window.indexedDB;
}

/**
 * Retrieves the device's WebGL vendor, renderer, and an image hash from a rendered scene.
 * @returns A Promise resolving to an object containing WebGL vendor, renderer, and imageHash.
 */
export async function getWebGLInfo(): Promise<WebGLInfo> {
    let vendor = 'unknown';
    let renderer = 'unknown';
    let imageHash: string | null = null;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

        if (!gl) {
            return { vendor, renderer, imageHash: 'webgl_context_unavailable' };
        }

        // Get vendor and renderer strings
        try {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
                renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
            } else {
                vendor = gl.getParameter(gl.VENDOR) || vendor;
                renderer = gl.getParameter(gl.RENDERER) || renderer;
            }
        } catch (e) {
            console.warn('Error getting WebGL vendor/renderer strings:', e);
        }

        // Render scene for image hash
        try {
            const vsSource = `
                attribute vec2 a_position;
                attribute vec3 a_color;
                varying vec3 v_color;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                    v_color = a_color;
                }
            `;
            const fsSource = `
                precision mediump float;
                varying vec3 v_color;
                void main() {
                    gl_FragColor = vec4(v_color, 1.0);
                }
            `;

            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            if (!vertexShader) throw new Error("Failed to create vertex shader");
            gl.shaderSource(vertexShader, vsSource);
            gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            if (!fragmentShader) throw new Error("Failed to create fragment shader");
            gl.shaderSource(fragmentShader, fsSource);
            gl.compileShader(fragmentShader);

            const program = gl.createProgram();
            if (!program) throw new Error("Failed to create program");
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            // x, y, r, g, b
            const vertices = new Float32Array([
                // Triangle 1
                -0.9, -0.9, 1.0, 0.0, 0.0, // V0 (red)
                 0.9, -0.9, 0.0, 1.0, 0.0, // V1 (green)
                -0.9,  0.9, 0.0, 0.0, 1.0, // V2 (blue)
                // Triangle 2
                 0.9, -0.9, 0.0, 1.0, 0.0, // V1 (green)
                 0.9,  0.9, 1.0, 1.0, 0.0, // V3 (yellow)
                -0.9,  0.9, 0.0, 0.0, 1.0, // V2 (blue)
            ]);

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);

            const colorLocation = gl.getAttribLocation(program, 'a_color');
            gl.enableVertexAttribArray(colorLocation);
            gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
            
            gl.clearColor(0.5, 0.5, 0.5, 1.0); // Clear with a specific color
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw 2 triangles (6 vertices)

            const pixelData = new Uint8Array(canvas.width * canvas.height * 4);
            gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
            
            const pixelString = Array.from(pixelData).join(',');
            imageHash = await sha256(pixelString);

        } catch (renderError) {
            console.warn('Error rendering WebGL scene for hash:', renderError);
            imageHash = 'webgl_render_error';
        }

        return { vendor, renderer, imageHash };

    } catch (error) {
        console.error('Error retrieving WebGL information:', error);
        return { vendor: 'unknown', renderer: 'unknown', imageHash: 'webgl_overall_error' };
    }
}

export function getCanvasFingerprint(): CanvasInfo {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return { winding: false, geometry: '', text: '' };

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

export function getPluginsInfo(): PluginInfo[] {
    if (!navigator.plugins) {
        console.warn('Navigator plugins not available');
        return [];
    }
    try {
        return Array.from(navigator.plugins).map(plugin => {
            if (!plugin) return null;
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
 * Detects available fonts by comparing dimensions against a baseline generic font.
 * @returns An object containing a sorted list of detected font names.
 */
export function getFontPreferences(): FontPreferencesInfo {
    const fontList = [
        // Common Windows fonts
        'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Candara', 'Comic Sans MS', 'Consolas', 'Constantia', 
        'Corbel', 'Courier New', 'Ebrima', 'Franklin Gothic Medium', 'Gabriola', 'Gadugi', 'Georgia', 
        'Impact', 'Javanese Text', 'Leelawadee UI', 'Lucida Console', 'Lucida Sans Unicode', 
        'Malgun Gothic', 'Marlett', 'Microsoft Himalaya', 'Microsoft JhengHei', 'Microsoft New Tai Lue', 
        'Microsoft PhagsPa', 'Microsoft Sans Serif', 'Microsoft Tai Le', 'Microsoft YaHei', 'Microsoft Yi Baiti', 
        'MingLiU-ExtB', 'Mongolian Baiti', 'MS Gothic', 'MV Boli', 'Myanmar Text', 'Nirmala UI', 
        'Palatino Linotype', 'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Historic', 
        'Segoe UI Emoji', 'Segoe UI Symbol', 'SimSun', 'Sitka', 'Sylfaen', 'Symbol', 'Tahoma', 
        'Times New Roman', 'Trebuchet MS', 'Verdana', 'Webdings', 'Wingdings', 'Yu Gothic',
        // Common macOS fonts
        'American Typewriter', 'Andale Mono', 'Apple Chancery', 'AppleGothic', 'AppleMyungjo', 
        'Baskerville', 'Big Caslon', 'Bodoni 72', 'Bradley Hand', 'Brush Script MT', 'Chalkboard', 
        'Chalkduster', 'Charter', 'Cochin', 'Copperplate', 'Courier', 'Didot', 'Futura', 
        'Geneva', 'Gill Sans', 'Helvetica', 'Helvetica Neue', 'Herculanum', 'Hoefler Text', 
        'Lucida Grande', 'Marker Felt', 'Menlo', 'Monaco', 'Noteworthy', 'Optima', 'Palatino', 
        'Papyrus', 'Rockwell', 'Savoye LET', 'Skia', 'Snell Roundhand', 'Thonburi', 'Trattatello', 
        'Zapfino',
        // Common Linux/Open Source fonts
        'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono', 'Liberation Sans', 'Liberation Serif', 
        'Liberation Mono', 'Noto Sans', 'Noto Serif', 'Noto Mono', 'Roboto', 'Open Sans', 
        'Ubuntu', 'Cantarell', 'Droid Sans', 'Source Sans Pro',
        // Other popular fonts
        'Century Gothic', 'Garamond'
    ];

    const testString = "abcdefghijklmnopqrstuvwxyz0123456789";
    const testSize = '72px';
    const detectedFonts: string[] = [];

    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            return { detectedFonts: [] };
        }

        // Baseline measurement with generic 'sans-serif'
        context.font = `${testSize} sans-serif`;
        const baselineWidth = context.measureText(testString).width;
        const baselineHeight = parseInt(context.font) || 72; // Estimate height from font size

        // Baseline measurement with generic 'serif'
        context.font = `${testSize} serif`;
        const baselineSerifWidth = context.measureText(testString).width;
        const baselineSerifHeight = parseInt(context.font) || 72;

        // Baseline measurement with generic 'monospace'
        context.font = `${testSize} monospace`;
        const baselineMonoWidth = context.measureText(testString).width;
        const baselineMonoHeight = parseInt(context.font) || 72;


        for (const font of fontList) {
            // Test against sans-serif baseline
            context.font = `${testSize} "${font}", sans-serif`;
            const currentWidthSans = context.measureText(testString).width;
            const currentHeightSans = parseInt(context.font) || 72; // Re-parse in case it changed

            if (currentWidthSans !== baselineWidth || currentHeightSans !== baselineHeight) {
                detectedFonts.push(font);
                continue; // Font detected, move to next font
            }

            // Test against serif baseline
            context.font = `${testSize} "${font}", serif`;
            const currentWidthSerif = context.measureText(testString).width;
            const currentHeightSerif = parseInt(context.font) || 72;

            if (currentWidthSerif !== baselineSerifWidth || currentHeightSerif !== baselineSerifHeight) {
                detectedFonts.push(font);
                continue; 
            }
            
            // Test against monospace baseline
            context.font = `${testSize} "${font}", monospace`;
            const currentWidthMono = context.measureText(testString).width;
            const currentHeightMono = parseInt(context.font) || 72;

            if (currentWidthMono !== baselineMonoWidth || currentHeightMono !== baselineMonoHeight) {
                detectedFonts.push(font);
            }
        }
        
        // Remove duplicates that might have been added if they differ from multiple baselines
        const uniqueDetectedFonts = Array.from(new Set(detectedFonts));
        return { detectedFonts: uniqueDetectedFonts.sort() };

    } catch (error) {
        console.warn('Error detecting font preferences:', error);
        return { detectedFonts: [] };
    }
}


export function getTouchSupportInfo(): TouchSupportInfo {
    return {
	maxTouchPoints: navigator.maxTouchPoints || 0,
	touchEvent: 'ontouchstart' in window,
	touchStart: 'ontouchstart' in window
    };
}

export function getOSInfo() {
  if (typeof navigator === 'undefined') {
    return {
      platform: 'unknown',
      os: 'unknown',
      version: 'unknown',
    };
  }

  const platform = navigator.platform || 'unknown';
  const userAgent = navigator.userAgent || 'unknown';
  let os = 'unknown';
  let version = 'unknown';

  try {
    if (/Windows NT/.test(userAgent)) {
      os = 'Windows';
      const match = userAgent.match(/Windows NT ([\d.]+)/);
      if (match && match[1]) {
        const versionMapping:{[key:string]:string} = {
          '10.0': '10/11', 
          '6.3': '8.1',
          '6.2': '8',
          '6.1': '7',
          '6.0': 'Vista',
          '5.2': 'Server 2003',
          '5.1': 'XP',
          '5.0': '2000'
        };
        if (match[1] === '10.0' && /(Windows 11|WOW64|Win64|x64)/.test(userAgent)) {
          version = '11';
        } else if (match[1] === '10.0') {
          version = '10';
        } else {
          version = versionMapping[match[1]] || match[1];
        }
      }
    }
    else if (/Mac OS X/.test(userAgent)) {
      os = 'macOS';
      const match = userAgent.match(/Mac OS X ([\d_]+)/);
      if (match && match[1]) {
        version = match[1].replace(/_/g, '.');
      }
    }
    else if (/Android/.test(userAgent)) {
      os = 'Android';
      const match = userAgent.match(/Android ([\d.]+)/);
      if (match && match[1]) {
        version = match[1];
      }
    }
    else if (/iPhone|iPad|iPod|CPU(?: iPhone)? OS|MacOS/.test(userAgent)) {
      os = 'iOS';
      const match = userAgent.match(/OS ([\d_]+)/);
      if (match && match[1]) {
        version = match[1].replace(/_/g, '.');
      }
    }
    else if (/Linux/.test(platform) || /Linux/.test(userAgent)) {
      os = 'Linux';
      if (/Ubuntu/.test(userAgent)) {
        version = 'Ubuntu';
      } else if (/Fedora/.test(userAgent)) {
        version = 'Fedora';
      } else if (/Debian/.test(userAgent)) {
        version = 'Debian';
      } else if (/Arch/.test(userAgent)) {
        version = 'Arch';
      } else if (/Manjaro/.test(userAgent)) {
        version = 'Manjaro';
      } else if (/openSUSE/.test(userAgent)) {
        version = 'openSUSE';
      } else if (/Mint/.test(userAgent)) {
        version = 'Linux Mint';
      } else {
        version = 'generic';
      }
    }
    else if (/BSD/.test(userAgent) || /SunOS/.test(userAgent)) {
      os = 'Unix-like';
      version = 'generic';
    }
    else {
      os = platform;
    }
  } catch (err) {
    console.error('Error parsing OS info:', err);
  }

  return { os, version };
}

export async function estimateCores(): Promise<number> {
  const MAX_TEST_TIME = 1200; 
  const TARGET_ITERATIONS = 30e6; 
  const browserReportedCores = navigator.hardwareConcurrency || 4;

  if (typeof Worker === 'undefined') {
    return Math.min(browserReportedCores, 12);
  }

  const workerScript = `
    self.onmessage = (e) => {
      const start = performance.now();
      let result = 0;
      for (let i = 0; i < ${TARGET_ITERATIONS}; i++) {
        result += Math.sin(i) * Math.log(i + 1) / (i % 23 + 1);
        if (i % 1e5 === 0) self.postMessage({ progress: i });
      }
      const duration = performance.now() - start;
      self.postMessage({
        duration: duration,
        noise: performance.timeOrigin % 1 + Math.random()
      });
    };
  `;

  const blob = new Blob([workerScript], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const workers: Worker[] = [];

  try {
    const corePromise = (async () => {
      const testConcurrency = Math.min(browserReportedCores * 2, 16);
      const promises = Array.from({ length: testConcurrency }, async () => {
        const worker = new Worker(workerUrl);
        workers.push(worker);
        return new Promise<number>(resolve => {
          worker.onmessage = (e) => {
            if (e.data?.duration) {
              resolve(e.data.duration);
            }
          };
          worker.postMessage('start');
        });
      });
      const allDurations = await Promise.all(promises);
      allDurations.sort((a, b) => a - b);
      const medianDuration = allDurations[Math.floor(allDurations.length / 2)];
      
      const singleThreadTime = medianDuration * testConcurrency;
      const theoreticalTime = medianDuration * (testConcurrency / browserReportedCores);
      const efficiency = (singleThreadTime / theoreticalTime) * 100;
      
      let coreEstimate = Math.round(
        (testConcurrency * 100) / Math.max(efficiency, 10) 
      );
      
      coreEstimate = Math.min(
        Math.max(coreEstimate, browserReportedCores - 2),
        browserReportedCores + 2
      );
      
      return Math.min(Math.max(coreEstimate, 1), 12);
    })().catch((err: any) => {
      console.warn("Core estimation failed:", err); // Changed to warn
      return browserReportedCores;
    });

    const results = await Promise.race([
      corePromise,
      new Promise<number>(resolve =>
        setTimeout(() => resolve(browserReportedCores), MAX_TEST_TIME)
      )
    ]);

    if (navigator.userAgent.includes('Firefox') || performance.timing?.navigationStart) {
      return Math.min(results, 8);
    }
    return Math.min(results, 12);
    
  } catch (e) {
    console.warn('Overall error in estimateCores:', e); // Changed to warn
    return browserReportedCores;
  } finally {
    workers.forEach(w => w.terminate());
    URL.revokeObjectURL(workerUrl);
  }
}
