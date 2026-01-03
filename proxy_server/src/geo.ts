import { Reader } from '@maxmind/geoip2-node';
import path from 'path';

// Define types for the response with only essential fields and 'en' names
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
  };
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

export async function getIpInfo(ipAddress: string): Promise<SimplifiedCityResponse | null> {
  console.log(ipAddress);
  
  // Skip localhost/private IPs that won't be in the database
  if (isPrivateOrLocalhost(ipAddress)) {
    console.warn(`Skipping geolocation lookup for localhost/private IP: ${ipAddress}`);
    return null;
  }
  
  try {
    // Open the MaxMind databases
    const cityReader = await Reader.open(path.join(__dirname, '../city/city.mmdb'));
    const countryReader = await Reader.open(path.join(__dirname, '../country/country.mmdb'));
    const asnReader = await Reader.open(path.join(__dirname, '../asn/asn.mmdb'));

    // Query databases with error handling for addresses not in database
    let cityResponse, countryResponse, asnResponse;
    
    try {
      cityResponse = cityReader.city(ipAddress);
    } catch (error: any) {
      if (error.name === 'AddressNotFoundError') {
        console.warn(`Address ${ipAddress} not found in city database`);
        cityResponse = null;
      } else {
        throw error;
      }
    }
    
    try {
      countryResponse = countryReader.country(ipAddress);
    } catch (error: any) {
      if (error.name === 'AddressNotFoundError') {
        console.warn(`Address ${ipAddress} not found in country database`);
        countryResponse = null;
      } else {
        throw error;
      }
    }
    
    try {
      asnResponse = asnReader.asn(ipAddress);
    } catch (error: any) {
      if (error.name === 'AddressNotFoundError') {
        console.warn(`Address ${ipAddress} not found in ASN database`);
        asnResponse = null;
      } else {
        throw error;
      }
    }
    
    // If no data found in any database, return null
    if (!cityResponse && !countryResponse && !asnResponse) {
      console.warn(`No geolocation data found for IP: ${ipAddress}`);
      return null;
    }

    // Helper to get 'en' name safely
    const getEnName = (names?: Record<string, string>) => names?.en;

    // Build simplified response (handle null responses gracefully)
    const simplifiedResponse: SimplifiedCityResponse = {
      country: {
        isoCode: countryResponse?.country?.isoCode ?? cityResponse?.country?.isoCode,
        name: getEnName(countryResponse?.country?.names as unknown as Record<string, string>) ?? getEnName(cityResponse?.country?.names as unknown as Record<string, string>),
      },
      registeredCountry: cityResponse?.registeredCountry ? {
        isoCode: cityResponse.registeredCountry.isoCode,
        name: getEnName(cityResponse.registeredCountry.names as unknown as Record<string, string>),
        isInEuropeanUnion: cityResponse.registeredCountry.isInEuropeanUnion,
      } : undefined,
      city: cityResponse?.city ? {
        name: getEnName(cityResponse.city.names as unknown as Record<string, string>),
        geonameId: cityResponse.city.geonameId,
      } : undefined,
      continent: cityResponse?.continent ? {
        code: cityResponse.continent.code,
        name: getEnName(cityResponse.continent.names as unknown as Record<string, string>),
      } : undefined,
      subdivisions: cityResponse?.subdivisions?.map(sub => ({
        isoCode: sub.isoCode,
        name: getEnName(sub.names as unknown as Record<string, string>),
      })),
      location: cityResponse?.location as { latitude: number; longitude: number; timeZone: string; accuracyRadius: number; } | undefined,
      postal: cityResponse?.postal,
      traits: cityResponse?.traits,
      asn: asnResponse ? {
        autonomousSystemNumber: asnResponse.autonomousSystemNumber,
        autonomousSystemOrganization: asnResponse.autonomousSystemOrganization,
      } : undefined,
    };

    // Return the simplified response as a JavaScript object
    return simplifiedResponse;

  } catch (error) {
    console.error('Error reading geo data:', error);
    return null;
  }
}

// Async function to call getIpInfo
async function callGetIpInfo() {
  const result = await getIpInfo("103.82.43.60");
  console.log(result); // This will log the response
}

callGetIpInfo(); // Calling the async function

