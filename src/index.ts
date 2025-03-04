import { generateJSON } from './json'
import { fetchGeolocationInfo } from './geo-ip'
import { getSystemInfo } from './systemInfo'

/**
 * Collects user information including system data and optional geolocation
 * @returns Promise that resolves to an object containing system information and geolocation data
 */
export async function userInfo() {
    try {
        // Get system info first to ensure we at least have this data
        const systemInfo = await getSystemInfo();
        
        // Try to get geolocation info if environment variables are set
        let geolocationInfo = null;
        try {
            geolocationInfo = await fetchGeolocationInfo();
        } catch (geoError) {
            console.warn('Geolocation fetch failed:', geoError);
            // Don't rethrow - we can continue without geolocation data
        }

        // Generate the final JSON response with available data
        return generateJSON(geolocationInfo, systemInfo);
    } catch (error) {
        console.error('Error gathering user info:', error);
        
        // Last resort - try to get just system info
        try {
            const fallbackSystemInfo = await getSystemInfo();
            return generateJSON(null, fallbackSystemInfo);
        } catch (fallbackError) {
            // If even this fails, return a minimal response
            console.error('Fallback error:', fallbackError);
            return {
                systemInfo: { 
                    error: 'Failed to gather information',
                    incognito: null
                },
                geolocation: null
            };
        }
    }
}

// Export as default and named export for flexibility
export default { userInfo };


