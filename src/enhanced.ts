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
 * Enhanced fingerprinting module.
 *
 * Improves upon the baseline signals by applying techniques that increase
 * entropy, reduce noise, and detect spoofing/anti-fingerprinting behavior.
 * All exports are backward-compatible additions; no existing API is modified.
 *
 * Key improvements (inspired by analysis of open-source fingerprinting research):
 *  - audio_v2: uses OfflineAudioContext + compressor for deterministic output
 *    and detects per-sample noise injection used by some privacy extensions.
 *  - canvas_v2: runs the drawing three times and selects the most common pixel
 *    value per channel, neutralising per-call pixel noise added by browsers
 *    like Brave or Firefox's fingerprinting resistance mode.
 *  - webgl2: reads implementation-specific WebGL2 limits and precision formats
 *    that are not randomised by common anti-fingerprint tools, yielding more
 *    stable and higher-entropy GPU signals.
 *  - spoofing: consolidates headless-browser and anti-fingerprint signals into
 *    a single scored result so callers can act on the combined risk.
 */

import { sha256 } from 'hash-wasm';
import { StructuredLogger } from './config';
import type {
    AudioEnhanced,
    CanvasEnhanced,
    WebGL2Enhanced,
    SpoofingInfo,
    EnhancedFingerprintInfo,
} from './types';

// ─── fp_version ─────────────────────────────────────────────────────────────

/**
 * Semantic version string for the enhanced fingerprint feature-set.
 * Increment when the set of collected signals changes in a way that would
 * alter the resulting hash for the same physical device.
 */
export const FP_VERSION = '1.0.0';

// ─── Audio v2 ────────────────────────────────────────────────────────────────

/**
 * Returns an enhanced audio fingerprint using `OfflineAudioContext`.
 *
 * Unlike the baseline implementation which relies on the online AudioContext
 * (whose output can be influenced by system-level audio latency), this
 * function pre-renders a fixed-length audio buffer entirely in software.
 * The resulting sample sum is therefore deterministic across page loads on
 * the same device, and the compressor gain-reduction value provides an
 * additional independent signal.
 *
 * Noise detection: some privacy tools inject random offsets into each rendered
 * sample.  We detect this by comparing the `getChannelData` slice against a
 * `copyFromChannel` slice – if they diverge, the audio is being tampered with.
 *
 * @returns AudioEnhanced object or null when OfflineAudioContext is unavailable.
 */
export async function getEnhancedAudioFingerprint(): Promise<AudioEnhanced | null> {
    try {
        if (typeof window === 'undefined') return null;

        // OfflineAudioContext is more deterministic than the live AudioContext:
        // rendering happens at full speed, unaffected by audio hardware timing.
        const OfflineCtx: typeof OfflineAudioContext =
            window.OfflineAudioContext ?? (window as any).webkitOfflineAudioContext;

        if (!OfflineCtx) return null;

        const SAMPLE_RATE = 44100;
        const BUFFER_LEN = 5000;

        const context = new OfflineCtx(1, BUFFER_LEN, SAMPLE_RATE);

        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 1000; // 1 kHz sine wave

        // A DynamicsCompressor introduces a non-linear signal path whose
        // coefficients are hardware-dependent, adding GPU/DSP entropy.
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;

        const analyser = context.createAnalyser();

        oscillator.connect(compressor);
        compressor.connect(analyser);
        compressor.connect(context.destination);
        oscillator.start(0);

        // Collect AnalyserNode properties – they vary per audio implementation.
        const maxChannels = context.destination.maxChannelCount;
        const channelCountMode = analyser.channelCountMode;

        const spoofingSignals: string[] = [];

        // Render the buffer offline.
        const renderedBuffer = await context.startRendering();
        const channelData = renderedBuffer.getChannelData(0);

        // Sum of absolute sample values — implementation-specific, stable.
        let sampleHash = 0;
        for (let i = 0; i < channelData.length; i++) {
            sampleHash += Math.abs(channelData[i]);
        }

        // Noise-injection check: copyFromChannel should produce the same bytes
        // as getChannelData when no privacy shim is active.
        if ('copyFromChannel' in AudioBuffer.prototype) {
            const copy = new Float32Array(BUFFER_LEN);
            renderedBuffer.copyFromChannel(copy, 0);

            // Compare a representative mid-buffer window (indices 2400–2500).
            const START = 2400;
            const END = 2500;
            let mismatch = false;
            for (let i = START; i < END; i++) {
                if (channelData[i] !== copy[i]) {
                    mismatch = true;
                    break;
                }
            }
            if (mismatch) {
                spoofingSignals.push('audio:sample-noise-detected');
            }
        }

        // Frequency data in an offline context should be all -Infinity (silence)
        // before rendering completes; non-uniform data indicates tampering.
        const freqData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(freqData);
        const uniqueFreqs = new Set(freqData).size;
        if (uniqueFreqs > 1) {
            spoofingSignals.push('audio:unexpected-frequency-data');
        }

        return {
            sampleHash,
            maxChannels,
            channelCountMode,
            hasSpoofing: spoofingSignals.length > 0,
            spoofingSignals,
        };
    } catch (e) {
        StructuredLogger.warn('getEnhancedAudioFingerprint', 'Enhanced audio fingerprint failed', e);
        return null;
    }
}

