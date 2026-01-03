/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import { StructuredLogger } from './config.js';

// DEPRECATED: PROXY_API_KEY is no longer used
// @deprecated PROXY_API_KEY - Authentication has been removed from the proxy server
const PROXY_API_KEY_DEPRECATED = 'tester';
const GEOIP_URL = 'https://fingerprint-proxy.gossorg.in/';

// Warn if GEOIP_URL is missing
if (!GEOIP_URL) {
    StructuredLogger.warn('geo-ip', 'GEOIP_URL environment variable is not set. Geolocation functionality may not work correctly.');
}

/**
 * Check if an IP address is IPv4 with proper octet validation
 */
function isIPv4(ip: string): boolean {
    if (!ip) return false;
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ipv4Regex.exec(ip);
    if (!match) return false;
    return match.slice(1, 5).every(octet => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
    });
}

/**
 * Check if an IP address is IPv6 with proper validation
 */
function isIPv6(ip: string): boolean {
    if (!ip) return false;
    // Exclude IPv4-mapped IPv6 addresses
    if (ip.startsWith('::ffff:')) return false;
    // Comprehensive IPv6 regex for various formats
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
    // Basic check: must contain colons and only valid hex chars/colons
    const basicIpv6Regex = /^[0-9a-fA-F:]+$/;
    return (ipv6Regex.test(ip) || (ip.includes(':') && basicIpv6Regex.test(ip)));
}

/**
 * Parse IP addresses from various sources and return structured IP info
 * Supports both old format (ipAddress in traits) and new format (ip, ipv4, ipv6 at root)
 */
function parseIPAddresses(data: any): { ip: string | null; ipv4: string | null; ipv6: string | null } {
    let ipv4: string | null = null;
    let ipv6: string | null = null;
    
    // Priority 1: Check for explicit ipv4 and ipv6 fields at root level (new format)
    if (data.ipv4 && isIPv4(data.ipv4)) {
        ipv4 = data.ipv4;
    }
    if (data.ipv6 && isIPv6(data.ipv6)) {
        ipv6 = data.ipv6;
    }
    
    // Priority 2: Check for explicit ip field at root level (backward compatibility)
    if (data.ip) {
        if (isIPv4(data.ip)) {
            if (!ipv4) ipv4 = data.ip;
        } else if (isIPv6(data.ip)) {
            if (!ipv6) ipv6 = data.ip;
        }
    }
    
    // Priority 3: Check traits.ipAddress (old format)
    const traitsIp = data.traits?.ipAddress;
    if (traitsIp) {
        if (isIPv4(traitsIp)) {
            if (!ipv4) ipv4 = traitsIp;
        } else if (isIPv6(traitsIp)) {
            if (!ipv6) ipv6 = traitsIp;
        }
    }
    
    // Priority 4: Check data.ipAddress (legacy format)
    const dataIp = data.ipAddress;
    if (dataIp) {
        if (isIPv4(dataIp)) {
            if (!ipv4) ipv4 = dataIp;
        } else if (isIPv6(dataIp)) {
            if (!ipv6) ipv6 = dataIp;
        }
    }
    
    // Primary IP (for backward compatibility) should always be IPv4 if available, otherwise IPv6
    // This ensures backward compatibility with code expecting ipAddress to be IPv4
    const primaryIp = ipv4 || ipv6 || null;
    
    return {
        ip: primaryIp,
        ipv4: ipv4 || null,
        ipv6: ipv6 || null
    };
}

// Updated Interface to match the server response
export interface GeolocationInfo {
    /** Primary IP address (IPv4 for backward compatibility, null if unavailable) */
    ipAddress: string | null;
    /** IPv4 address (null if unavailable) */
    ipv4: string | null;
    /** IPv6 address (null if not available) */
    ipv6: string | null;
    country: {
        isoCode: string;
        name: string;
    };
    registeredCountry: {
        isoCode: string;
        name: string;
        isInEuropeanUnion?: boolean;
    };
    city: {
        name: string;
        geonameId: number;
    };
    continent: {
        code: string;
        name: string;
    };
    subdivisions: Array<{
        isoCode: string;
        name: string;
    }>;
    location: {
        accuracyRadius: number;
        latitude: number;
        longitude: number;
        timeZone: string;
    };
    postal: {
        code: string;
    };
    traits: {
        isAnonymous: boolean;
        isAnonymousProxy: boolean;
        isAnonymousVpn: boolean;
        isAnycast: boolean;
        isHostingProvider: boolean;
        isLegitimateProxy: boolean;
        isPublicProxy: boolean;
        isResidentialProxy: boolean;
        isSatelliteProvider: boolean;
        isTorExitNode: boolean;
        ipAddress: string;
        network: string;
    };
}

