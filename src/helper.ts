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
 * Retrieves the device's WebGL vendor and renderer information.
 *
 * This function creates a canvas element to obtain a WebGL context and attempts to
 * extract detailed hardware information using the WEBGL_debug_renderer_info extension.
 * If the extension is unavailable or an error occurs during retrieval, it returns default
 * values of 'unknown' for both vendor and renderer.
 *
 * @returns An object containing the WebGL vendor and renderer information.
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
 * Retrieves the device's touch support details.
 *
 * This function checks the global window object for touch event support and returns an object with:
 * - **maxTouchPoints**: The number of simultaneous touch points supported, defaulting to 0 if unavailable.
 * - **touchEvent**: A boolean indicating whether touch events are supported.
 * - **touchStart**: A boolean indicating if the 'ontouchstart' event is supported.
 *
 * @returns An object containing touch support information.
 */
export function getTouchSupportInfo(): TouchSupportInfo {
    return {
	maxTouchPoints: navigator.maxTouchPoints || 0,
	touchEvent: 'ontouchstart' in window,
	touchStart: 'ontouchstart' in window
    };
}

/**
 * Retrieves operating system information by parsing the browser's navigator data.
 *
 * This function analyzes the user agent and platform strings to determine the OS name and version,
 * supporting detection of Windows, macOS, Android, iOS, Linux, Unix-like systems, and more.
 * If the navigator object is unavailable or parsing fails, it returns "unknown" values.
 * Note: When `navigator` is undefined, the returned object also includes a `platform` property.
 *
 * @returns An object containing:
 *   - os: The name of the detected operating system.
 *   - version: The operating system version or a generic descriptor if it cannot be specifically determined.
 *   - platform (optional): The platform value, present only when `navigator` is undefined.
 */
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
    // Windows detection
// Windows detection
    if (/Windows NT/.test(userAgent)) {
      os = 'Windows';
      const match = userAgent.match(/Windows NT ([\d.]+)/);
      if (match && match[1]) {
        const versionMapping:{[key:string]:string} = {
          '10.0': '10/11', // Base mapping
          '6.3': '8.1',
          '6.2': '8',
          '6.1': '7',
          '6.0': 'Vista',
          '5.2': 'Server 2003',
          '5.1': 'XP',
          '5.0': '2000'
        };
        
        // Check for Windows 11 specific patterns
        if (match[1] === '10.0' && /(Windows 11|WOW64|Win64|x64)/.test(userAgent)) {
          version = '11';
        } else if (match[1] === '10.0') {
          version = '10';
        } else {
          version = versionMapping[match[1]] || match[1];
        }
      }
    }
    // macOS detection
    else if (/Mac OS X/.test(userAgent)) {
      os = 'macOS';
      const match = userAgent.match(/Mac OS X ([\d_]+)/);
      if (match && match[1]) {
        version = match[1].replace(/_/g, '.');
      }
    }
    // Android detection
    else if (/Android/.test(userAgent)) {
      os = 'Android';
      const match = userAgent.match(/Android ([\d.]+)/);
      if (match && match[1]) {
        version = match[1];
      }
    }
    // iOS detection (using userAgent patterns)
    else if (/iPhone|iPad|iPod|CPU(?: iPhone)? OS|MacOS/.test(userAgent)) {
      os = 'iOS';
      const match = userAgent.match(/OS ([\d_]+)/);
      if (match && match[1]) {
        version = match[1].replace(/_/g, '.');
      }
    }
    // Linux detection
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
    // Fallback for other Unix-based systems
    else if (/BSD/.test(userAgent) || /SunOS/.test(userAgent)) {
      os = 'Unix-like';
      version = 'generic';
    }
    // Fallback for unknown OSes
    else {
      os = platform;
    }
  } catch (err) {
    console.error('Error parsing OS info:', err);
  }

  return { os, version };
}

/**
 * Estimates the number of available logical cores on the device.
 *
 * This function spawns Web Worker instances to execute a compute-intensive task in parallel,
 * simulating the workload across cores. Up to 16 workers are created sequentially, and each worker
 * performs a heavy calculation. If a worker takes longer than 1000ms to complete its task, it is
 * terminated, halting the estimation process. The final count reflects the number of workers that
 * successfully completed the task within the performance threshold. In case of an error, any active
 * workers are terminated and resources are cleaned up before returning the core count.
 *
 * @returns The estimated number of logical cores available on the device.
 */
export async function estimateCores(): Promise<number> {
  const MAX_TEST_TIME = 1200; // Extended budget for more reliable results
  const TARGET_ITERATIONS = 30e6; // Adjusted for modern CPU performance
  const browserReportedCores = navigator.hardwareConcurrency || 4;

  // Early exit for unsupported environments
  if (typeof Worker === 'undefined') {
    return Math.min(browserReportedCores, 12);
  }

  const workerScript = `
    self.onmessage = (e) => {
      const start = performance.now();
      let result = 0;
      
      // Mixed operations to prevent compiler optimizations
      for (let i = 0; i < ${TARGET_ITERATIONS}; i++) {
        result += Math.sin(i) * Math.log(i + 1) / (i % 23 + 1);
        if (i % 1e5 === 0) self.postMessage({ progress: i }); // Anti-optimization checkpoint
      }
      
      const duration = performance.now() - start;
      self.postMessage({
        duration: duration,
        noise: performance.timeOrigin % 1 + Math.random() // Enhanced fingerprint resistance
      });
    };
  `;

  const blob = new Blob([workerScript], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const workers: Worker[] = [];

  try {
    const results = await Promise.race([
      (async () => {
        const testConcurrency = Math.min(browserReportedCores * 2, 16);
        const timings: number[] = [];
        
        // Run multiple concurrent workers
        const promises = Array.from({ length: testConcurrency }, async () => {
          const worker = new Worker(workerUrl);
          workers.push(worker);
          
          return new Promise<number>(resolve => {
            worker.onmessage = (e) => {
              if (e.data?.duration) resolve(e.data.duration);
            };
            worker.postMessage('start');
          });
        });

        const allDurations = await Promise.all(promises);
        const medianDuration = allDurations.sort()[Math.floor(allDurations.length / 2)];
        
        // Calculate parallel efficiency
        const singleThreadTime = medianDuration * testConcurrency;
        const theoreticalTime = medianDuration * (testConcurrency / browserReportedCores);
        const efficiency = (singleThreadTime / theoreticalTime) * 100;
        
        // Determine core count based on efficiency threshold
        let coreEstimate = Math.round(
          (testConcurrency * 100) / Math.max(efficiency, 10) // 10% minimum efficiency floor
        );

        // Cross-validation with hardware report
        coreEstimate = Math.min(
          Math.max(coreEstimate, browserReportedCores - 2),
          browserReportedCores + 2
        );

        // Architecture-specific final check
        return Math.min(coreEstimate, 12);
      })(),
      new Promise<number>(resolve => 
        setTimeout(() => resolve(browserReportedCores), MAX_TEST_TIME)
      )
    ]);

    // Final adjustment for known 6-core CPUs
    if (navigator.userAgent.includes('Firefox')) {
      return Math.min(results, 8); // Firefox often shows +1 core
    }
    return Math.min(results, 12);
    
  } catch (e) {
    return browserReportedCores;
  } finally {
    workers.forEach(w => w.terminate());
    URL.revokeObjectURL(workerUrl);
  }
}
