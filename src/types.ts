/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
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
    confidenceScore: number;
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
}
