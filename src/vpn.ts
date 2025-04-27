interface TimeZone {
    geoip?: string | null | undefined;
    localtime?: string | null | undefined;
}
/**
 * A mapping of common timezone aliases to their canonical names.
 * This helps normalize timezone strings that refer to the same location but use different naming.
 */
import {timezoneAliases} from './timeZones';

/**
 * Normalizes a timezone string by checking against known aliases.
 * 
 * @param timezone - The timezone string to normalize
 * @returns The normalized timezone string
 */
function normalizeTimezone(timezone: string | null | undefined): string | null | undefined {
    if (!timezone) return timezone;
    return timezoneAliases[timezone] || timezone;
}

/**
 * Determines the likelihood of VPN usage based on provided geoip and localtime time zone information.
 *
 * Returns an object containing the inferred VPN status and an associated probability score.
 *
 * @param timeZone - An object containing optional `geoip` and `localtime` time zone strings.
 * @returns An object with a `vpn` property, which includes a boolean `status` indicating suspected VPN usage and a numeric `probability` representing confidence in the assessment.
 */
export async function getVpnStatus(timeZone: TimeZone): Promise<Object> {
    if (!timeZone || !timeZone.geoip || !timeZone.localtime) {
        // If geoip or localtime are missing, assume a 50% chance of VPN usage
        return { vpn: { status: false, probability: 0.5 } };
    }

    // If either geoip or localtime is 'unknown', return a default 50% probability
    if (timeZone.geoip === 'unknown' || timeZone.localtime === 'unknown') {
        return { vpn: { status: false, probability: 0.5 } };
    }

    // Normalize both timezone strings before comparison
    const normalizedGeoip = normalizeTimezone(timeZone.geoip);
    const normalizedLocaltime = normalizeTimezone(timeZone.localtime);

    // Compare normalized timezone strings
    const isTimezoneMismatch = normalizedLocaltime !== normalizedGeoip;

    if (isTimezoneMismatch) {
        // Mismatch in timezones, which might indicate VPN usage
        return { vpn: { status: true, probability: 0.75 } }; // Increase probability due to mismatch
    }

    // If timezones match, return a lower probability of VPN usage
    return { vpn: { status: false, probability: 0.2 } }; // Lower probability if there's no mismatch
}
