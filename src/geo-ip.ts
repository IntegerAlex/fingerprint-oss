export async function fetchIPInfo() {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data;
}

// Function to get geolocation information
export async function fetchGeolocationInfo(ipAddress:string) {
    try {

        const proxy = " https://low-power-proxxy-v2ndqtpkjq-de.a.run.app/proxy?url="

       

        const targetUrl = `https://freegeoip.app/json/${ipAddress}`; // Target URL
        const response = await fetch(proxy+targetUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching geolocation information:', error);
        return null;    
    }
}

