import { SystemInfo } from './types';

export function generateJSON(ipInfo: any, geolocationInfo: any, systemInfo: SystemInfo) {
    return {
        systemInfo: {
            ...systemInfo // Simply spread all properties
        }
    };
}

// export { generateJSON };


interface IpInfo {
    ip: string;
    network: string;
    version: string;
    city: string;
    region: string;
    region_code: string;
    country: string;
    country_name: string;
    country_code: string;
    country_code_iso3: string;
    country_capital: string;
    country_tld: string;
    continent_code: string;
    in_eu: boolean;
    postal: string;
    latitude: number;
    longitude: number;
    timezone: string;
    utc_offset: string;
    country_calling_code: string;
    currency: string;
    currency_name: string;
    languages: string[];
    country_area: number;
    country_population: number;
    asn: string;
    org: string;
}

interface GeolocationInfo {
    ip: string;
    country_code: string;
    country_name: string;
    region_code: string;
    region_name: string;
    city: string;
    zip_code: string;
    time_zone: string;
    latitude: number;
    longitude: number;
    metro_code: number;
}

interface SystemInfo {
    incognito: boolean;
    userAgent: string;
    platform: string;
    languages: string[];
    cookiesEnabled: boolean;
    doNotTrack: string;
    screenResolution: string;
    colorDepth: number;
    colorGamut: string;
    hardwareConcurrency: number;
    deviceMemory: number;
    audio: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    webGL: boolean;
    canvas: boolean;
    plugins: string[];
    timezone: string;
    touchSupport: boolean;
    vendor: string;
    vendorFlavors: string[];
    mathConstants: string[];
    fontPreferences: string[];
}