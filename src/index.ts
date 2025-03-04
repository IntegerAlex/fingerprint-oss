import {generateJSON} from './json.js'
import {fetchIPInfo, fetchGeolocationInfo} from './geo-ip.js'
import {getSystemInfo} from './systemInfo.js'

export async function userInfo() {
    try {
        const ipInfo = await fetchIPInfo();
        const geolocationInfo = await fetchGeolocationInfo(ipInfo.ip);
        const systemInfo = await getSystemInfo();
        const json = generateJSON(ipInfo, geolocationInfo, systemInfo);
        return json;
    } catch (error) {
        console.error('Error gathering user info:', error);
        // Return system info even if geo/ip fails
        const json = generateJSON(null, null, await getSystemInfo());
        return json;
    }
}

// Add this line to ensure the export is available
export default { userInfo };


