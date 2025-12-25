//import Hasty from 'hasty-server';
import {getIpInfo} from './geo';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();
//const server = new Hasty();
//server.cors(true);
const server = express();
server.use(cors());
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || '123';

// Add OPTIONS handler for the preflight request
//server.options('*', (req, res) => {
  // This will handle all OPTIONS requests
//  res.handleOptions(req);
//});
/**
 * Check if an IP address is IPv4 with proper octet validation
 */
function isIPv4(ip: string): boolean {
  if (!ip) return false;
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ipv4Regex.exec(ip);
  if (!match) return false;
  return match.slice(1, 5).every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Check if an IP address is IPv6 with proper validation
 */
function isIPv6(ip: string): boolean {
  if (!ip) return false;
  // Exclude IPv4-mapped IPv6 addresses
  if (ip.startsWith('::ffff:')) return false;
  // Basic IPv6 check: must contain colons and only valid hex chars/colons
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  return ip.includes(':') && ipv6Regex.test(ip);
}

/**
 * Extract IPv4 from IPv4-mapped IPv6 address (::ffff:192.168.1.1)
 */
function extractIPv4FromMapped(ip: string): string | null {
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return null;
}

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
  
  // Ensure we always have at least IPv4 (guaranteed)
  // If we don't have IPv4, use a fallback
  if (!ipv4) {
    ipv4 = '127.0.0.1'; // Fallback to localhost if no IPv4 found
  }
  
  return {
    ipv4: ipv4,
    ipv6: ipv6 || null
  };
};
server.get('/', async(req, res) => {
 	const { ipv4, ipv6 } = getClientIps(req);
  
  // Skip API key check for OPTIONS requests
    if(req.headers === undefined){
      console.log('headers undefined');
      res.status(403).send('Forbidden');
      return;
    }
    if(!req.headers['x-api-key']){
      console.log('api key not found');
      res.status(403).send('Forbidden');
      return;
    }
    if(req.headers['x-api-key'] !== API_KEY){
      console.log('api key not match');
      res.status(403).send('Forbidden');
      return;
  }

  try{
    // Use IPv4 for geolocation lookup (guaranteed to exist)
    const response = await getIpInfo(ipv4);
    
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
      response.traits.ipAddress = ipv4;
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

