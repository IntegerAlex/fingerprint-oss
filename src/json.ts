/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import { SystemInfo } from './types.js';
import { GeolocationInfo } from './geo-ip.js';
import { generateId } from './hash.js';
import { getVpnStatus } from './vpn.js';
/**
 * Interpret a confidence score and return a human-readable description
 * @param score Confidence score between 0.1 and 0.9
 * @returns Object with interpretive confidence description
 */
function interpretConfidenceScore(score: number): {
    rating: string;
    description: string;
    reliability: string;
    level: 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';
} {
    if (score >= 0.8) {
        return {
            rating: "High Confidence",
            description: "The data appears to be from a genuine user with consistent information across all signals.",
            reliability: "Data is highly reliable for most purposes including fraud detection and analytics.",
            level: "high"
        };
    } else if (score >= 0.65) {
        return {
            rating: "Medium-High Confidence",
            description: "The data appears mostly consistent with some minor discrepancies.",
            reliability: "Data is generally reliable but may have some inconsistencies worth investigating.",
            level: "medium-high"
        };
    } else if (score >= 0.5) {
        return {
            rating: "Medium Confidence",
            description: "The data shows a moderate level of consistency, but with some concerning signals.",
            reliability: "Data should be treated with caution and verified through additional means.",
            level: "medium"
        };
    } else if (score >= 0.35) {
        return {
            rating: "Medium-Low Confidence",
            description: "The data shows significant inconsistencies that suggest possible fraud or spoofing.",
            reliability: "Data reliability is questionable and should not be trusted without verification.",
            level: "medium-low"
        };
    } else {
        return {
            rating: "Low Confidence",
            description: "The data exhibits strong signals of automation, spoofing, or intentional manipulation.",
            reliability: "Data is highly unreliable and shows strong indications of non-human origin.",
            level: "low"
        };
    }
}

/**
 * Generates a structured JSON object combining geolocation data, system information, and confidence assessments.
 *
 * The returned object includes interpreted confidence scores for both the system and an optional combined assessment, details about potential network threats (such as proxies, VPNs, Tor, or hosting providers), geolocation information with VPN status, and a unique hash derived from the system information.
 *
 * @param geolocationInfo - Geolocation data for the user (can be null in test environments).
 * @param systemInfo - Information about the user's system, including confidence score and bot detection signals.
 * @param combinedConfidenceScore - An optional overall confidence score to be interpreted and included in the assessment.
 * @returns An object containing confidence assessments, geolocation details (with VPN status), system information, and a unique hash.
 */
export async function generateJSON(
    geolocationInfo: GeolocationInfo | null, 
    systemInfo: SystemInfo, 
    combinedConfidenceScore?: number
) {
    // Get interpretations for confidence scores
    const systemConfidenceInterpretation = interpretConfidenceScore(systemInfo.confidenceScore);
    const combinedConfidenceInterpretation = combinedConfidenceScore ? 
        interpretConfidenceScore(combinedConfidenceScore) : 
        { rating: '', description: '', reliability: '', level: 'medium' as const };

    // Extract proxy-related flags from traits (handle null geolocation)
    const isProxy = geolocationInfo?.traits?.isAnonymousProxy || false;
    const isVpn = geolocationInfo?.traits?.isAnonymousVpn || false;
    const isHosting = geolocationInfo?.traits?.isHostingProvider || false;
    const isTor = geolocationInfo?.traits?.isTorExitNode || false;
    const vpnStatus = geolocationInfo ? await getVpnStatus({
      geoip: geolocationInfo.location?.timeZone || 'UTC',
      localtime: systemInfo?.timezone || 'UTC'
    }) : undefined;
    
    return {
        // Confidence assessments at the top of the returned object
        confidenceAssessment: {
            system: {
                score: systemInfo.confidenceScore,
                ...systemConfidenceInterpretation,
                factors: systemInfo?.bot?.isBot ? 
                    `Bot signals detected: ${systemInfo.bot.signals?.join(', ') || 'unknown signals'}` : 
                    'No bot signals detected'
            },
            ...(combinedConfidenceScore ? {
                combined: {
                    score: combinedConfidenceScore,
                    ...combinedConfidenceInterpretation,
                    factors: [
                        isProxy ? 'Proxy detected' : null,
                        isTor ? 'Tor exit node detected' : null,
                        isHosting ? 'Hosting provider detected' : null,
                        isVpn ? 'VPN detected' : null
                    ].filter(Boolean).join(', ') || 'No suspicious network factors detected'
                }
            } : {})
        },
        
        // Geolocation information
        geolocation: geolocationInfo ? {
	    vpnStatus,
            ip: geolocationInfo.ipAddress || geolocationInfo.ipv4 || 'unknown', // Primary IP (IPv4 for backward compatibility)
            ipv4: geolocationInfo.ipv4 || null, // IPv4 address (guaranteed, null if unavailable)
            ipv6: geolocationInfo.ipv6 || null, // IPv6 address (null if not available)
            city: geolocationInfo.city?.name || 'unknown',
            region: geolocationInfo.subdivisions?.[0] || { isoCode: '', name: '' },
            country: geolocationInfo.country || { isoCode: '', name: '' },
            continent: geolocationInfo.continent || { code: '', name: '' },
            location: geolocationInfo.location || { accuracyRadius: 0, latitude: 0, longitude: 0, timeZone: 'UTC' },
            traits: {
                isAnonymous: geolocationInfo.traits?.isAnonymous || false,
                isAnonymousProxy: geolocationInfo.traits?.isAnonymousProxy || false,
                isAnonymousVpn: geolocationInfo.traits?.isAnonymousVpn || false,
                network: geolocationInfo.traits?.network || 'unknown'
            }
        } : null,
        
        // System information
        systemInfo ,
	hash: await generateId(systemInfo),
    };
}

// // Updated interfaces
// export interface GeolocationInfo {
//     ipAddress: string;
//     country: {
//         isoCode: string;
//         name: string;
//     };
//     registeredCountry: {
//         isoCode: string;
//         name: string;
//         isInEuropeanUnion?: boolean;
//     };
//     city: {
//         name: string;
//         geonameId: number;
//     };
//     continent: {
//         code: string;
//         name: string;
//     };
//     subdivisions: Array<{
//         isoCode: string;
//         name: string;
//     }>;
//     location: {
//         accuracyRadius: number;
//         latitude: number;
//         longitude: number;
//         timeZone: string;
//     };
//     postal: {
//         code: string;
//     };
//     traits: {
//         isAnonymous: boolean;
//         isAnonymousProxy: boolean;
//         isAnonymousVpn: boolean;
//         isAnycast: boolean;
//         isHostingProvider: boolean;
//         isLegitimateProxy: boolean;
//         isPublicProxy: boolean;
//         isResidentialProxy: boolean;
//         isSatelliteProvider: boolean;
//         isTorExitNode: boolean;
//         ipAddress: string;
//         network: string;
//     };
// }

// export interface SystemInfo {
//     incognito: boolean;
//     userAgent: string;
//     platform: string;
//     languages: string[];
//     cookiesEnabled: boolean;
//     doNotTrack: string;
//     screenResolution: string;
//     colorDepth: number;
//     colorGamut: string;
//     hardwareConcurrency: number;
//     deviceMemory: number;
//     audio: boolean;
//     localStorage: boolean;
//     sessionStorage: boolean;
//     indexedDB: boolean;
//     webGL: boolean;
//     canvas: boolean;
//     plugins: string[];
//     timezone: string;
//     touchSupport: boolean;
//     vendor: string;
//     vendorFlavors: string[];
//     mathConstants: string[];
//     fontPreferences: string[];
// }

