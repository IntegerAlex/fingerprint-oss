/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
import { generateJSON } from './json';
import { fetchGeolocationInfo } from './geo-ip';
import { getSystemInfo, detectBot } from './systemInfo';
import { getMockSystemInfo } from './mock';
import { isRiskyASN, getUAPlatformMismatch, getLanguageConsistency, checkBrowserConsistency } from './confidence';
import { Toast } from './compliance';
import { 
    generateId, 
    generateIdWithDebug, 
    compareInputs,
    HashGeneratorConfig,
    HashGenerationResult,
    InputComparisonResult,
    InputDifference,
    HashDebugInfo
} from './hash';
import { detectIncognito } from './incognito';
import { detectAdBlockers } from './adblocker';
import { getVpnStatus } from './vpn';
import { ErrorHandler, ErrorCategory, DEFAULT_ERROR_CONFIG } from './errorHandler';
import {
    getColorGamut,
    getVendorFlavors,
    isLocalStorageEnabled,
    isSessionStorageEnabled,
    isIndexedDBEnabled,
    getTouchSupportInfo,
    getOSInfo,
    getPluginsInfo,
    getMathFingerprint,
    getCanvasFingerprint,
    getAudioFingerprint,
    getWebGLInfo,
    getFontPreferences,
    estimateCores
} from './helper';

// Note: All individual functions are available as properties of the default export

/**
 * Calculates a combined confidence score based on system and geolocation information.
 *
 * The function starts with a base confidence score provided by the system information (or 0.5 by default)
 * and applies several penalty adjustments:
 * - If the system is flagged as a bot, it reduces the score by a computed value capped at 0.4.
 * - When geolocation data is available, it decreases the score if indicators of proxies, hosting, or TOR usage are present,
 *   and further penalizes if the geolocation timezone does not match the system timezone.
 * - In the absence of geolocation information, it applies a penalty.
 * - It also evaluates the hardware and software consistency by comparing the user agent with the platform,
 *   reducing the score by the detected mismatch.
 *
 * The final confidence score is clamped to remain between 0.1 and 0.9.
 *
 * @param systemInfo - Object containing system-derived data, including a confidence score, timezone, user agent,
 * and platform details, as well as bot-related flags and confidence.
 * @param geoInfo - Object containing geolocation data such as timezone and flags for proxy, hosting, or TOR usage.
 *
 * @returns The computed confidence score adjusted for various factors, guaranteed to be between 0.1 and 0.9.
 */
function calculateCombinedConfidence(systemInfo: any, geoInfo: any): number {
    // Base confidence from system info
    let confidence = systemInfo?.confidenceScore || 0.5;

    // Bot detection impact
    if (systemInfo?.bot?.isBot) {
        confidence -= Math.min(0.4, systemInfo.bot.confidence * 0.6);
    }

    // Geo verification - geoInfo is now always available
    // Penalize suspicious network providers
    if (geoInfo.traits?.isAnonymousProxy || geoInfo.traits?.isHostingProvider || geoInfo.traits?.isTorExitNode) {
        confidence -= 0.2;
    }

    // Validate timezone consistency
    if (systemInfo?.timezone && geoInfo.location?.timeZone !== systemInfo.timezone) {
        confidence -= 0.15;
    }

    // Hardware/software consistency
    if (systemInfo?.userAgent && systemInfo?.platform) {
        const mismatch = getUAPlatformMismatch(systemInfo.userAgent, systemInfo.platform);
        confidence -= mismatch;
    }

    // Keep within bounds
    return Math.max(0.1, Math.min(0.9, confidence));
}

/**
 * Retrieves user system and geolocation data concurrently, computes a confidence score, and returns a JSON object summarizing these details.
 *
 * The function fetches system and geolocation information in parallel and calculates a confidence score based on the integrity of the data. When the optional `transparency` flag is enabled, it logs a copyright notice and displays a notification via Toast using a custom message (or a default message if none is provided). If an error occurs during data retrieval, the function logs the error and uses fallback system data to compute the confidence score.
 *
 * @param config - Optional configuration with:
 *   - `transparency`: When true, enables logging and Toast notifications for data collection transparency.
 *   - `message`: A custom message to log and display; defaults to "the software is gathering system data" if not specified.
 *   - `hashConfig`: Optional configuration for hash generation behavior (debugMode, strictMode, etc.)
 * @returns A JSON object containing the fetched system and geolocation data (when available) along with the computed confidence score.
 */
