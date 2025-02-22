// Function to get system information
export function getSystemInfo() {
    const systemInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        colorDepth: window.screen.colorDepth,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browserPlugins: getBrowserPlugins(),
        javaEnabled: navigator.javaEnabled(),
        battery: getBatteryInfo(),
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        // webGLRenderer: getWebGLRenderer(),
    };
    return systemInfo;
}
function getBrowserPlugins() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push({
            name: navigator.plugins[i].name,
            description: navigator.plugins[i].description,
            filename: navigator.plugins[i].filename,
            version: navigator.plugins[i].version,
        });
    }
    return plugins;
}
// Helper function to retrieve battery information
function getBatteryInfo() {
    if ('getBattery' in navigator) {
        return {
            charging: navigator.getBattery().then(battery => battery.charging),
            level: navigator.getBattery().then(battery => battery.level),
        };
    }
    else {
        return 'Battery API not supported';
    }
}
