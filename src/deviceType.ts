/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

import Bowser from './bowser/bowser.js';
import { StructuredLogger } from './config.js';

/**
 * Represents a single detection signal used in device type classification.
 */
export interface DeviceTypeSignal {
    name: string;
    value: any;
    weight: number;
    detected: boolean;
}

/**
 * Result of multi-signal device type detection.
 */
export interface DeviceTypeInfo {
    type: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'unknown';
    confidence: number;
    signals: DeviceTypeSignal[];
    method: string;
}

// ── Weighted scores per device type ──
interface DeviceScores {
    mobile: number;
    tablet: number;
    desktop: number;
    tv: number;
}

/**
 * Detects the device type using a multi-signal fusion approach.
 *
 * Combines User-Agent Client Hints, Bowser UA parsing, screen characteristics,
 * touch/pointer analysis, CSS media queries, hardware patterns, behavioural
 * heuristics, and UA pattern fallback to produce a confident classification.
 *
 * @returns A DeviceTypeInfo object with the detected device type, confidence
 *          score, individual signals, and the primary detection method.
 */
export function detectDeviceType(): DeviceTypeInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return {
            type: 'unknown',
            confidence: 0.5,
            signals: [{ name: 'environment', value: 'non-browser', weight: 0, detected: true }],
            method: 'fallback'
        };
    }

    const scores: DeviceScores = { mobile: 0, tablet: 0, desktop: 0, tv: 0 };
    const signals: DeviceTypeSignal[] = [];
    const methods: string[] = [];

    try {
        // ─── Technique 1: User-Agent Client Hints (weight 0.40) ───
        collectClientHintsSignals(scores, signals, methods);

        // ─── Technique 2: Bowser platform detection (weight 0.25) ───
        collectBowserSignals(scores, signals, methods);

        // ─── Technique 3: Screen characteristics (weight 0.20) ───
        collectScreenSignals(scores, signals);

        // ─── Technique 4 & 5: Touch / Pointer / CSS media queries (weight 0.15) ───
        collectPointerAndTouchSignals(scores, signals);

        // ─── Technique 6: Hardware characteristics (weight 0.10) ───
        collectHardwareSignals(scores, signals);

        // ─── Technique 7: Behavioural heuristics (weight 0.10) ───
        collectBehaviouralSignals(scores, signals);

        // ─── Technique 8: UA pattern fallback (weight 0.05) ───
        collectUAPatternSignals(scores, signals);

        // ─── Edge-case overrides ───
        applyEdgeCaseOverrides(scores, signals);

    } catch (err) {
        StructuredLogger.warn('detectDeviceType', 'Error during detection', err);
    }

    // ── Determine winner ──
    const { type, confidence } = resolveDeviceType(scores, signals);

    return {
        type,
        confidence,
        signals,
        method: methods.length > 0 ? methods.join('+') : 'multiSignal'
    };
}

// ════════════════════════════════════════════════════════════════════════════
// Individual signal collectors
// ════════════════════════════════════════════════════════════════════════════

function collectClientHintsSignals(
    scores: DeviceScores,
    signals: DeviceTypeSignal[],
    methods: string[]
): void {
    const nav = navigator as any;
    if (!nav.userAgentData) return;

    const isMobile = nav.userAgentData.mobile;
    if (typeof isMobile === 'boolean') {
        methods.push('clientHints');
        signals.push({ name: 'clientHints.mobile', value: isMobile, weight: 0.40, detected: true });
        if (isMobile) {
            scores.mobile += 0.40;
        } else {
            scores.desktop += 0.30;
            scores.tablet += 0.05;  // tablets can report mobile=false
        }
    }

    const platform = nav.userAgentData.platform;
    if (typeof platform === 'string') {
        const p = platform.toLowerCase();
        signals.push({ name: 'clientHints.platform', value: platform, weight: 0.10, detected: true });
        if (p === 'android') {
            scores.mobile += 0.05;
            scores.tablet += 0.05;
        } else if (p === 'ios') {
            scores.mobile += 0.05;
            scores.tablet += 0.03;
        } else if (['windows', 'macos', 'linux', 'chromeos'].includes(p)) {
            scores.desktop += 0.10;
        }
    }
}

