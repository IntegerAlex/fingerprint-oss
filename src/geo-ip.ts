import dotenv from 'dotenv';

dotenv.config();

const PROXY_URL = process.env.PROXY_URL;
const PROXY_API_KEY = process.env.PROXY_API_KEY;
const GEOIP_URL = process.env.GEOIP_URL;

export interface IpInfo {
    ip: string;
    // ... keep other interface properties from geoip.ts
}

export interface GeolocationInfo {
    ip: string;
    // ... keep other interface properties from geoip.ts
}

export async function fetchIPInfo(): Promise<IpInfo> {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
            throw new Error('IP API request failed');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching IP info:', error);
        return {} as IpInfo;
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
        });
        if (!response.ok) {
            throw new Error('Geolocation API request failed');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching geolocation information:', error);
        return {} as GeolocationInfo;
    }
}

