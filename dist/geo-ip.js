var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function fetchIPInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('https://ipapi.co/json/');
        const data = yield response.json();
        return data;
    });
}
// Function to get geolocation information
export function fetchGeolocationInfo(ipAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const proxy = " https://low-power-proxxy-v2ndqtpkjq-de.a.run.app/proxy?url=";
            const targetUrl = `https://freegeoip.app/json/${ipAddress}`; // Target URL
            const response = yield fetch(proxy + targetUrl);
            const data = yield response.json();
            return data;
        }
        catch (error) {
            console.error('Error fetching geolocation information:', error);
            return null;
        }
    });
}
