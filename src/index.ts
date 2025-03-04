import { generateJSON } from './json.js'
import { fetchGeolocationInfo } from './geo-ip.js'
import { getSystemInfo } from './systemInfo.js'

export async function userInfo() {
    try {
        const geolocationInfo = await fetchGeolocationInfo('');
        const systemInfo = await getSystemInfo();
        const json = generateJSON(geolocationInfo, systemInfo);
        return json;
    } catch (error) {
        console.error('Error gathering user info:', error);
        const json = generateJSON(null, await getSystemInfo());
        return json;
    }
}

export default { userInfo };


