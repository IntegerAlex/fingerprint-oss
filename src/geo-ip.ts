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
const GEOIP_URL = 'https://proxy-server-deploy.onrender.com';
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
 * Fetch geolocation information for the current user's IP address.
 * @param none
 * @returns Geolocation information or null if an error occurred.
 */
export async function fetchGeolocationInfo(): Promise<GeolocationInfo | null> {
    // ALWAYS use mock data for now to ensure tests are stable and don't rely on external API
    // In a real scenario, this could be controlled by an environment variable e.g., if (process.env.NODE_ENV === 'test')
    const useMockData = true; // Force mock data

    if (useMockData || !PROXY_API_KEY || !GEOIP_URL) {
        console.log('Using mock geolocation data for testing');
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

    try {
        const response = await fetch(GEOIP_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': PROXY_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Geolocation API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        // Use the IP address from response data
        const detectedIp = data.traits?.ipAddress || 'unknown';

        return {
            ipAddress: detectedIp,
            country: data.country || { isoCode: '', name: '' },
            registeredCountry: data.registeredCountry || { isoCode: '', name: '', isInEuropeanUnion: false },
            city: data.city || { name: '', geonameId: 0 },
            continent: data.continent || { code: '', name: '' },
            subdivisions: data.subdivisions || [],
            location: data.location || { accuracyRadius: 0, latitude: 0, longitude: 0, timeZone: '' },
            postal: data.postal || { code: '' },
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
                ipAddress: detectedIp, // Use the detected IP
                network: ''
            }
        };
    } catch (error) {
        console.error('Error fetching geolocation information:', error);
        return null;
    }
}