async function userInfo(config: { 
    transparency?: boolean, 
    message?: string,
    hashConfig?: HashGeneratorConfig 
} = {}) {
    try {
        // Parallel data fetching
        const [systemInfo, geoInfo] = await Promise.all([
            getSystemInfo(),
            fetchGeolocationInfo()
        ]);


        if (config.transparency) {
            const message = config.message || 'the software is gathering system data';
            console.log(`\u00A9 fingerprint-oss  ${message}`);
            Toast.show(`\u00A9 fingerprint-oss`);
            if (config.message) {
                Toast.show(`\u00A9 fingerprint-oss  ${message}`);
            }
        } else if (config.message) {
            Toast.show(`\u00A9 fingerprint-oss  ${config.message}`);
        }
        return generateJSON(
            geoInfo,
            systemInfo,
            calculateCombinedConfidence(systemInfo, geoInfo),
            config.hashConfig
        );
    } catch (error) {
        console.error('Data collection error:', error);
        // Get fallback data
        const mockSystem = getMockSystemInfo();
        // fetchGeolocationInfo now always returns valid data, so we can use it as fallback too
        const fallbackGeo = await fetchGeolocationInfo();
        return generateJSON(
            fallbackGeo,
            mockSystem,
            calculateCombinedConfidence(mockSystem, fallbackGeo),
            config.hashConfig
        );
    }
}

// Create default export with all functions as properties
const fingerprintOSS = Object.assign(userInfo, {
    // Core system functions
    getSystemInfo,
    detectBot,
    fetchGeolocationInfo,
    generateJSON,
    generateId,
    generateIdWithDebug,
    compareInputs,

    // Privacy detection functions
    detectIncognito,
    detectAdBlockers,
    getVpnStatus,

    // Helper functions
    getColorGamut,
    getVendorFlavors,
    isLocalStorageEnabled,
    isSessionStorageEnabled,
    isIndexedDBEnabled,
    getTouchSupportInfo,
    getOSInfo,
    getPluginsInfo,
    getMathFingerprint,
    getCanvasFingerprint,
    getAudioFingerprint,
    getWebGLInfo,
    getFontPreferences,
    estimateCores,

    // Confidence functions
    getLanguageConsistency,
    isRiskyASN,
    getUAPlatformMismatch,
    checkBrowserConsistency,

    // Mock data function
    getMockSystemInfo,

    // Compliance
    Toast,

    // Error handling
    ErrorHandler,
    ErrorCategory,
    DEFAULT_ERROR_CONFIG
});

export default fingerprintOSS;

// Named exports for types and interfaces
export type {
    HashGeneratorConfig,
    HashGenerationResult,
    InputComparisonResult,
    InputDifference,
    HashDebugInfo
} from './hash';

// Named exports for functions (for those who prefer named imports)
export {
    getSystemInfo,
    detectBot,
    fetchGeolocationInfo,
    generateJSON,
    generateId,
    generateIdWithDebug,
    compareInputs,
    detectIncognito,
    detectAdBlockers,
    getVpnStatus,
    getColorGamut,
    getVendorFlavors,
    isLocalStorageEnabled,
    isSessionStorageEnabled,
    isIndexedDBEnabled,
    getTouchSupportInfo,
    getOSInfo,
    getPluginsInfo,
    getMathFingerprint,
    getCanvasFingerprint,
    getAudioFingerprint,
    getWebGLInfo,
    getFontPreferences,
    estimateCores,
    getLanguageConsistency,
    isRiskyASN,
    getUAPlatformMismatch,
    checkBrowserConsistency,
    getMockSystemInfo,
    Toast,
    ErrorHandler,
    ErrorCategory,
    DEFAULT_ERROR_CONFIG
};
