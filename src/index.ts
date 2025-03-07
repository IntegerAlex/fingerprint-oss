import { generateJSON } from './json'
import { fetchGeolocationInfo } from './geo-ip'
import { getSystemInfo } from './systemInfo'
import { getMockSystemInfo } from './mock'

/**
 * Computes a weighted confidence score using system and geolocation data.
 *
 * This function evaluates factors such as the base system confidence, bot detection signals, geolocation verifications
 * (including timezone, proxy, and language consistency), and device coherence validations. The final score is normalized
 * to ensure it falls between 0.1 and 0.9.
 *
 * @param systemInfo - An object containing system details, including a base confidence score and bot detection metrics.
 * @param geoInfo - An object providing geolocation details used for verifying user data consistency.
 * @returns A normalized confidence score between 0.1 and 0.9.
 */
function calculateCombinedConfidence(systemInfo: any, geoInfo: any): number {
	// Start with neutral base score
	let score = 0.5;
	
	// Weight the system info confidence more heavily (60%)
	if (systemInfo && systemInfo.confidenceScore !== undefined) {
		score = systemInfo.confidenceScore * 0.6;
	}
	
	// === BOT DETECTION FACTORS (25% weight) ===
	if (systemInfo && systemInfo.bot) {
		const botInfo = systemInfo.bot;
		
		// For high-confidence bot detection, significantly reduce overall confidence
		if (botInfo.isBot && botInfo.confidence > 0.7) {
			score -= (botInfo.confidence - 0.7) * 0.5;
		}
		// For medium-confidence bot detection, moderately reduce confidence
		else if (botInfo.isBot && botInfo.confidence > 0.5) {
			score -= (botInfo.confidence - 0.5) * 0.3;
		}
		// For low-confidence bot detection, slightly reduce confidence
		else if (botInfo.isBot) {
			score -= botInfo.confidence * 0.1;
		}
		// For confident human detection, boost confidence
		else if (botInfo.confidence < 0.3) {
			score += (0.3 - botInfo.confidence) * 0.2;
		}
		
		// Specific signal analysis
		if (botInfo.signals) {
			// High-risk signals have greater impact
			const highRiskSignals = ['webdriver-present', 'dom-manipulation-error', 'unusual-hardware-concurrency'];
			const highRiskCount = botInfo.signals.filter((s: string) => highRiskSignals.some(hrs => s.includes(hrs))).length;
			
			if (highRiskCount > 0) {
				score -= highRiskCount * 0.08;
			}
		}
	}
	
	// === GEOLOCATION VERIFICATION (25% weight) ===
	if (geoInfo) {
		// Check for proxy/VPN/hosting detection
		let proxyPenalty = 0;
		if (geoInfo.proxy) proxyPenalty += 0.15;
		if (geoInfo.hosting) proxyPenalty += 0.1;
		if (geoInfo.tor) proxyPenalty += 0.2;
		
		score -= proxyPenalty;
		
		// Check for geolocation coherence between different signals
		let geoCoherenceScore = 0;
		
		// Timezone consistency between browser and geo IP
		if (systemInfo && systemInfo.timezone) {
			// Complex timezone validation - converting timezone to approximate longitude
			try {
				// Get browser timezone offset
				const browserOffset = new Date().getTimezoneOffset();
				
				// Compare with expected timezone based on geolocation
				// This is a simplified approximation
				if (geoInfo.longitude !== undefined) {
					// Convert longitude to expected timezone offset (15 degrees ≈ 1 hour)
					const expectedOffset = -Math.round(geoInfo.longitude / 15) * 60;
					const offsetDifference = Math.abs(browserOffset - expectedOffset);
					
					// Allow for some variance (DST, timezone borders, etc.)
					if (offsetDifference > 120) {
						score -= 0.12; // Major discrepancy
					} else if (offsetDifference > 60) {
						score -= 0.05; // Minor discrepancy
					} else {
						geoCoherenceScore += 0.08; // Good match
					}
				}
				// Standard timezone name matching
				else if (geoInfo.timezone) {
					const browserTimezone = systemInfo.timezone;
					if (browserTimezone !== geoInfo.timezone) {
						// Check for closely related timezones (same region)
						if (browserTimezone.split('/')[0] === geoInfo.timezone.split('/')[0]) {
							score -= 0.02; // Minor difference (same region)
						} else {
							score -= 0.1; // Major difference (different regions)
						}
					} else {
						geoCoherenceScore += 0.07; // Perfect match
					}
				}
			} catch (e) {
				score -= 0.02; // Error in timezone validation
			}
		}
		
		// Language consistency with country
		if (systemInfo && systemInfo.languages && systemInfo.languages.length > 0 && geoInfo.country) {
			try {
				const primaryLanguage = systemInfo.languages[0].split('-')[0].toLowerCase();
				const country = geoInfo.country.toUpperCase();
				
				// Expanded language-country mapping with primary and secondary languages
				const languageMap: Record<string, {primary: string[], secondary: string[]}> = {
					'US': {primary: ['en'], secondary: ['es', 'fr', 'zh', 'vi', 'tl', 'ko', 'de']},
					'GB': {primary: ['en'], secondary: ['cy', 'gd', 'pa', 'ur', 'pl']},
					'CA': {primary: ['en', 'fr'], secondary: ['zh', 'pa', 'it', 'de', 'sp']},
					'FR': {primary: ['fr'], secondary: ['en', 'de', 'it', 'es', 'ar']},
					'DE': {primary: ['de'], secondary: ['en', 'fr', 'tr', 'ru', 'it', 'pl']},
					'IT': {primary: ['it'], secondary: ['en', 'fr', 'de', 'sl']},
					'ES': {primary: ['es'], secondary: ['ca', 'gl', 'eu', 'en']},
					'JP': {primary: ['ja'], secondary: ['en', 'ko', 'zh']},
					'CN': {primary: ['zh'], secondary: ['en', 'mn', 'ug', 'bo']},
					'RU': {primary: ['ru'], secondary: ['en', 'tt', 'uk', 'ba']},
					'IN': {primary: ['hi', 'en'], secondary: ['ta', 'te', 'mr', 'ur', 'gu', 'kn', 'ml']},
					'BR': {primary: ['pt'], secondary: ['en', 'es', 'de', 'it']},
					'MX': {primary: ['es'], secondary: ['en', 'nah']}
				};
				
				if (languageMap[country]) {
					if (languageMap[country].primary.includes(primaryLanguage)) {
						geoCoherenceScore += 0.08; // Primary language match
					} else if (languageMap[country].secondary.includes(primaryLanguage)) {
						geoCoherenceScore += 0.04; // Secondary language match
					} else {
						score -= 0.08; // No language match with country
					}
				}
			} catch (e) {
				// Error in language validation
				score -= 0.01;
			}
		}
		
		// Apply geo coherence bonus
		score += geoCoherenceScore;
		
		// Check for ASN reputation if available
		if (geoInfo.asn) {
			// Known high-risk ASNs (hosting providers, VPN services)
			const highRiskASNs = [
				'AS14061', // DigitalOcean
				'AS16276', // OVH
				'AS16509', // Amazon AWS
				'AS14618', // Amazon AWS
				'AS3356',  // Level3
				'AS4812',  // China Telecom
				'AS4134',  // China Telecom
				'AS9009',  // M247
				'AS24940', // Hetzner
				'AS59930', // Telegram
				'AS202425', // IP Volume inc (associated with bots)
				'AS48666'  // NETASSIST (associated with VPN)
			];
			
			if (typeof geoInfo.asn === 'string' && highRiskASNs.includes(geoInfo.asn)) {
				score -= 0.1;
			}
		}
	} else {
		// Missing geolocation data is a major red flag
		score -= 0.2;
	}
	
	// === DATA COHERENCE VALIDATIONS (15% weight) ===
	if (systemInfo) {
		let deviceCoherenceScore = 0;
		
		// Check for user agent and platform consistency
		if (systemInfo.userAgent && systemInfo.platform) {
			const ua = systemInfo.userAgent.toLowerCase();
			const platform = systemInfo.platform.toLowerCase();
			
			const mobileUA = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
			const mobilePlatform = platform.includes('arm') || platform.includes('iphone') || platform.includes('android');
			
			// Mobile/desktop consistency
			if (mobileUA !== mobilePlatform) {
				score -= 0.1;
			} else {
				deviceCoherenceScore += 0.05;
			}
			
			// OS version consistency
			const windowsUA = ua.includes('windows');
			const windowsPlatform = platform.includes('win');
			const macUA = ua.includes('mac');
			const macPlatform = platform.includes('mac');
			const linuxUA = ua.includes('linux');
			const linuxPlatform = platform.includes('linux');
			
			if ((windowsUA && !windowsPlatform) || 
				(macUA && !macPlatform) || 
				(linuxUA && !linuxPlatform)) {
				score -= 0.12;
			} else {
				deviceCoherenceScore += 0.04;
			}
		}
		
		// Check hardware capabilities consistency
		if (systemInfo.hardwareConcurrency !== undefined && 
			systemInfo.screenResolution && 
			Array.isArray(systemInfo.screenResolution)) {
			
			const cores = systemInfo.hardwareConcurrency;
			const [width, height] = systemInfo.screenResolution;
			const resolution = width * height;
			
			// Check for unrealistic combinations
			// High resolution but very low cores (unless it's a mobile device)
			if (resolution > 4000000 && cores < 2 && !systemInfo.userAgent?.toLowerCase().includes('mobile')) {
				score -= 0.08;
			}
			
			// Very high cores with low resolution (unusual for high-end machines)
			if (cores > 16 && resolution < 1000000) {
				score -= 0.08;
			}
		}
		
		// Apply device coherence bonus
		score += deviceCoherenceScore;
	}
	
	// === APPLY FINAL ADJUSTMENTS (5% weight) ===
	
	// If all the data is present and seems consistent, give a small bonus
	const allDataPresent = systemInfo && geoInfo && 
		systemInfo.userAgent && systemInfo.languages && 
		systemInfo.hardwareConcurrency !== undefined && systemInfo.timezone;
	
	if (allDataPresent) {
		score += 0.05;
	}
	
	// Penalize for any missing critical data
	const missingCriticalData = !systemInfo || !systemInfo.userAgent || 
		!systemInfo.platform || !systemInfo.languages;
	
	if (missingCriticalData) {
		score -= 0.15;
	}
	
	// Normalize final score to be between 0.1 and 0.9
	return Math.max(0.1, Math.min(0.9, score));
}

/**
 * Asynchronously gathers system and geolocation information, computes a combined confidence score,
 * and returns a JSON object with the aggregated data.
 *
 * The function retrieves system data and geolocation details, calculates a combined confidence score based
 * on these inputs, and constructs a JSON object with the results. If any error occurs during the data collection,
 * it logs the error and returns a fallback JSON object containing mock system information and a default score of 0.1.
 *
 * @returns A JSON object containing geolocation information, system information, and the confidence score.
 */
export default async function userInfo() {
	try {
		// Gather system information
		const systemInfo = await getSystemInfo();
		
		// Get geolocation data in parallel
		const geoInfo = await fetchGeolocationInfo();
		
		// Calculate final combined confidence score
		const combinedConfidenceScore = calculateCombinedConfidence(systemInfo, geoInfo);
		
		// Generate JSON with all collected data
		console.log(`\u00A9 2025 Fingerprint-oss`)
		return generateJSON(geoInfo, systemInfo, combinedConfidenceScore);
	} catch (error) {
		console.error('Error collecting user information:', error);
		// In case of error, generate a partial JSON with error information
		return generateJSON(null, getMockSystemInfo(), 0.1);
	}
}

// Also export as named export for convenience
export { userInfo };



