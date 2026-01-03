//import Hasty from 'hasty-server';
import {getIpInfo} from './geo';
import { isIPv4, isIPv6, extractIPv4FromMapped } from './ip-utils';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();
//const server = new Hasty();
//server.cors(true);
const server = express();
server.use(cors());
const PORT = process.env.PORT || 8080;

// DEPRECATED: API_KEY authentication has been removed
// The API_KEY environment variable is no longer used
// @deprecated API_KEY - Authentication removed for public access
const API_KEY_DEPRECATED = process.env.API_KEY;
if (API_KEY_DEPRECATED) {
  console.warn('⚠️  DEPRECATED: API_KEY environment variable is set but no longer used. Authentication has been removed.');
}

// Add OPTIONS handler for the preflight request
//server.options('*', (req, res) => {
  // This will handle all OPTIONS requests
//  res.handleOptions(req);
//});

/**
 * Get client IP addresses (both IPv4 and IPv6)
 */
const getClientIps = (req: any): { ipv4: string; ipv6: string | null } => {
  let ipv4: string | null = null;
  let ipv6: string | null = null;
  
  // Check for x-forwarded-for header (used if behind a proxy or load balancer)
  const forwardedIps = req.headers['x-forwarded-for'];
  
  // Check for x-real-ip header (alternative proxy header)
  const realIp = req.headers['x-real-ip'];
  
  // Check for x-forwarded-for-v6 header (some proxies use this for IPv6)
  const forwardedIpv6 = req.headers['x-forwarded-for-v6'] || req.headers['x-real-ip-v6'];
  
  // Get socket remote address
  const socketIp = req.socket.remoteAddress;
  
  // Process forwarded IPs (X-Forwarded-For format: client, proxy1, proxy2...)
  // We want the FIRST IP which is the original client IP
  if (forwardedIps) {
    const ipArray = forwardedIps.split(',').map((ip: string) => ip.trim());
    // Process first IP only (original client IP)
    const firstIp = ipArray[0];
    if (firstIp) {
      const mappedIpv4 = extractIPv4FromMapped(firstIp);
      if (mappedIpv4 && isIPv4(mappedIpv4)) {
        ipv4 = mappedIpv4;
      } else if (isIPv4(firstIp)) {
        ipv4 = firstIp;
      } else if (isIPv6(firstIp)) {
        ipv6 = firstIp;
      }
    }
  }
  
  // Process real IP (only if not already set from x-forwarded-for)
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
  
  // Process forwarded IPv6
  if (forwardedIpv6 && isIPv6(forwardedIpv6)) {
    ipv6 = forwardedIpv6;
  }
  
  // Fall back to socket IP
  if (socketIp) {
    const mappedIpv4 = extractIPv4FromMapped(socketIp);
    if (mappedIpv4 && isIPv4(mappedIpv4)) {
      if (!ipv4) ipv4 = mappedIpv4;
    } else if (isIPv4(socketIp)) {
      if (!ipv4) ipv4 = socketIp;
    } else if (isIPv6(socketIp)) {
      if (!ipv6) ipv6 = socketIp;
    }
  }
  
  // Return IPs (ipv4 may be null if not found, which is acceptable)
  // Note: We don't use 127.0.0.1 as fallback because MaxMind databases don't contain localhost data
  return {
    ipv4: ipv4 || null,
    ipv6: ipv6 || null
  };
};
server.get('/', async(req, res) => {
 	const { ipv4, ipv6 } = getClientIps(req);
  
  // DEPRECATED: API key authentication has been removed
  // The x-api-key header is no longer required or checked
  // @deprecated x-api-key header - No longer used, requests are accepted without authentication
  if (req.headers['x-api-key']) {
    console.warn('⚠️  DEPRECATED: x-api-key header is present but no longer required. Authentication has been removed.');
  }

  // Check if we have a valid IP address
  if (!ipv4 && !ipv6) {
    console.warn('No valid IP address found in request');
    res.status(400).json({ 
      error: 'Unable to determine client IP address',
      message: 'No valid IPv4 or IPv6 address found in request headers or socket'
    });
    return;
  }

  try{
    // Use IPv4 for geolocation lookup if available, otherwise use IPv6
    const lookupIp = ipv4 || ipv6;
    if (!lookupIp) {
      res.status(400).json({ 
        error: 'No IP address available for geolocation lookup'
      });
      return;
    }
    
    const response = await getIpInfo(lookupIp);
    
    // If no geolocation data found (e.g., localhost/private IP), return error
    if (!response) {
      res.status(404).json({ 
        error: 'Geolocation data not available',
        message: `No geolocation data found for IP address: ${lookupIp}. This may be a localhost or private IP address.`,
        ip: lookupIp,
        ipv4: ipv4,
        ipv6: ipv6
      });
      return;
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
      response.ip = ipv4 || ipv6; // Primary IP for backward compatibility
      
      // Update traits with IP info
      response.traits.ipAddress = ipv4 || ipv6 || null;
    }
    
    res.json(response);
  }
  catch(e){
    console.error('Error fetching IP info:', e);
    res.status(500).json({ error: 'Failed to retrieve geolocation data' });
  }
  finally{
    // db.insert({ip: req.ip, date: new Date()});
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

