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
import { generateId } from './hash';
import { detectIncognito } from './incognito';
import { detectAdBlockers } from './adblocker';
import { getVpnStatus } from './vpn';
import { Telemetry, TelemetryConfig, withTelemetry } from './telemetry';
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
 *   - `telemetry`: Configuration for OpenTelemetry data collection.
 * @returns A JSON object containing the fetched system and geolocation data (when available) along with the computed confidence score.
 */
async function userInfo(config:{transparency?:boolean, message?:string, telemetry?: TelemetryConfig}={}) {
    const startTime = Date.now();
    let span = null;
    
    try {
        // Initialize telemetry if configuration is provided
        if (config.telemetry) {
            Telemetry.initialize(config.telemetry);
        }
        
        // Start telemetry span for this operation
        span = Telemetry.startSpan('userInfo', {
            'operation.type': 'fingerprint_collection',
            'config.transparency': config.transparency || false,
            'config.telemetry.enabled': config.telemetry?.enabled || false
        });

        // Parallel data fetching
        const [systemInfo, geoInfo] = await Promise.all([
            getSystemInfo(),
            fetchGeolocationInfo()
        ]);
	

 if(config.transparency) {
   const message = config.message || 'the software is gathering system data';
   console.log(`\u00A9 fingerprint-oss  ${message}`);
   Toast.show(`\u00A9 fingerprint-oss  ${message}`);
 } else if(config.message) {
   Toast.show(`\u00A9 fingerprint-oss  ${config.message}`);
 }

        const result = await generateJSON(
            geoInfo,
            systemInfo,
            calculateCombinedConfidence(systemInfo, geoInfo)
        );

        // Record successful execution
        const executionTime = Date.now() - startTime;
        const confidence = calculateCombinedConfidence(systemInfo, geoInfo);
        Telemetry.recordFunctionCall('userInfo', executionTime, true, {
            'data.systemInfo.available': !!systemInfo,
            'data.geoInfo.available': !!geoInfo,
            'data.confidence': confidence
        });

        Telemetry.endSpan(span, {
            'result.success': true,
            'result.confidence': confidence,
            'execution.time': executionTime
        });

        return result;
    } catch (error) {
        console.error('Data collection error:', error);
        
        // Record error in telemetry
        const executionTime = Date.now() - startTime;
        Telemetry.recordError(error as Error, {
            'function.name': 'userInfo',
            'execution.time': executionTime
        });
        Telemetry.recordFunctionCall('userInfo', executionTime, false);
        Telemetry.endSpanWithError(span, error as Error);

        // Get fallback data
        const mockSystem = getMockSystemInfo();
        // fetchGeolocationInfo now always returns valid data, so we can use it as fallback too
        const fallbackGeo = await fetchGeolocationInfo();
        
        const fallbackResult = await generateJSON(
            fallbackGeo,
            mockSystem,
            calculateCombinedConfidence(mockSystem, fallbackGeo)
        );

        // Record fallback usage
        Telemetry.incrementCounter('function_calls', 1, {
            'function.name': 'userInfo',
            'function.success': true,
            'data.source': 'fallback'
        });

        return fallbackResult;
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
    
    // Telemetry
    Telemetry,
    withTelemetry
});

export default fingerprintOSS;

// Named exports to match docs and allow tree-shaking
export { Telemetry, withTelemetry };
export type { TelemetryConfig };

// Re-export core functions for named imports in consumers and tests
export {
    getSystemInfo,
    detectBot
} from './systemInfo';

export { fetchGeolocationInfo } from './geo-ip';
export { generateJSON } from './json';
export { generateId, generateIdWithDebug, compareInputs } from './hash';
export { detectIncognito } from './incognito';
export { detectAdBlockers } from './adblocker';
export { getVpnStatus } from './vpn';

export {
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

export {
    getLanguageConsistency,
    isRiskyASN,
    getUAPlatformMismatch,
    checkBrowserConsistency
} from './confidence';

export { getMockSystemInfo } from './mock';
export { Toast } from './compliance';