// ─── Canvas v2 ───────────────────────────────────────────────────────────────

/**
 * Returns a noise-stabilised canvas fingerprint hash.
 *
 * Browsers like Brave and Firefox (with resistance.fingerprinting) add
 * small random offsets to canvas pixels on each call to defeat naive
 * single-sample fingerprinting.  By rendering the same scene multiple
 * times and taking the *most common* byte value per pixel channel, we
 * recover the deterministic underlying values while discarding the noise.
 *
 * The stable pixel array is then SHA-256 hashed for a compact, fixed-length
 * identifier that fits comfortably in the overall fingerprint object.
 */
export async function getEnhancedCanvasFingerprint(): Promise<CanvasEnhanced | null> {
    try {
        if (typeof document === 'undefined' || !document.createElement) return null;

        const WIDTH = 280;
        const HEIGHT = 60;
        const RUNS = 3; // Three runs to detect and neutralise per-call noise.

        /**
         * Draw the same scene onto a fresh canvas and return its ImageData.
         * The scene deliberately includes:
         *  - a multi-stop gradient (exercises color interpolation)
         *  - text at a non-integer baseline offset (exercises sub-pixel rendering)
         *  - a semi-transparent overlay (exercises alpha compositing)
         * Each of these is rendered differently by different GPU/driver combos.
         */
        function drawScene(): ImageData | null {
            const canvas = document.createElement('canvas');
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Gradient background — exercises color interpolation logic.
            const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
            grad.addColorStop(0, '#e74c3c');
            grad.addColorStop(0.25, '#f39c12');
            grad.addColorStop(0.5, '#2ecc71');
            grad.addColorStop(0.75, '#3498db');
            grad.addColorStop(1, '#9b59b6');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            // Primary text — sub-pixel baseline exercises font rasterization.
            ctx.font = '18.5px "Arial", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText('Fingerprint\u200B-OSS', 4, 22.7);

            // Semi-transparent overlay — exercises alpha compositing.
            ctx.fillStyle = 'rgba(0, 120, 215, 0.45)';
            ctx.fillText('Fingerprint\u200B-OSS', 5.3, 24.1);

            // Diagonal line — exercises anti-aliasing.
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(WIDTH * 0.4, HEIGHT);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            return ctx.getImageData(0, 0, WIDTH, HEIGHT);
        }

        const frames: ImageData[] = [];
        for (let i = 0; i < RUNS; i++) {
            const frame = drawScene();
            if (frame) frames.push(frame);
        }

        if (frames.length === 0) return null;

        // For each pixel channel, pick the most frequent value across runs.
        // This discards per-call noise while keeping the deterministic signal.
        const totalBytes = WIDTH * HEIGHT * 4;
        const stable = new Uint8Array(totalBytes);

        for (let i = 0; i < totalBytes; i++) {
            if (frames.length === 1) {
                // Only one frame — no noise reduction possible.
                stable[i] = frames[0].data[i];
            } else {
                // Majority vote across frames.
                const counts = new Map<number, number>();
                for (const frame of frames) {
                    const v = frame.data[i];
                    counts.set(v, (counts.get(v) ?? 0) + 1);
                }
                let best = frames[0].data[i];
                let bestCount = 0;
                for (const [val, count] of counts) {
                    if (count > bestCount) {
                        bestCount = count;
                        best = val;
                    }
                }
                stable[i] = best;
            }
        }

        const pixelHash = await sha256(stable.join(','));
        return { pixelHash };
    } catch (e) {
        StructuredLogger.warn('getEnhancedCanvasFingerprint', 'Enhanced canvas fingerprint failed', e);
        return null;
    }
}

