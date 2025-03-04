import {generateJSON} from './json.js'
import { fetchGeolocationInfo} from './geo-ip.js'
import {getSystemInfo} from './systemInfo.js'

export async function userInfo() {
    try {
        const geolocationInfo = await fetchGeolocationInfo();
        const systemInfo = await getSystemInfo();
        const json = generateJSON( geolocationInfo, systemInfo);
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


