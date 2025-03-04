import { generateJSON } from './json.js';
import { getSystemInfo } from './systemInfo.js';
export async function userInfo() {
    const systemInfo = await getSystemInfo();
    // Passing null for ipInfo and geolocationInfo temporarily
    const json = generateJSON(null, null, systemInfo);
    return json;
}
// Add this line to ensure the export is available
export default { userInfo };