// ─── WebGL 2 ─────────────────────────────────────────────────────────────────

/**
 * Extracts high-entropy signals from the WebGL2 API.
 *
 * WebGL1 vendor/renderer strings are the most commonly spoofed WebGL
 * signals.  WebGL2 exposes additional implementation limits and precision
 * formats that are less frequently targeted by anti-fingerprint tools
 * because they reflect deep GPU driver behaviour rather than a simple string.
 *
 * Collected signals:
 *  - MAX_TEXTURE_SIZE / MAX_VIEWPORT_DIMS / MAX_RENDERBUFFER_SIZE
 *    – GPU capability flags that differ between hardware generations.
 *  - Shader precision formats (vertex + fragment, high float)
 *    – expose whether the GPU uses 32-bit or higher-precision floats.
 *  - Supported extension list (hashed) – varies by driver version/vendor.
 */
export async function getEnhancedWebGL2Info(): Promise<WebGL2Enhanced | null> {
    try {
        if (typeof document === 'undefined' || !document.createElement) return null;

        const canvas = document.createElement('canvas');
        // Minimal size; we only query parameters, no rendering needed.
        canvas.width = 1;
        canvas.height = 1;

        const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;

        if (!gl) {
            return {
                supported: false,
                maxTextureSize: null,
                maxViewportDims: null,
                precisionHash: null,
                extensionsHash: null,
                renderer: 'unsupported',
                vendor: 'unsupported',
            };
        }

        // Vendor / renderer strings (same extension as WebGL1).
        let renderer = 'unknown';
        let vendor = 'unknown';
        try {
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            if (dbg) {
                renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || renderer;
                vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || vendor;
            } else {
                renderer = gl.getParameter(gl.RENDERER) || renderer;
                vendor = gl.getParameter(gl.VENDOR) || vendor;
            }
        } catch { /* continue without debug info */ }

        // Implementation limits — these differ across GPU families.
        const maxTextureSize: number = gl.getParameter(gl.MAX_TEXTURE_SIZE) ?? null;
        const rawViewport: Int32Array | null = gl.getParameter(gl.MAX_VIEWPORT_DIMS) ?? null;
        const maxViewportDims: [number, number] | null = rawViewport
            ? [rawViewport[0], rawViewport[1]]
            : null;
        const maxRenderbufferSize: number = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) ?? null;
        const maxCombinedTextureUnits: number =
            gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) ?? null;

        // Shader precision formats — expose floating-point implementation details.
        const precisionParts: string[] = [];
        try {
            const vHighFloat = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
            const fHighFloat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
            const vHighInt = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_INT);
            if (vHighFloat) {
                precisionParts.push(`v_hf:${vHighFloat.rangeMin},${vHighFloat.rangeMax},${vHighFloat.precision}`);
            }
            if (fHighFloat) {
                precisionParts.push(`f_hf:${fHighFloat.rangeMin},${fHighFloat.rangeMax},${fHighFloat.precision}`);
            }
            if (vHighInt) {
                precisionParts.push(`v_hi:${vHighInt.rangeMin},${vHighInt.rangeMax},${vHighInt.precision}`);
            }
        } catch { /* precision queries not critical */ }

        // Combine limits + precision into a single hash.
        const precisionInput = [
            `maxTexture:${maxTextureSize}`,
            `maxViewport:${maxViewportDims?.join('x')}`,
            `maxRBO:${maxRenderbufferSize}`,
            `maxCombTexUnits:${maxCombinedTextureUnits}`,
            ...precisionParts,
        ].join('|');
        const precisionHash = await sha256(precisionInput);

        // Supported extensions — sorted for stability, then hashed.
        const exts: string[] = gl.getSupportedExtensions() ?? [];
        exts.sort();
        const extensionsHash = await sha256(exts.join(','));

        return {
            supported: true,
            maxTextureSize,
            maxViewportDims,
            precisionHash,
            extensionsHash,
            renderer,
            vendor,
        };
    } catch (e) {
        StructuredLogger.warn('getEnhancedWebGL2Info', 'WebGL2 info collection failed', e);
        return null;
    }
}

