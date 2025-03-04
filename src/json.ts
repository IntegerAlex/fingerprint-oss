import { SystemInfo } from './types.js';
import { GeolocationInfo } from './geo-ip.js';

export function generateJSON(geolocationInfo: GeolocationInfo | null, systemInfo: SystemInfo) {
    return {
        geolocation: geolocationInfo ? {
            ip: geolocationInfo.ipAddress,
            city: geolocationInfo.city?.name || '',
            region: geolocationInfo.subdivisions?.[0] || { isoCode: '', name: '' },
            country: geolocationInfo.country || { isoCode: '', name: '' },
            continent: geolocationInfo.continent || { code: '', name: '' },
            location: geolocationInfo.location || { 
                accuracyRadius: 0,
                latitude: 0,
                longitude: 0,
                timeZone: ''
            },
            traits: geolocationInfo.traits || {
                isAnonymous: false,
                isAnonymousProxy: false,
                isAnonymousVpn: false,
                network: ''
            }
        } : null,
        systemInfo: {
            ...systemInfo
        }
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

