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
import type { FingerprintWarning } from './errors.js';

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

/** Version of the SystemInfo shape. Bumped when a field changes shape. */
export const OUTPUT_VERSION = '1';

export interface SystemInfo {	
    incognito: { isPrivate: boolean; browserName: string }; 
    bot: {
        isBot: boolean;
        signals: string[];
        confidence: number;
    };
    /**
     * Fused agent/automation verdict (added in 0.12.0). `bot` is kept as-is for
     * backward compatibility; new code should read this instead.
     */
    agentAssessment?: AgentAssessment;
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
    /**
     * Schema version of this object; see dist/systeminfo.schema.json.
     * Optional in the type so hand-built SystemInfo objects keep compiling,
     * but always populated by getSystemInfo().
     */
    outputVersion?: string;
    /**
     * Present only when a collector failed and its fallback was used, e.g. a
     * blocked WebGL context. Absent on a fully successful collection.
     */
    warnings?: FingerprintWarning[];
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
    sampleSum: number;
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
 * Verdicts produced by `assessAgent()`. `human` means "no automation evidence",
 * not proof; `declaredBy` is only set when the User-Agent claimed the identity.
 */
export type AgentVerdict = 'human' | 'crawler' | 'agent' | 'assistant' | 'automation' | 'unknown';

export interface AgentAssessment {
    verdict: AgentVerdict;
    /** 0..1. Declared-only verdicts stay below 0.7; automation evidence scores higher. */
    confidence: number;
    /** Present when the User-Agent declared the identity (unverified). */
    declaredBy?: 'user-agent';
    /** Named evidence, e.g. `automation:botd:headless_chrome`, `declared:user-agent:...`. */
    signals: string[];
}

/**
 * Top-level container for all enhanced fingerprint signals.
 * Added as an optional field on SystemInfo to maintain backward compatibility.
 */
export interface EnhancedFingerprintInfo {
    /** Enhanced audio fingerprint (null when OfflineAudioContext is unavailable). */
    audioV2: AudioEnhanced | null;
    /** Noise-stabilised canvas fingerprint (null when Canvas API is unavailable). */
    canvasV2: CanvasEnhanced | null;
    /** WebGL2 implementation details (null on collection error). */
    webgl2: WebGL2Enhanced | null;
    /** Consolidated spoofing/headless detection result. */
    spoofing: SpoofingInfo;
    /** Version string identifying the enhanced signal set. */
    fpVersion: string;
    /** Per-signal entropy estimates (bits). */
    entropy?: Record<string, number>;
    /**
     * Low-cost signals added in 0.12.0. Deliberately kept out of the hash:
     * they are context, not identity. Any field can be null when the browser
     * refuses the underlying API.
     */
    optional?: OptionalSignalsInfo;
}

/**
 * CSS media-query preferences. Stable per device and OS theme, and a frequent
 * target for anti-fingerprinting extensions, which makes disagreement between
 * these values and the rest of the fingerprint informative.
 */
export interface DisplayPreferences {
    /** `active` | `none` */
    forcedColors: string | null;
    /** `more` | `less` | `custom` | `no-preference` */
    prefersContrast: string | null;
    /** `inverted` | `none` */
    invertedColors: string | null;
    /** `hw-monochrome` value, typically `0` or the grayscale bit depth */
    monochrome: string | null;
    /** `reduce` | `no-preference` */
    reducedMotion: string | null;
    /** `reduce` | `no-preference` */
    reducedTransparency: string | null;
    /** `high` | `standard` (video-dynamic-range) */
    hdr: string | null;
}

/** Everything below is optional context; null means "the browser refused". */
export interface OptionalSignalsInfo {
    display: DisplayPreferences;
    /** Window position offset: differs across multi-monitor setups. */
    screenFrame: { availLeft: number; availTop: number } | null;
    /** AudioContext.baseLatency in seconds — implementation-specific. */
    audioBaseLatency: number | null;
    /** ICU data varies by OS build; the formatted sample exposes it. */
    dateTimeLocale: {
        locale: string;
        calendar: string;
        numberingSystem: string;
        formatted: string;
    } | null;
    /** Installed speech voices, hashed (names only, never the raw list). */
    speechVoices: { count: number; voicesHash: string } | null;
    /** Permissions API statuses; inconsistent answers indicate tampering. */
    permissions: Record<string, string> | null;
    /**
     * User-Agent Client Hints high-entropy values (Chromium only). The
     * architecture/bitness pair is hard to spoof consistently with the UA, so
     * `uaArchitectureMismatch` doubles as a tamper signal.
     */
    clientHints: {
        platform: string | null;
        architecture: string | null;
        bitness: string | null;
        mobile: boolean | null;
        uaArchitectureMismatch: boolean | null;
    } | null;
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
    /** Custom https endpoint for geolocation lookups */
    geoEndpoint?: string;
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
    geoEndpoint?: string;
}