// ─── Spoofing / Headless Detection ───────────────────────────────────────────

/**
 * Detects signals that indicate a headless browser, automation framework, or
 * active anti-fingerprinting extension.
 *
 * The check categories:
 *
 *  **Headless signals** — properties that headless Chromium/Puppeteer/Playwright
 *    typically expose but are absent in real user agents:
 *    - Missing `window.chrome` in a Blink-based UA
 *    - `navigator.webdriver === true`
 *    - `navigator.pdfViewerEnabled === false` (headless Chromium default)
 *    - Notification permission is `denied` without a real prompt
 *    - `screen.height === screen.availHeight` (no system taskbar)
 *    - `visualViewport` dimensions match `screen` exactly
 *    - SwiftShader or LLVMpipe renderer (software rendering, no GPU)
 *    - `userAgentData.platform` is an empty string
 *
 *  **Anti-fingerprint signals** — indicate a tool is actively modifying APIs:
 *    - `navigator.languages` is empty or blocked
 *    - `navigator.plugins.length === 0` in a Blink-based UA
 *    - `navigator.mimeTypes.length === 0` in a Blink-based UA
 *
 * Each detected signal is appended to the `signals` array.  A weighted score
 * is computed; signals most diagnostic of headless environments are weighted
 * higher than weak indicators.
 */
export function detectSpoofing(): SpoofingInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return { likelyHeadless: false, signals: [], score: 0 };
    }

    const signals: string[] = [];
    const win = window as any;
    const ua = navigator.userAgent ?? '';
    const isBlink = ua.includes('Chrome') || ua.includes('Chromium');

    // ── High-confidence headless indicators ──────────────────────────────────

    // Real Chrome always exposes window.chrome; headless Chromium omits it.
    if (isBlink && !win.chrome) {
        signals.push('headless:no-chrome-object');
    }

    // navigator.webdriver is true in WebDriver-controlled browsers.
    if (navigator.webdriver === true) {
        signals.push('headless:webdriver-true');
    }

    // pdfViewerEnabled defaults to false in headless Chromium.
    if ('pdfViewerEnabled' in navigator && (navigator as any).pdfViewerEnabled === false) {
        signals.push('headless:pdf-viewer-disabled');
    }

    // SwiftShader / LLVMpipe indicates software rendering (no physical GPU).
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (canvas) {
        try {
            const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
            if (gl) {
                const dbg = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
                if (dbg) {
                    const renderer: string = (gl as WebGLRenderingContext).getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '';
                    if (/SwiftShader|llvmpipe|softpipe/i.test(renderer)) {
                        signals.push('headless:software-renderer');
                    }
                }
            }
        } catch { /* ignore */ }
    }

    // ── Medium-confidence headless indicators ─────────────────────────────────

    // No taskbar: available screen dimensions match total screen dimensions.
    if (
        typeof screen !== 'undefined' &&
        screen.height > 0 &&
        screen.height === screen.availHeight &&
        screen.width === screen.availWidth
    ) {
        signals.push('headless:no-taskbar');
    }

    // visualViewport matching screen exactly is rare in real browsers.
    if (
        'visualViewport' in window &&
        (win.visualViewport?.width === screen.width ||
         win.visualViewport?.height === screen.height)
    ) {
        signals.push('headless:viewport-matches-screen');
    }

    // userAgentData.platform being empty is a headless Chromium quirk.
    if (
        'userAgentData' in navigator &&
        (navigator.userAgentData?.brands !== undefined) &&
        (navigator as any).userAgentData?.platform === ''
    ) {
        signals.push('headless:blank-ua-data-platform');
    }

    // Notification permission denied without user interaction is a headless pattern.
    if (
        'Notification' in window &&
        (window as any).Notification?.permission === 'denied' &&
        isBlink
    ) {
        signals.push('headless:notification-denied');
    }

    // ── Anti-fingerprint signals ───────────────────────────────────────────────

    // Missing languages indicates a spoofed or headless navigator.
    if (!navigator.languages || navigator.languages.length === 0) {
        signals.push('antifp:missing-languages');
    }

    // Blink browsers always have plugins; an empty list suggests automation.
    if (isBlink && navigator.plugins && navigator.plugins.length === 0) {
        signals.push('antifp:no-plugins-in-chrome');
    }

    // Blink browsers always expose MIME types; empty list suggests automation.
    if (isBlink && navigator.mimeTypes && navigator.mimeTypes.length === 0) {
        signals.push('antifp:no-mimetypes-in-chrome');
    }

    // ── Score computation ─────────────────────────────────────────────────────

    const WEIGHTS: Record<string, number> = {
        'headless:no-chrome-object': 0.30,
        'headless:webdriver-true': 0.30,
        'headless:pdf-viewer-disabled': 0.20,
        'headless:software-renderer': 0.25,
        'headless:no-taskbar': 0.15,
        'headless:viewport-matches-screen': 0.10,
        'headless:blank-ua-data-platform': 0.20,
        'headless:notification-denied': 0.15,
        'antifp:missing-languages': 0.15,
        'antifp:no-plugins-in-chrome': 0.20,
        'antifp:no-mimetypes-in-chrome': 0.20,
    };

    let score = 0;
    for (const signal of signals) {
        score += WEIGHTS[signal] ?? 0.05;
    }
    score = Math.min(1.0, score);

    return {
        likelyHeadless: score >= 0.3,
        signals,
        score,
    };
}

