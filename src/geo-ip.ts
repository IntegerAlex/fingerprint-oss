import dotenv from 'dotenv';

dotenv.config();

const PROXY_URL = process.env.PROXY_URL || '';
const PROXY_API_KEY = process.env.PROXY_API_KEY || '';
const GEOIP_URL = process.env.GEOIP_URL || '';
const IP_API_URL = process.env.IP_API_URL || 'https://ipapi.co/json/';

// Warn if required environment variables are missing
if (!PROXY_URL || !GEOIP_URL) {
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

export async function fetchIPInfo(): Promise<IpInfo> {
    try {
        const response = await fetch(IP_API_URL);
        if (!response.ok) {
            throw new Error('IP API request failed');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching IP info:', error);
        // Return a default object with required fields
        return {
            ip: 'unknown',
            network: '',
            version: '',
            city: '',
            region: '',
            region_code: '',
            country: '',
            country_name: '',
            country_code: '',
            country_code_iso3: '',
            country_capital: '',
            country_tld: '',
            continent_code: '',
            in_eu: false,
            postal: '',
            latitude: 0,
            longitude: 0,
            timezone: '',
            utc_offset: '',
            country_calling_code: '',
            currency: '',
            currency_name: '',
            languages: [],
            country_area: 0,
            country_population: 0,
            asn: '',
            org: ''
        };
    }
}

// Function to get geolocation information
export async function fetchGeolocationInfo(ipAddress: string): Promise<GeolocationInfo> {
    try {
        const response = await fetch(`${PROXY_URL}${GEOIP_URL}`, {
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

