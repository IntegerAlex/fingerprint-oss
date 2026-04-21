/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import type { DeviceTypeInfo } from './deviceType.js';

// Add WebKit FileSystem types
declare global {
 interface Navigator {
        brave?: {
            isBrave: () => Promise<boolean>;
        };
        userAgentData?: {
            brands: Array<{
                brand: string;
                version: string;
            }>;
        };
    }

    interface Window {
        webkitRequestFileSystem?: any;
        TEMPORARY?: number;
        TouchEvent?: any;
        AudioContext?: any;
        webkitAudioContext?: any;
        brave?: {
            isBrave: () => Promise<boolean>;
        };
    }

    interface Plugin {
        readonly name: string;
        readonly description: string;
        mimeTypes?: any;
    }
    interface MimeType {
        readonly type: string;
        readonly suffixes: string;
    }

}

export interface BraveInfo {
    userAgentData: {
        brands: Array<{
            brand: string;
            version: string;
        }>;
    };
    userAgent: string;
    brands: string[];
}

export interface SystemInfo {	
    incognito: { isPrivate: boolean; browserName: string }; 
    bot: {
        isBot: boolean;
        signals: string[];
        confidence: number;
    };
    browser: { name?: string; version?: string };
    userAgent: string;
    platform: string;
    languages: string[];
    cookiesEnabled: boolean;
    doNotTrack: string | null;
    screenResolution: [number, number];
    colorDepth: number;
    colorGamut: string;
    hardwareConcurrency: number;
    deviceMemory: number | undefined;
    os: { os:string; version:string;  };
    audio: number | null;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    webGL: WebGLInfo; // This will be Promise<WebGLInfo> at the point of collection
    canvas: CanvasInfo;
    plugins: PluginInfo[];
    timezone: string;
    touchSupport: {
        maxTouchPoints: number;
        touchEvent: boolean;
        touchStart: boolean;
    };
    vendor: string;
    vendorFlavors: string[];
    mathConstants: MathInfo;
    fontPreferences: FontPreferencesInfo; // Updated name
    deviceType: DeviceTypeInfo;
    confidenceScore: number;
    /** Enhanced fingerprint signals (optional, added in v1.0.0). */
    enhanced?: EnhancedFingerprintInfo;
}

// ─── Enhanced fingerprint types ───────────────────────────────────────────────

/**
 * Noise-resistant audio fingerprint collected via OfflineAudioContext.
 * Adds spoofing-detection fields unavailable in the baseline audio signal.
 */
export interface AudioEnhanced {
    /** Sum of absolute rendered sample values — implementation-specific. */
    sampleHash: number;
    /** Maximum output channel count reported by the audio context destination. */
    maxChannels: number;
    /** Channel count mode of the AnalyserNode (typically "max"). */
    channelCountMode: string;
    /** True when a mismatch between getChannelData and copyFromChannel is detected. */
    hasSpoofing: boolean;
    /** List of specific spoofing indicators detected. */
    spoofingSignals: string[];
}

/**
 * Noise-stabilised canvas fingerprint hash.
 * The same scene is rendered multiple times; the most common pixel value per
 * channel is selected before hashing, neutralising per-call noise injection.
 */
export interface CanvasEnhanced {
    /** SHA-256 of the stabilised pixel array. */
    pixelHash: string;
}

/**
 * Enhanced WebGL2 fingerprint with implementation limits and precision formats.
 * These signals are less frequently targeted by anti-fingerprint tools than
 * the basic vendor/renderer strings.
 */
export interface WebGL2Enhanced {
    /** Whether WebGL2 is available in the current context. */
    supported: boolean;
    /** GL_MAX_TEXTURE_SIZE — varies by GPU generation. */
    maxTextureSize: number | null;
    /** GL_MAX_VIEWPORT_DIMS [width, height] — varies by GPU. */
    maxViewportDims: [number, number] | null;
    /** SHA-256 of combined implementation limits and shader precision values. */
    precisionHash: string | null;
    /** SHA-256 of the sorted supported-extensions list. */
    extensionsHash: string | null;
    /** Unmasked renderer string (from WEBGL_debug_renderer_info, or fallback). */
    renderer: string;
    /** Unmasked vendor string. */
    vendor: string;
}

/**
 * Consolidated headless-browser and anti-fingerprint detection result.
 */
export interface SpoofingInfo {
    /** True when the combined signal score indicates a likely headless/automated browser. */
    likelyHeadless: boolean;
    /** Individual signals that triggered, e.g. "headless:no-chrome-object". */
    signals: string[];
    /** Weighted score in [0, 1]; higher means more spoofing indicators present. */
    score: number;
}

/**
 * Top-level container for all enhanced fingerprint signals.
 * Added as an optional field on SystemInfo to maintain backward compatibility.
 */
export interface EnhancedFingerprintInfo {
    /** Enhanced audio fingerprint (null when OfflineAudioContext is unavailable). */
    audio_v2: AudioEnhanced | null;
    /** Noise-stabilised canvas fingerprint (null when Canvas API is unavailable). */
    canvas_v2: CanvasEnhanced | null;
    /** WebGL2 implementation details (null on collection error). */
    webgl2: WebGL2Enhanced | null;
    /** Consolidated spoofing/headless detection result. */
    spoofing: SpoofingInfo;
    /** Version string identifying the enhanced signal set. */
    fp_version: string;
    /** Per-signal entropy estimates (bits). */
    entropy?: Record<string, number>;
}

export interface WebGLInfo {
    vendor: string;
    renderer: string;
    imageHash: string | null; // Added imageHash
}

export interface CanvasInfo {
    winding: boolean;
    geometry: string;
    text: string;
}

export interface MathInfo {
    acos: number;
    acosh: number;
    asinh: number;
    atanh: number;
    expm1: number;
    sinh: number;
    cosh: number;
    tanh: number;
}

// Renamed from FontInfo and structure changed
export interface FontPreferencesInfo {
    detectedFonts: string[];
}

// ... Add other interfaces for each feature ...

export interface TouchSupportInfo {
    maxTouchPoints: number;
    touchEvent: boolean;
    touchStart: boolean;
}

export interface MimeType {
    type: string;
    suffixes: string;
}

export interface PluginInfo {
    name: string;
    description: string;
    mimeTypes: MimeType[];
}

// Configuration system types for environment-aware logging
export type Environment = 'TEST' | 'DEV' | 'STAGING' | 'PROD';
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

export interface FingerprintConfig {
    environment: Environment;
    verbose: boolean;
    transparency: boolean;
    message?: string;
    logLevel: LogLevel;
    enableConsoleLogging: boolean;
    enablePerformanceLogging: boolean;
    geoTimeout: number;
}

export interface UserInfoConfig {
    // Legacy configuration options (for backward compatibility)
    transparency?: boolean;
    message?: string;
    
    // New environment-aware configuration options
    environment?: Environment;
    verbose?: boolean;
    logLevel?: LogLevel;
    enableConsoleLogging?: boolean;
    enablePerformanceLogging?: boolean;

    // Runtime controls
    geoTimeout?: number;
}

export interface ResolvedUserInfoConfig {
    environment: Environment;
    verbose: boolean;
    logLevel: LogLevel;
    enableConsoleLogging: boolean;
    enablePerformanceLogging: boolean;
    transparency: boolean;
    message?: string;
    geoTimeout: number;
}
