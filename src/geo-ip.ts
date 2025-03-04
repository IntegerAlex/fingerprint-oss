import dotenv from 'dotenv';

dotenv.config();

const PROXY_API_KEY = process.env.PROXY_API_KEY || '';
const GEOIP_URL = process.env.GEOIP_URL || '';

// Warn if required environment variables are missing
if (!PROXY_API_KEY || !GEOIP_URL) {
    console.warn('Warning: PROXY_URL or GEOIP_URL environment variables are not set. Geolocation functionality may not work correctly.');
}

export interface IpInfo {
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

export interface GeolocationInfo {
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

// Function to get geolocation information
export async function fetchGeolocationInfo(ipAddress: string): Promise<GeolocationInfo> {
    try {
        const response = await fetch(GEOIP_URL, {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'x-api-key': PROXY_API_KEY || ''
            },
            'body': JSON.stringify({ ip: ipAddress })
        });
        if (!response.ok) {
            throw new Error('Geolocation API request failed');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching geolocation information:', error);
        // Return a default object with required fields
        return {
            ip: ipAddress || 'unknown',
            country_code: '',
            country_name: '',
            region_code: '',
            region_name: '',
            city: '',
            zip_code: '',
            time_zone: '',
            latitude: 0,
            longitude: 0,
            metro_code: 0
        };
    }
}

