interface TimeZone {
    geoip?: string | null | undefined;
    localtime?: string | null | undefined;
}

export async function getVpnStatus(timeZone: TimeZone): Promise<Object> {
    if (!timeZone || !timeZone.geoip || !timeZone.localtime) {
        // If geoip or localtime are missing, assume a 50% chance of VPN usage
        return { vpn: { status: false, probability: 0.5 } };
    }

    // If either geoip or localtime is 'unknown', return a default 50% probability
    if (timeZone.geoip === 'unknown' || timeZone.localtime === 'unknown') {
        return { vpn: { status: false, probability: 0.5 } };
    }

    // Compare geoip and localtime for mismatches
    const isTimezoneMismatch = timeZone.localtime !== timeZone.geoip;
    
    if (isTimezoneMismatch) {
        // Mismatch in timezones, which might indicate VPN usage
        return { vpn: { status: true, probability: 0.75 } }; // Increase probability due to mismatch
    }

    // If timezones match, return a lower probability of VPN usage
    return { vpn: { status: false, probability: 0.2 } }; // Lower probability if there's no mismatch
}

