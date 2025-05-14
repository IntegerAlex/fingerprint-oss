/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
// Implement previously undefined functions from original code
export function getLanguageConsistency(language: string, country: string): number {
    // Expanded but simplified language-country mapping
    const langMap: Record<string, string[]> = {
        'US': ['en', 'es'],
        'GB': ['en'],
        'FR': ['fr'],
        'DE': ['de'],
        'CN': ['zh'],
        'JP': ['ja'],
        'RU': ['ru'],
        'IN': ['hi', 'en'],
        // Add more country codes as needed
    };

    const primaryLang = language.split('-')[0].toLowerCase();
    const countryCode = country.toUpperCase();
    
    if (!langMap[countryCode]) return 0; // Unknown country
    return langMap[countryCode].includes(primaryLang) ? 0.15 : -0.1;
}

export function isRiskyASN(asn: string): boolean {
    // Simplified ASN risk check
    const riskyASNs = [
        'AS14061', // DigitalOcean
        'AS16276', // OVH
        'AS16509', // Amazon AWS
        'AS14618', // Amazon AWS
        'AS3356',  // Level3
        'AS9009',  // M247
        'AS24940', // Hetzner
        'AS48666'  // NETASSIST
    ];
    return riskyASNs.includes(asn);
}

export function getUAPlatformMismatch(ua: string, platform: string): number {
    // Detect obvious mismatches between UA and platform
    const uaLower = ua.toLowerCase();
    const platformLower = platform.toLowerCase();

    const mobileUA = uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone');
    const mobilePlatform = platformLower.includes('arm') || platformLower.includes('iphone') || platformLower.includes('android');

    if (mobileUA !== mobilePlatform) return 0.2;
    
    // Check OS consistency
    const osMismatches = [
        { ua: 'windows', platform: 'win' },
        { ua: 'mac', platform: 'mac' },
        { ua: 'linux', platform: 'linux' }
    ];

    return osMismatches.some(os => 
        uaLower.includes(os.ua) && !platformLower.includes(os.platform)
    ) ? 0.15 : 0;
}

// Modified browser consistency check using existing system info
export function checkBrowserConsistency(systemInfo: any): number {
    let inconsistencies = 0;
    
    // Screen resolution vs viewport
    if (systemInfo.screenResolution && systemInfo.viewportSize) {
        const [screenW, screenH] = systemInfo.screenResolution;
        const [viewW, viewH] = systemInfo.viewportSize;
        if (viewW > screenW || viewH > screenH) inconsistencies++;
    }

    // Device memory vs hardware concurrency
    if (systemInfo.deviceMemory && systemInfo.hardwareConcurrency) {
        if (systemInfo.deviceMemory < 2 && systemInfo.hardwareConcurrency > 4) inconsistencies++;
        if (systemInfo.deviceMemory > 8 && systemInfo.hardwareConcurrency < 4) inconsistencies++;
    }

    return Math.max(-0.3, Math.min(0.3, -inconsistencies * 0.1));
}

