import { generateJSON } from './json'
import { fetchGeolocationInfo } from './geo-ip'
import { getSystemInfo } from './systemInfo'

/**
 * Collects user information including system data and optional geolocation
 * @returns Promise that resolves to an object containing system information and geolocation data
 */
export default async function userInfo() {
	const systemInfo = await getSystemInfo();
	const geolocationInfo = await fetchGeolocationInfo();
	const json = generateJSON(geolocationInfo, systemInfo);
	return json;
}

// Also export as named export for convenience
export { userInfo };



