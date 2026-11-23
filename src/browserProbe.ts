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
 * Feature-first browser identification.
 *
 * User-Agent strings are increasingly useless for identity: Chrome freezes the
 * minor version, Safari and Firefox have frozen theirs, and anyone can spoof
 * the whole string. Feature presence is harder to fake consistently, so this
 * module answers "which browser engine is this, really?" and only falls back to
 * UA parsing in `browserDetection`.
 *
 * Every probe is guarded: running in Node or against a hostile `window` yields
 * `unknown` rather than an exception.
 */

export type BrowserFamily =
    | 'brave'
    | 'edge'
    | 'opera'
    | 'samsung'
    | 'chromium'
    | 'firefox'
    | 'safari'
    | 'unknown';

export type EngineFamily = 'blink' | 'gecko' | 'webkit' | 'unknown';

export interface BrowserProbe {
    family: BrowserFamily;
    engine: EngineFamily;
    /** Client Hints brand that produced the verdict, when one did. */
    brand?: string;
    /**
     * How the family was decided, so callers can weigh it:
     * `feature` beats `client-hints` beats `ua` beats `unknown`.
     */
    detectedBy: 'feature' | 'client-hints' | 'ua' | 'unknown';
}

/** Display names, matching Bowser's so the two sources can be compared. */
export const BROWSER_FAMILY_NAMES: Record<BrowserFamily, string> = {
    brave: 'Brave',
    edge: 'Microsoft Edge',
    opera: 'Opera',
    samsung: 'Samsung Internet',
    chromium: 'Chrome',
    firefox: 'Firefox',
    safari: 'Safari',
    unknown: 'Unknown',
};

const hasWindow = () => typeof window !== 'undefined';

/** Brands are only populated in Chromium, which makes them a reliable engine hint. */
function readBrands(): Array<{ brand: string; version: string }> {
    try {
        const brands = (navigator as any)?.userAgentData?.brands;
        return Array.isArray(brands) ? brands : [];
    } catch {
        return [];
    }
}

function hasBraveGlobal(): boolean {
    try {
        return typeof (navigator as any)?.brave?.isBrave === 'function';
    } catch {
        return false;
    }
}

function looksLikeFirefox(): boolean {
    try {
        // Gecko-only: Chrome exposes no mozInnerScreenX.
        return typeof (window as any).mozInnerScreenX === 'number';
    } catch {
        return false;
    }
}

function looksLikeSafari(): boolean {
    if (!hasWindow()) return false;
    try {
        const win = window as any;
        // Safari-only DOM binding; removed from Blink years ago.
        const safariOnlyApi = typeof win.webkitConvertPointFromNodeToPage === 'function';
        const isBlink = typeof win.chrome === 'object' && win.chrome !== null;
        return safariOnlyApi && !isBlink;
    } catch {
        return false;
    }
}

/** Ordered from most to least specific: Edge and Opera both claim Chrome. */
const BRAND_FAMILIES: Array<[string, BrowserFamily]> = [
    ['Microsoft Edge', 'edge'],
    ['Opera', 'opera'],
    ['Samsung Internet', 'samsung'],
    ['Brave', 'brave'],
    ['Google Chrome', 'chromium'],
    ['Chromium', 'chromium'],
];

function familyFromBrands(brands: Array<{ brand: string }>): { family: BrowserFamily; brand?: string } {
    for (const [needle, family] of BRAND_FAMILIES) {
        const match = brands.find(entry => entry.brand.includes(needle));
        if (match) return { family, brand: match.brand };
    }
    return { family: 'unknown' };
}

/**
 * Identifies the browser from feature presence and Client Hints, without
 * trusting the User-Agent string.
 */
export function probeBrowser(): BrowserProbe {
    if (typeof navigator === 'undefined' && !hasWindow()) {
        return { family: 'unknown', engine: 'unknown', detectedBy: 'unknown' };
    }

    // Brave deliberately reports a Chrome UA and Chrome brands; only the
    // navigator.brave binding gives it away.
    if (hasBraveGlobal()) {
        return { family: 'brave', engine: 'blink', detectedBy: 'feature' };
    }

    if (looksLikeFirefox()) {
        return { family: 'firefox', engine: 'gecko', detectedBy: 'feature' };
    }

    const brands = readBrands();
    if (brands.length > 0) {
        const { family, brand } = familyFromBrands(brands);
        if (family !== 'unknown') {
            return { family, engine: 'blink', brand, detectedBy: 'client-hints' };
        }
        return { family: 'chromium', engine: 'blink', detectedBy: 'client-hints' };
    }

    if (looksLikeSafari()) {
        return { family: 'safari', engine: 'webkit', detectedBy: 'feature' };
    }

    return { family: 'unknown', engine: 'unknown', detectedBy: 'unknown' };
}
