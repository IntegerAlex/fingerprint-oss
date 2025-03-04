export function generateJSON(ipInfo, geolocationInfo, systemInfo) {
    return {
        systemInfo: {
            ...systemInfo // Simply spread all properties
        }
    };
}
