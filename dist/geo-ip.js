"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGeolocationInfo = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PROXY_API_KEY = process.env.PROXY_API_KEY || '';
const GEOIP_URL = process.env.GEOIP_URL || '';
// Warn if required environment variables are missing
if (!PROXY_API_KEY || !GEOIP_URL) {
    console.warn('Warning: PROXY_API_KEY or GEOIP_URL environment variables are not set. Geolocation functionality may not work correctly.');
}
// Function to get geolocation information
async function fetchGeolocationInfo() {
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
                ipAddress: detectedIp,
                network: ''
            }
        };
    }
    catch (error) {
        console.error('Error fetching geolocation information:', error);
        return null;
    }
}
exports.fetchGeolocationInfo = fetchGeolocationInfo;
