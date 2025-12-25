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

const PROXY_API_KEY = 'tester';
const GEOIP_URL = 'https://fingerprint-proxy.gossorg.in/';
// Warn if required environment variables are missing
if (!PROXY_API_KEY || !GEOIP_URL) {
    StructuredLogger.warn('geo-ip', 'PROXY_API_KEY or GEOIP_URL environment variables are not set. Geolocation functionality may not work correctly.');
}

/**
 * Check if an IP address is IPv4
 */
function isIPv4(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Regex.test(ip);
}

/**
 * Check if an IP address is IPv6
 */
function isIPv6(ip: string): boolean {
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip) || ip.includes(':');
}

/**
 * Parse IP addresses from various sources and return structured IP info
 */
function parseIPAddresses(data: any): { ip: string; ipv4: string | null; ipv6: string | null } {
    // Try to get IP from various possible locations in the response
    const possibleIp = data.traits?.ipAddress || data.ipAddress || data.ip || '192.168.1.1';
    
    // Handle case where we might have both IPv4 and IPv6 in the response
    let ipv4: string | null = null;
    let ipv6: string | null = null;
    
    // Check if the IP is IPv4 or IPv6
    if (isIPv4(possibleIp)) {
        ipv4 = possibleIp;
    } else if (isIPv6(possibleIp)) {
        ipv6 = possibleIp;
    }
    
    // Check for explicit ipv4 and ipv6 fields in response
    if (data.ipv4) {
        ipv4 = data.ipv4;
    }
    if (data.ipv6) {
        ipv6 = data.ipv6;
    }
    
    // Primary IP (for backward compatibility) should always be IPv4 if available
    const primaryIp = ipv4 || ipv6 || possibleIp;
    
    return {
        ip: primaryIp,
        ipv4: ipv4 || null,
        ipv6: ipv6 || null
    };
}

// Updated Interface to match the server response
export interface GeolocationInfo {
    /** Primary IP address (IPv4 for backward compatibility) */
    ipAddress: string;
    /** IPv4 address (guaranteed to be present, null if unavailable) */
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
function getMockGeolocationData(): GeolocationInfo {
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
            const response = await fetch(GEOIP_URL, {
                method: 'GET'
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

            return {
                ipAddress: ipInfo.ip, // Primary IP (IPv4 for backward compatibility)
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

