// Cloudflare Workers version of geo.ts
// Note: MaxMind library requires Node.js modules that aren't fully compatible with Workers
// This implementation uses IP-API as the primary geolocation service
// MaxMind database support can be added later with a Workers-compatible library

/**
 * Simple structured logger for Cloudflare Workers
 * Provides consistent logging format with structured data
 */
class StructuredLogger {
  private static formatMessage(level: string, operation: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${operation}] ${message}`;
    
    if (data) {
      formattedMessage += ` ${JSON.stringify(data)}`;
    }
    
    return formattedMessage;
  }
  
  static error(operation: string, message: string, data?: any): void {
    console.error(this.formatMessage('error', operation, message, data));
  }
  
  static warn(operation: string, message: string, data?: any): void {
    console.warn(this.formatMessage('warn', operation, message, data));
  }
  
  static info(operation: string, message: string, data?: any): void {
    console.info(this.formatMessage('info', operation, message, data));
  }
  
  static debug(operation: string, message: string, data?: any): void {
    console.log(this.formatMessage('debug', operation, message, data));
  }
}

// Define types for the response
interface SimplifiedCityResponse {
  /** Primary IP address (IPv4 for backward compatibility) */
  ip?: string;
  /** IPv4 address (guaranteed to be present) */
  ipv4?: string;
  /** IPv6 address (null if not available) */
  ipv6?: string | null;
  country?: {
    isoCode?: string;
    name?: string;
  };
  registeredCountry?: {
    isoCode?: string;
    name?: string;
    isInEuropeanUnion?: boolean;
  };
  city?: {
    name?: string;
    geonameId?: number;
  };
  continent?: {
    code?: string;
    name?: string;
  };
  subdivisions?: Array<{
    isoCode?: string;
    name?: string;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    timeZone: string;
    accuracyRadius: number;
  } | undefined;
  postal?: {
    code?: string;
  };
  traits?: {
    ipAddress?: string;
    network?: string;
    isAnonymous?: boolean;
    isAnonymousProxy?: boolean;
    isAnonymousVpn?: boolean;
    isAnycast?: boolean;
    isHostingProvider?: boolean;
    isLegitimateProxy?: boolean;
    isPublicProxy?: boolean;
    isResidentialProxy?: boolean;
    isSatelliteProvider?: boolean;
    isTorExitNode?: boolean;
  };
  asn?: {
    autonomousSystemNumber?: number;
    autonomousSystemOrganization?: string;
  };
}

// Note: MaxMind database support is disabled for now due to Node.js dependencies
// The worker uses IP-API as the geolocation service
// Future: Can implement Workers-compatible MaxMind reader if needed

/**
 * Check if an IP address is localhost or private (not routable on the internet)
 */
function isPrivateOrLocalhost(ip: string): boolean {
  if (!ip) return false;

  // IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;

  // IPv4 localhost
  if (ip === '127.0.0.1' || ip.startsWith('127.')) return true;

  // Private IP ranges
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('10.')) return true;

  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }
  }

  return false;
}

// MaxMind database support is currently disabled
// The @maxmind/geoip2-node library requires Node.js modules (fs, net, etc.)
// that aren't fully compatible with Cloudflare Workers
// Using IP-API as the geolocation service instead

/**
 * IP-API response interface
 */
interface IpApiResponse {
  status: string;
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  proxy?: boolean;
  hosting?: boolean;
  continent?: string;
  continentCode?: string;
}

/**
 * Fallback to IP-API service
 */
async function getIpInfoFromAPI(ipAddress: string): Promise<SimplifiedCityResponse | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as IpApiResponse;

    if (data.status !== 'success') {
      throw new Error(data.message || 'Geolocation lookup failed');
    }

    return {
      country: {
        isoCode: data.countryCode,
        name: data.country,
      },
      city: {
        name: data.city,
      },
      continent: {
        code: data.continentCode,
        name: data.continent,
      },
      subdivisions: data.regionName
        ? [
            {
              isoCode: data.region,
              name: data.regionName,
            },
          ]
        : undefined,
      location:
        data.lat !== undefined && data.lon !== undefined && data.timezone !== undefined
          ? {
              latitude: data.lat,
              longitude: data.lon,
              timeZone: data.timezone,
              accuracyRadius: 0,
            }
          : undefined,
      postal: {
        code: data.zip,
      },
      traits: {
        ipAddress: ipAddress,
        isAnonymous: data.proxy || false,
        isHostingProvider: data.hosting || false,
        isAnonymousProxy: false,
        isAnonymousVpn: false,
        isAnycast: false,
        isLegitimateProxy: false,
        isPublicProxy: false,
        isResidentialProxy: false,
        isSatelliteProvider: false,
        isTorExitNode: false,
        network: `${ipAddress}/32`,
      },
      asn: {
        autonomousSystemNumber: parseInt(data.as?.split(' ')[0]?.replace('AS', '') || '0'),
        autonomousSystemOrganization: data.isp || data.org,
      },
    };
  } catch (error) {
    StructuredLogger.error('getIpInfoFromAPI', 'Error getting IP geo info from API', { error, ip: ipAddress });
    return null;
  }
}

/**
 * Get IP geolocation information
 * Uses MaxMind databases from R2 if available, falls back to IP-API
 */
export async function getIpInfo(
  ipAddress: string,
  env: any
): Promise<SimplifiedCityResponse | null> {
  StructuredLogger.info('getIpInfo', 'Looking up IP', { ip: ipAddress });

  // Skip localhost/private IPs
  if (isPrivateOrLocalhost(ipAddress)) {
    StructuredLogger.warn('getIpInfo', 'Skipping geolocation lookup for localhost/private IP', { ip: ipAddress });
    return null;
  }

  // Use IP-API for geolocation (MaxMind requires Node.js modules not available in Workers)
  // Future: Can implement Workers-compatible MaxMind reader if needed
  return await getIpInfoFromAPI(ipAddress);
}