function collectBowserSignals(
    scores: DeviceScores,
    signals: DeviceTypeSignal[],
    methods: string[]
): void {
    try {
        const parsed = Bowser.parse(navigator.userAgent);
        const platformType = parsed.platform?.type;
        if (platformType) {
            methods.push('bowser');
            signals.push({ name: 'bowser.platformType', value: platformType, weight: 0.25, detected: true });
            switch (platformType) {
                case 'mobile':  scores.mobile  += 0.25; break;
                case 'tablet':  scores.tablet  += 0.25; break;
                case 'desktop': scores.desktop += 0.25; break;
                case 'tv':      scores.tv      += 0.25; break;
            }
        }
    } catch {
        signals.push({ name: 'bowser.platformType', value: null, weight: 0.25, detected: false });
    }
}

function collectScreenSignals(scores: DeviceScores, signals: DeviceTypeSignal[]): void {
    const w = window.screen?.width  ?? 0;
    const h = window.screen?.height ?? 0;
    const dpr = window.devicePixelRatio ?? 1;
    const minDim = Math.min(w, h);
    const maxDim = Math.max(w, h);

    // Device pixel ratio
    signals.push({ name: 'screen.devicePixelRatio', value: dpr, weight: 0.05, detected: true });
    if (dpr >= 2.5) {
        scores.mobile += 0.05;
    } else if (dpr >= 1.5 && dpr < 2.5) {
        scores.tablet += 0.02;
        scores.mobile += 0.02;
    } else {
        scores.desktop += 0.03;
    }

    // CSS pixel resolution bucket
    signals.push({ name: 'screen.resolution', value: [w, h], weight: 0.10, detected: true });
    if (minDim <= 480) {
        scores.mobile += 0.10;
    } else if (minDim <= 820 && maxDim <= 1400) {
        scores.tablet += 0.08;
        scores.mobile += 0.02;
    } else if (maxDim >= 3840) {
        // 4K+ screen — likely TV or high-res desktop
        scores.tv      += 0.04;
        scores.desktop += 0.06;
    } else {
        scores.desktop += 0.10;
    }

    // Aspect ratio analysis
    const aspect = maxDim / (minDim || 1);
    signals.push({ name: 'screen.aspectRatio', value: parseFloat(aspect.toFixed(2)), weight: 0.05, detected: true });
    if (aspect >= 1.9) {
        // Tall/narrow — modern phone
        scores.mobile += 0.05;
    } else if (aspect >= 1.2 && aspect < 1.5) {
        // Squarish — tablet territory
        scores.tablet += 0.04;
    } else {
        scores.desktop += 0.03;
    }
}

function collectPointerAndTouchSignals(scores: DeviceScores, signals: DeviceTypeSignal[]): void {
    const touchPoints = navigator.maxTouchPoints ?? 0;
    signals.push({ name: 'touch.maxTouchPoints', value: touchPoints, weight: 0.05, detected: true });

    const hasTouchEvent = 'ontouchstart' in window || !!(window as any).TouchEvent;
    signals.push({ name: 'touch.hasTouchEvent', value: hasTouchEvent, weight: 0.03, detected: hasTouchEvent });

    // CSS pointer/hover media queries
    const mm = window.matchMedia;
    if (mm) {
        const pointerCoarse   = mm('(pointer: coarse)').matches;
        const pointerFine     = mm('(pointer: fine)').matches;
        const hoverHover      = mm('(hover: hover)').matches;
        const hoverNone       = mm('(hover: none)').matches;
        const anyPointerCoarse = mm('(any-pointer: coarse)').matches;
        const anyPointerFine   = mm('(any-pointer: fine)').matches;

        signals.push({ name: 'css.pointerCoarse',    value: pointerCoarse,    weight: 0.04, detected: pointerCoarse });
        signals.push({ name: 'css.pointerFine',      value: pointerFine,      weight: 0.04, detected: pointerFine });
        signals.push({ name: 'css.hoverHover',       value: hoverHover,       weight: 0.04, detected: hoverHover });
        signals.push({ name: 'css.hoverNone',        value: hoverNone,        weight: 0.04, detected: hoverNone });
        signals.push({ name: 'css.anyPointerCoarse', value: anyPointerCoarse, weight: 0.02, detected: anyPointerCoarse });
        signals.push({ name: 'css.anyPointerFine',   value: anyPointerFine,   weight: 0.02, detected: anyPointerFine });

        // Pure touch device (coarse pointer, no hover)
        if (pointerCoarse && !pointerFine && hoverNone) {
            scores.mobile += 0.10;
            scores.tablet += 0.05;
        }
        // Mouse/trackpad primary, touch secondary (hybrid laptop)
        else if (pointerFine && anyPointerCoarse) {
            scores.desktop += 0.10;
        }
        // Mouse only, no touch at all
        else if (pointerFine && !anyPointerCoarse && hoverHover) {
            scores.desktop += 0.12;
        }
    }

    // Touch point count heuristic
    if (touchPoints === 0 && !hasTouchEvent) {
        scores.desktop += 0.05;
    } else if (touchPoints >= 1 && touchPoints <= 5) {
        scores.mobile += 0.03;
        scores.tablet += 0.03;
    } else if (touchPoints > 5) {
        scores.tablet += 0.04;
        scores.mobile += 0.02;
    }
}

