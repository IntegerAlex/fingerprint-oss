"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userInfo = void 0;
const json_1 = require("./json");
const geo_ip_1 = require("./geo-ip");
const systemInfo_1 = require("./systemInfo");
/**
 * Collects user information including system data and optional geolocation
 * @returns Promise that resolves to an object containing system information and geolocation data
 */
async function userInfo() {
    try {
        // Get system info first to ensure we at least have this data
        const systemInfo = await (0, systemInfo_1.getSystemInfo)();
        // Try to get geolocation info if environment variables are set
        let geolocationInfo = null;
        try {
            geolocationInfo = await (0, geo_ip_1.fetchGeolocationInfo)();
        }
        catch (geoError) {
            console.warn('Geolocation fetch failed:', geoError);
            // Don't rethrow - we can continue without geolocation data
        }
        // Generate the final JSON response with available data
        return (0, json_1.generateJSON)(geolocationInfo, systemInfo);
    }
    catch (error) {
        console.error('Error gathering user info:', error);
        // Last resort - try to get just system info
        try {
            const fallbackSystemInfo = await (0, systemInfo_1.getSystemInfo)();
            return (0, json_1.generateJSON)(null, fallbackSystemInfo);
        }
        catch (fallbackError) {
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
exports.userInfo = userInfo;
// Export as default and named export for flexibility
exports.default = { userInfo };
