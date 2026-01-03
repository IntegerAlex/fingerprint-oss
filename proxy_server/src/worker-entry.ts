import { getIpInfo } from './geo-worker';
import { isIPv4, isIPv6, extractIPv4FromMapped } from './ip-utils';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/**
 * Get client IP addresses from Cloudflare Workers request
 */
function getClientIps(request: Request, env: any): { ipv4: string | null; ipv6: string | null } {
  let ipv4: string | null = null;
  let ipv6: string | null = null;

  // Cloudflare Workers provides IP in request.cf
  const cf = (request as any).cf;
  if (cf?.ip) {
    const mappedIpv4 = extractIPv4FromMapped(cf.ip);
    if (mappedIpv4 && isIPv4(mappedIpv4)) {
      ipv4 = mappedIpv4;
    } else if (isIPv4(cf.ip)) {
      ipv4 = cf.ip;
    } else if (isIPv6(cf.ip)) {
      ipv6 = cf.ip;
    }
  }

  // Check for x-forwarded-for header
  const forwardedIps = request.headers.get('x-forwarded-for');
  if (forwardedIps) {
    const ipArray = forwardedIps.split(',').map(ip => ip.trim());
    const firstIp = ipArray[0];
    if (firstIp) {
      const mappedIpv4 = extractIPv4FromMapped(firstIp);
      if (mappedIpv4 && isIPv4(mappedIpv4)) {
        if (!ipv4) ipv4 = mappedIpv4;
      } else if (isIPv4(firstIp)) {
        if (!ipv4) ipv4 = firstIp;
      } else if (isIPv6(firstIp)) {
        if (!ipv6) ipv6 = firstIp;
      }
    }
  }

  // Check for x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    const mappedIpv4 = extractIPv4FromMapped(realIp);
    if (mappedIpv4 && isIPv4(mappedIpv4)) {
      if (!ipv4) ipv4 = mappedIpv4;
    } else if (isIPv4(realIp)) {
      if (!ipv4) ipv4 = realIp;
    } else if (isIPv6(realIp)) {
      if (!ipv6) ipv6 = realIp;
    }
  }

  // Check for x-forwarded-for-v6 or x-real-ip-v6
  const forwardedIpv6 = request.headers.get('x-forwarded-for-v6') || request.headers.get('x-real-ip-v6');
  if (forwardedIpv6 && isIPv6(forwardedIpv6)) {
    if (!ipv6) ipv6 = forwardedIpv6;
  }

  return {
    ipv4: ipv4 || null,
    ipv6: ipv6 || null
  };
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only handle GET requests to root path
    if (request.method !== 'GET' || url.pathname !== '/') {
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    try {
      // Get client IP addresses
      const { ipv4, ipv6 } = getClientIps(request, env);

      // Check if we have a valid IP address
      if (!ipv4 && !ipv6) {
        return new Response(
          JSON.stringify({
            error: 'Unable to determine client IP address',
            message: 'No valid IPv4 or IPv6 address found in request',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Use IPv4 for geolocation lookup if available, otherwise use IPv6
      const lookupIp = ipv4 || ipv6;
      if (!lookupIp) {
        return new Response(
          JSON.stringify({
            error: 'No IP address available for geolocation lookup',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Get geolocation info
      const response = await getIpInfo(lookupIp, env);

      // If no geolocation data found (e.g., localhost/private IP), return error
      if (!response) {
        return new Response(
          JSON.stringify({
            error: 'Geolocation data not available',
            message: `No geolocation data found for IP address: ${lookupIp}. This may be a localhost or private IP address.`,
            ip: lookupIp,
            ipv4: ipv4,
            ipv6: ipv6,
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Add IP information to the response
      if (response) {
        // Ensure traits object exists
        if (!response.traits) {
          response.traits = {};
        }

        // Add IP addresses to response
        response.ipv4 = ipv4;
        response.ipv6 = ipv6;
        response.ip = ipv4; // Primary IP for backward compatibility

        // Update traits with IP info
        response.traits.ipAddress = ipv4 || null;
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      console.error('Error processing request:', e);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve geolocation data' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};

