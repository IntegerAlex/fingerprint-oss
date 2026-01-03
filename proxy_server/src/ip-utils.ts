/**
 * IP address utility functions
 * Shared utilities for IPv4/IPv6 validation and extraction
 */

/**
 * Check if an IP address is IPv4 with proper octet validation
 */
export function isIPv4(ip: string): boolean {
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
export function isIPv6(ip: string): boolean {
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
export function extractIPv4FromMapped(ip: string): string | null {
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return null;
}

