import { generateJSON } from './json';
import { fetchGeolocationInfo } from './geo-ip';
import { getSystemInfo } from './systemInfo';
import { getMockSystemInfo } from './mock';
import { isRiskyASN, getUAPlatformMismatch } from './confidence';

// Simplified, battle-tested implementation
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
 * Main function to fetch and process user information
 * @param config - Optional configuration object
 * @returns JSON object with user information
 */
export default async function userInfo(config: any = {}) {
    try {
        // Parallel data fetching
        const [systemInfo, geoInfo] = await Promise.all([
            getSystemInfo(),
            fetchGeolocationInfo()
        ]);
	if(config.transparency){
		console.log('\u00A9 fingerprint-oss');
	}
	if(config.message){
		console.log(config.message);
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

export { userInfo };	
