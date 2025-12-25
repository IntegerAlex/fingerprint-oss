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
 * Check if an IP address is IPv4
 */
function isIPv4(ip: string): boolean {
  if (!ip) return false;
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4Regex.test(ip);
}

/**
 * Check if an IP address is IPv6
 */
function isIPv6(ip: string): boolean {
  if (!ip) return false;
  // IPv6 can be in various formats: full, compressed, with brackets, etc.
  return ip.includes(':') && !ip.startsWith('::ffff:'); // Exclude IPv4-mapped IPv6
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
  
  // Process forwarded IPs
  if (forwardedIps) {
    const ipArray = forwardedIps.split(',').map(ip => ip.trim());
    for (const ip of ipArray) {
      const mappedIpv4 = extractIPv4FromMapped(ip);
      if (mappedIpv4 && isIPv4(mappedIpv4)) {
        ipv4 = mappedIpv4;
      } else if (isIPv4(ip)) {
        ipv4 = ip;
      } else if (isIPv6(ip)) {
        ipv6 = ip;
      }
    }
  }
  
  // Process real IP
  if (realIp) {
    const mappedIpv4 = extractIPv4FromMapped(realIp);
    if (mappedIpv4 && isIPv4(mappedIpv4)) {
      ipv4 = mappedIpv4;
    } else if (isIPv4(realIp)) {
      ipv4 = realIp;
    } else if (isIPv6(realIp)) {
      ipv6 = realIp;
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
    res.json({error: null})
  }
  finally{
    // db.insert({ip: req.ip, date: new Date()});
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