/**
 * Get mock geolocation data for fallback scenarios
 */
export function getMockGeolocationData(): GeolocationInfo {
    return {
        ipAddress: '192.168.1.1',
        ipv4: '192.168.1.1',
        ipv6: null,
        country: { isoCode: 'US', name: 'United States' },
        registeredCountry: { isoCode: 'US', name: 'United States', isInEuropeanUnion: false },
        city: { name: 'New York', geonameId: 123456 },
        continent: { code: 'NA', name: 'North America' },
        subdivisions: [{ isoCode: 'NY', name: 'New York' }],
        location: {
            accuracyRadius: 100,
            latitude: 40.7128,
            longitude: -74.0060,
            timeZone: 'America/New_York'
        },
        postal: { code: '10001' },
        traits: {
            isAnonymous: false,
            isAnonymousProxy: false,
            isAnonymousVpn: false,
            isAnycast: false,
            isHostingProvider: false,
            isLegitimateProxy: false,
            isPublicProxy: false,
            isResidentialProxy: false,
            isSatelliteProvider: false,
            isTorExitNode: false,
            ipAddress: '192.168.1.1',
            network: '192.168.1.0/24'
        }
    };
}

/**
 * Fetch geolocation information for the current user's IP address.
 * Always returns valid GeolocationInfo data, falling back to mock data if needed.
 * @returns Geolocation information (never null)
 */
export async function fetchGeolocationInfo(): Promise<GeolocationInfo> {
    return StructuredLogger.logBlock('fetchGeolocationInfo', 'Geolocation information fetch', async () => {
        try {
            // DEPRECATED: API key authentication has been removed
            // The x-api-key header is no longer sent or required
            // @deprecated x-api-key header - No longer used
            const response = await fetch(GEOIP_URL, {
                method: 'GET'
                // Removed: headers with x-api-key (deprecated)
            });

            if (!response.ok) {
                StructuredLogger.warn('fetchGeolocationInfo', `Geolocation API request failed: ${response.statusText}, using mock data`);
                return getMockGeolocationData();
            }

            const data = await response.json();
            
            // Validate and structure the response
            if (!data || typeof data !== 'object') {
                StructuredLogger.warn('fetchGeolocationInfo', 'Invalid API response, using mock data');
                return getMockGeolocationData();
            }

            // Parse IP addresses (IPv4 and IPv6)
            const ipInfo = parseIPAddresses(data);

            // If no valid IP found, return mock data
            if (!ipInfo.ip && !ipInfo.ipv4 && !ipInfo.ipv6) {
                StructuredLogger.warn('fetchGeolocationInfo', 'No valid IP address found in response, using mock data');
                return getMockGeolocationData();
            }

            return {
                ipAddress: ipInfo.ip, // Primary IP (IPv4 for backward compatibility, null if unavailable)
                ipv4: ipInfo.ipv4,
                ipv6: ipInfo.ipv6,
                country: data.country || { isoCode: 'US', name: 'United States' },
                registeredCountry: data.registeredCountry || { isoCode: 'US', name: 'United States', isInEuropeanUnion: false },
                city: data.city || { name: 'New York', geonameId: 123456 },
                continent: data.continent || { code: 'NA', name: 'North America' },
                subdivisions: data.subdivisions || [{ isoCode: 'NY', name: 'New York' }],
                location: data.location || { 
                    accuracyRadius: 100, 
                    latitude: 40.7128, 
                    longitude: -74.0060, 
                    timeZone: 'America/New_York' 
                },
                postal: data.postal || { code: '10001' },
                traits: data.traits || {
                    isAnonymous: false,
                    isAnonymousProxy: false,
                    isAnonymousVpn: false,
                    isAnycast: false,
                    isHostingProvider: false,
                    isLegitimateProxy: false,
                    isPublicProxy: false,
                    isResidentialProxy: false,
                    isSatelliteProvider: false,
                    isTorExitNode: false,
                    ipAddress: ipInfo.ip,
                    network: '192.168.1.0/24'
                }
            };
        } catch (error) {
            StructuredLogger.warn('fetchGeolocationInfo', 'Error fetching geolocation information, using mock data', error);
            return getMockGeolocationData();
        }
    });
}

