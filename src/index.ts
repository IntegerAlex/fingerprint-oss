import { generateJSON } from './json';
import { fetchGeolocationInfo } from './geo-ip';
import { getSystemInfo } from './systemInfo';
import { getMockSystemInfo } from './mock';
import { isRiskyASN, getUAPlatformMismatch } from './confidence';
import { Toast } from './compliance';

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

    // Geo verification
    if (geoInfo) {
        // Penalize suspicious network providers
        if (geoInfo.proxy || geoInfo.hosting || geoInfo.tor) {
            confidence -= 0.2;
        }
        
        // Validate timezone consistency
        if (systemInfo?.timezone && geoInfo.timezone !== systemInfo.timezone) {
            confidence -= 0.15;
        }
    } else {
        confidence -= 0.3;
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
 * @returns A JSON object containing the fetched system and geolocation data (when available) along with the computed confidence score.
 */
export default async function userInfo(config:{transparency?:boolean, message?:string}={}) {
    try {
        // Parallel data fetching
        const [systemInfo, geoInfo] = await Promise.all([
            getSystemInfo(),
            fetchGeolocationInfo()
        ]);
	

 if(config.transparency) {
   const message = config.message || 'the software is gathering system data';
   console.log(`\u00A9 fingerprint-oss  ${message}`);
	Toast.show(`\u00A9 fingerprint-oss`); 
   if(config.message) {
     Toast.show(`\u00A9 fingerprint-oss  ${message}`);
   }
 } else if(config.message) {
   Toast.show(`\u00A9 fingerprint-oss  ${config.message}`);
 }
        return generateJSON(
            geoInfo,
            systemInfo,
            calculateCombinedConfidence(systemInfo, geoInfo)
        );
    } catch (error) {
        console.error('Data collection error:', error);
        // Get fallback data
        const mockSystem = getMockSystemInfo();
        return generateJSON(
            null,
            mockSystem,
            calculateCombinedConfidence(mockSystem, null)
        );
    }
}
