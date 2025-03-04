import { Reader } from '@maxmind/geoip2-node';

// Define types for the response
interface CityResponse {
  country?: {
    isoCode?: string;
    names?: Record<string, string>;
  };
  city?: {
    names: {
      en: string;
    };
  };
  location?: {
    latitude: number;
    longitude: number;
    timeZone: string;
    accuracyRadius: number;
  };
  postal?: {
    code?: string;
  };
  continent?: {
    code?: string;
    names?: Record<string, string>;
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
  subdivisions?: Array<{ isoCode: string; names?: Record<string, string> }>;
  asn?: {
    autonomousSystemNumber?: number;
    autonomousSystemOrganization?: string;
  };
}

export async function getIpInfo(ipAddress: string) {
  try {
    // Open the MaxMind databases for City, Country, and ASN
    const cityReader = await Reader.open('../city/city.mmdb');
    const countryReader = await Reader.open('../country/country.mmdb');
    const asnReader = await Reader.open('../asn/asn.mmdb');	
    
    // Make the query for the City database
    const cityResponse: CityResponse = cityReader.city(ipAddress);
    
    // Make the query for the Country database
    const countryResponse: CityResponse = countryReader.country(ipAddress);
    
    // Make the query for the ASN database
    const asnResponse: CityResponse =  asnReader.asn(ipAddress);
    
    // Combine the responses
    const combinedResponse: CityResponse = {
      ...cityResponse,
      country: {
        ...countryResponse.country,
        ...cityResponse.country,  // Merge city-level country info with the country database info
      },
      city: cityResponse.city,  // City-level data will come from city database
      location: cityResponse.location,
      postal: cityResponse.postal,
      continent: cityResponse.continent,
      traits: cityResponse.traits,
      subdivisions: cityResponse.subdivisions || countryResponse.subdivisions,
      asn: asnResponse.asn,  // Merge ASN information
    };
    
    // Perform validation: Compare the country name from the city and country databases
    const cityCountryName = cityResponse.country?.names?.en;
    const countryCountryName = countryResponse.country?.names?.en;
    
    if (cityCountryName && countryCountryName) {
      if (cityCountryName === countryCountryName) {
        console.log(`Country Name is the same: ${cityCountryName}`);
      } else {
        console.log(`Country Name mismatch! City DB: ${cityCountryName}, Country DB: ${countryCountryName}`);
      }
    }

    // Perform validation: Compare the city name from the city database
    const cityName = cityResponse.city?.names?.en;
    
    if (cityName) {
      console.log(`City Name from City DB: ${cityName}`);
    } else {
      console.log("No city name found in City DB");
    }

    // Perform validation: Compare ASN info (if available)
    const asnNumber = asnResponse.asn?.autonomousSystemNumber;
    const asnOrganization = asnResponse.asn?.autonomousSystemOrganization;

    if (asnNumber && asnOrganization) {
      console.log(`ASN Number: ${asnNumber}, ASN Organization: ${asnOrganization}`);
    } else {
      console.log("No ASN info found in ASN DB");
    }

    // Log the full combined response object
    console.log(JSON.stringify(combinedResponse, null, 2));

    // You can still access specific fields if needed
    if (combinedResponse.country?.isoCode) {
      console.log(`Country ISO Code: ${combinedResponse.country.isoCode}`);
    }

    if (combinedResponse.city?.names.en) {
      console.log(`City: ${combinedResponse.city.names.en}`);
    }

    if (combinedResponse.location) {
      console.log(`Location: Latitude ${combinedResponse.location.latitude}, Longitude ${combinedResponse.location.longitude}`);
    }
    return combinedResponse;

  } catch (error) {
    console.error('Error reading city, country, or ASN data:', error);
    return null;
  }
}

getIpInfo('103.83.40.10');