function collectHardwareSignals(scores: DeviceScores, signals: DeviceTypeSignal[]): void {
    const memory = (navigator as any).deviceMemory;
    const cores  = navigator.hardwareConcurrency ?? 0;

    if (typeof memory === 'number') {
        signals.push({ name: 'hw.deviceMemory', value: memory, weight: 0.05, detected: true });
        if (memory <= 2) {
            scores.mobile += 0.04;
        } else if (memory <= 4) {
            scores.mobile += 0.02;
            scores.tablet += 0.02;
        } else if (memory >= 8) {
            scores.desktop += 0.04;
        }
    }

    if (cores > 0) {
        signals.push({ name: 'hw.cores', value: cores, weight: 0.05, detected: true });
        if (cores <= 4) {
            scores.mobile += 0.02;
        } else if (cores >= 12) {
            scores.desktop += 0.04;
        }
    }
}

function collectBehaviouralSignals(scores: DeviceScores, signals: DeviceTypeSignal[]): void {
    // Viewport vs screen size: on mobile the viewport usually matches the screen
    const viewW = window.innerWidth  ?? 0;
    const viewH = window.innerHeight ?? 0;
    const screenW = window.screen?.width  ?? 0;
    const screenH = window.screen?.height ?? 0;

    const widthRatio = screenW > 0 ? viewW / screenW : 1;
    signals.push({ name: 'behaviour.viewportScreenRatio', value: parseFloat(widthRatio.toFixed(2)), weight: 0.04, detected: true });

    if (widthRatio >= 0.95) {
        // Viewport nearly fills screen — mobile/tablet full-screen browser
        scores.mobile += 0.03;
        scores.tablet += 0.02;
    } else if (widthRatio < 0.7) {
        // Viewport much smaller — windowed desktop browser
        scores.desktop += 0.05;
    }

    // Screen orientation API
    const orientation = (screen as any).orientation;
    if (orientation) {
        const oType = orientation.type as string || '';
        signals.push({ name: 'behaviour.orientationType', value: oType, weight: 0.03, detected: true });
        if (oType.startsWith('portrait')) {
            scores.mobile += 0.03;
            scores.tablet += 0.02;
        }
    }

    // Color scheme preference (informational, but correlated with OS)
    if (window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        signals.push({ name: 'behaviour.prefersDarkScheme', value: prefersDark, weight: 0.01, detected: true });
    }

    // Standalone display-mode (installed PWA / home-screen app)
    if (window.matchMedia) {
        const standalone = window.matchMedia('(display-mode: standalone)').matches;
        signals.push({ name: 'behaviour.standaloneMode', value: standalone, weight: 0.02, detected: standalone });
        if (standalone) {
            scores.mobile += 0.02;
        }
    }
}

