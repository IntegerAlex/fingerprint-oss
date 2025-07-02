/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
const PROXY_API_KEY = 'tester';
const GEOIP_URL = 'https://fingerprint-proxy.gossorg.in/';
// Warn if required environment variables are missing
if (!PROXY_API_KEY || !GEOIP_URL) {
    console.warn('Warning: PROXY_API_KEY or GEOIP_URL environment variables are not set. Geolocation functionality may not work correctly.');
}

// Updated Interface to match the server response
export interface GeolocationInfo {
    ipAddress: string;
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
    try {
        const response = await fetch(GEOIP_URL, {
            method: 'GET'
        });

        if (!response.ok) {
            console.warn(`Geolocation API request failed: ${response.statusText}, using mock data`);
            return getMockGeolocationData();
        }

        const data = await response.json();
        
        // Validate and structure the response
        if (!data || typeof data !== 'object') {
            console.warn('Invalid API response, using mock data');
            return getMockGeolocationData();
        }

        // Use the IP address from response data
        const detectedIp = data.traits?.ipAddress || data.ipAddress || '192.168.1.1';

        return {
            ipAddress: detectedIp,
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
                ipAddress: detectedIp,
                network: '192.168.1.0/24'
            }
        };
    } catch (error) {
        console.warn('Error fetching geolocation information:', error, '- using mock data');
        return getMockGeolocationData();
    }
}

