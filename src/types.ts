// Add WebKit FileSystem types
declare global {
    interface Window {
        webkitRequestFileSystem?: any;
        TEMPORARY?: number;
        TouchEvent?: any;
        AudioContext?: any;
        webkitAudioContext?: any;
    }

    interface Plugin {
        name: string;
        description: string;
        mimeTypes?: any;
    }

    interface MimeType {
        type: string;
        suffixes: string;
    }
}

export interface SystemInfo {
    userAgent: string;
    platform: string;
    languages: string[];
    cookiesEnabled: boolean;
    doNotTrack: string | null;
    screenResolution: [number, number];
    colorDepth: number;
    colorGamut: string;
    hardwareConcurrency: number;
    deviceMemory: number;
    audio: number;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    webGL: WebGLInfo;
    canvas: CanvasInfo;
    plugins: PluginInfo[];
    timezone: string;
    touchSupport: TouchSupportInfo;
    vendor: string;
    vendorFlavors: string[];
    mathConstants: MathInfo;
    fontPreferences: FontInfo;
    incognito: boolean;
}

export interface WebGLInfo {
    vendor: string;
    renderer: string;
}

export interface CanvasInfo {
    winding: boolean;
    geometry: string;
    text: string;
}

export interface PluginInfo {
    name: string;
    description: string;
    mimeTypes: MimeTypeInfo[];
}

export interface MimeTypeInfo {
    type: string;
    suffixes: string;
}

// ... Add other interfaces for each feature ...

export interface TouchSupportInfo {
    maxTouchPoints: number;
    touchEvent: boolean;
    touchStart: boolean;
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

export interface FontInfo {
    fonts: Array<{
        name: string;
        width: number;
    }>;
} 