function collectUAPatternSignals(scores: DeviceScores, signals: DeviceTypeSignal[]): void {
    const ua = navigator.userAgent.toLowerCase();

    // TV patterns
    const tvPatterns = ['smart-tv', 'smarttv', 'googletv', 'appletv', 'hbbtv', 'pov_tv',
                        'netcast.tv', 'philipstv', 'nettv', 'tizen', 'webos', 'vidaa',
                        'crkey', 'chromecast', 'firetv', 'fire tv', 'roku', 'viera', 'bravia'];
    for (const pat of tvPatterns) {
        if (ua.includes(pat)) {
            scores.tv += 0.15;
            signals.push({ name: `ua.tvPattern:${pat}`, value: true, weight: 0.05, detected: true });
            break; // one match is enough
        }
    }

    // Tablet patterns (before mobile — iPad, Android tablet, etc.)
    const tabletPatterns = ['ipad', 'tablet', 'kindle', 'silk', 'playbook', 'nexus 7',
                           'nexus 9', 'nexus 10', 'sm-t', 'gt-p', 'gt-n', 'lenovo tab'];
    for (const pat of tabletPatterns) {
        if (ua.includes(pat)) {
            scores.tablet += 0.05;
            signals.push({ name: `ua.tabletPattern:${pat}`, value: true, weight: 0.05, detected: true });
            break;
        }
    }

    // Mobile patterns
    const mobilePatterns = ['iphone', 'ipod', 'android', 'mobile', 'blackberry',
                           'windows phone', 'opera mini', 'opera mobi', 'iemobile'];
    for (const pat of mobilePatterns) {
        if (ua.includes(pat)) {
            // "android" without "mobile" often means tablet
            if (pat === 'android' && !ua.includes('mobile')) {
                scores.tablet += 0.03;
            } else {
                scores.mobile += 0.05;
            }
            signals.push({ name: `ua.mobilePattern:${pat}`, value: true, weight: 0.05, detected: true });
            break;
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// Edge-case overrides
// ════════════════════════════════════════════════════════════════════════════

function applyEdgeCaseOverrides(scores: DeviceScores, signals: DeviceTypeSignal[]): void {
    // Hybrid device override: if both fine pointer and coarse pointer detected,
    // but fine is primary (pointer:fine matches), lean towards desktop
    const fineSignal  = signals.find(s => s.name === 'css.pointerFine');
    const coarseSignal = signals.find(s => s.name === 'css.anyPointerCoarse');
    const hoverSignal  = signals.find(s => s.name === 'css.hoverHover');

    if (fineSignal?.detected && coarseSignal?.detected && hoverSignal?.detected) {
        // Touchscreen laptop / 2-in-1 → desktop
        scores.desktop += 0.05;
        signals.push({ name: 'override.hybridDevice', value: true, weight: 0.05, detected: true });
    }

    // iPad with desktop-class Safari (iPadOS 13+): reports as MacIntel
    const ua = navigator.userAgent.toLowerCase();
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        // Almost certainly an iPad pretending to be a Mac
        scores.tablet += 0.30;  // Strong boost to tablet instead of penalizing desktop
        signals.push({ name: 'override.iPadDesktopMode', value: true, weight: 0.30, detected: true });
    }

    // Android tablet: UA says Android but no "Mobile" token
    if (ua.includes('android') && !ua.includes('mobile') && navigator.maxTouchPoints > 0) {
        scores.tablet += 0.05;
        signals.push({ name: 'override.androidTablet', value: true, weight: 0.05, detected: true });
    }

    // Ensure scores remain non-negative (safeguard against future issues)
    scores.mobile  = Math.max(0, scores.mobile);
    scores.tablet  = Math.max(0, scores.tablet);
    scores.desktop = Math.max(0, scores.desktop);
    scores.tv      = Math.max(0, scores.tv);
}

// ════════════════════════════════════════════════════════════════════════════
// Resolution
// ════════════════════════════════════════════════════════════════════════════

function resolveDeviceType(
    scores: DeviceScores,
    signals: DeviceTypeSignal[]
): { type: DeviceTypeInfo['type']; confidence: number } {
    const entries = Object.entries(scores) as [DeviceTypeInfo['type'], number][];
    entries.sort((a, b) => b[1] - a[1]);

    const [topType, topScore] = entries[0];
    const [, runnerUp] = entries[1];

    // If scores are zero or negative, fallback to unknown
    if (topScore <= 0) {
        return { type: 'unknown', confidence: 0.3 };
    }

    // Total weight of signals that fired
    const totalWeight = signals
        .filter(s => s.detected)
        .reduce((sum, s) => sum + s.weight, 0);

    // Confidence = top score normalised against total weight, with margin penalty
    const margin = topScore - runnerUp;
    let confidence = totalWeight > 0
        ? Math.min(topScore / totalWeight, 1)
        : 0.5;

    // Reward clear winners; penalise close calls
    if (margin > 0.3) {
        confidence = Math.min(confidence + 0.05, 0.98);
    } else if (margin < 0.1) {
        confidence = Math.max(confidence - 0.10, 0.3);
    }

    // Clamp
    confidence = Math.max(0.1, Math.min(0.98, parseFloat(confidence.toFixed(2))));

    return { type: topType, confidence };
}
