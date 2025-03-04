import { Reader } from '@maxmind/geoip2-node';
import path from 'path';

// Define types for the response with only essential fields and 'en' names
interface SimplifiedCityResponse {
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

export async function getIpInfo(ipAddress: string): Promise<SimplifiedCityResponse | null> {
  console.log(ipAddress);
  try {
    // Open the MaxMind databases
    const cityReader = await Reader.open(path.join(__dirname, '../city/city.mmdb'));
    const countryReader = await Reader.open(path.join(__dirname, '../country/country.mmdb'));
    const asnReader = await Reader.open(path.join(__dirname, '../asn/asn.mmdb'));

    // Query databases
    const cityResponse = cityReader.city(ipAddress);
    const countryResponse = countryReader.country(ipAddress);
    const asnResponse = asnReader.asn(ipAddress);

    // Helper to get 'en' name safely
    const getEnName = (names?: Record<string, string>) => names?.en;

    // Build simplified response
    const simplifiedResponse: SimplifiedCityResponse = {
      country: {
        isoCode: countryResponse.country?.isoCode ?? cityResponse.country?.isoCode,
        name: getEnName(countryResponse.country?.names) ?? getEnName(cityResponse.country?.names),
      },
      registeredCountry: cityResponse.registeredCountry ? {
        isoCode: cityResponse.registeredCountry.isoCode,
        name: getEnName(cityResponse.registeredCountry.names),
        isInEuropeanUnion: cityResponse.registeredCountry.isInEuropeanUnion,
      } : undefined,
      city: cityResponse.city ? {
        name: getEnName(cityResponse.city.names),
        geonameId: cityResponse.city.geonameId,
      } : undefined,
      continent: cityResponse.continent ? {
        code: cityResponse.continent.code,
        name: getEnName(cityResponse.continent.names),
      } : undefined,
      subdivisions: cityResponse.subdivisions?.map(sub => ({
        isoCode: sub.isoCode,
        name: getEnName(sub.names),
      })),
      location: cityResponse.location,
      postal: cityResponse.postal,
      traits: cityResponse.traits,
      asn: asnResponse.asn,
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