// ─── Entropy scoring ─────────────────────────────────────────────────────────

/**
 * Returns a rough estimate of how much entropy each collected signal
 * contributes to the overall fingerprint.
 *
 * Entropy estimates are based on empirically observed variation across a
 * large population of real browsers (order-of-magnitude approximations).
 *
 * @param enhanced - The collected EnhancedFingerprintInfo object.
 * @returns A map from signal name to estimated bits of entropy.
 */
export function computeEntropyScores(
    enhanced: EnhancedFingerprintInfo,
): Record<string, number> {
    const scores: Record<string, number> = {};

    // audio_v2: OfflineAudioContext output varies by platform + driver (~8-12 bits).
    scores.audio_v2 = enhanced.audio_v2?.sampleHash != null ? 10 : 0;

    // canvas_v2: GPU-rendered pixels, high entropy but partially homogenised
    // by privacy tools (~12-18 bits after stabilisation).
    scores.canvas_v2 = enhanced.canvas_v2?.pixelHash != null ? 15 : 0;

    // webgl2: hardware limit + precision combination (~8-14 bits).
    scores.webgl2 = enhanced.webgl2?.supported
        ? (enhanced.webgl2.precisionHash ? 8 : 4) + (enhanced.webgl2.extensionsHash ? 6 : 0)
        : 0;

    // spoofing signals reduce effective entropy when triggered.
    scores.spoofing_penalty = -(enhanced.spoofing.score * 5);

    return scores;
}

// ─── Aggregate collector ─────────────────────────────────────────────────────

/**
 * Collects all enhanced fingerprint signals in parallel and returns the
 * complete `EnhancedFingerprintInfo` object.
 *
 * This is the primary entry point called from `getSystemInfo`.
 */
export async function collectEnhancedFingerprint(): Promise<EnhancedFingerprintInfo> {
    // Collect audio, canvas, and WebGL2 in parallel for performance.
    const [audio_v2, canvas_v2, webgl2] = await Promise.all([
        getEnhancedAudioFingerprint(),
        getEnhancedCanvasFingerprint(),
        getEnhancedWebGL2Info(),
    ]);

    // Spoofing detection is synchronous — no async API calls needed.
    const spoofing = detectSpoofing();

    const info: EnhancedFingerprintInfo = {
        audio_v2,
        canvas_v2,
        webgl2,
        spoofing,
        fp_version: FP_VERSION,
    };

    return {
        ...info,
        entropy: computeEntropyScores(info),
    };
}
