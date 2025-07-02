import { describe, it, expect } from 'vitest';
import { getVpnStatus } from '@/src/vpn';

describe('VPN Detection Module', () => {
  describe('getVpnStatus', () => {
    it('should return 50% probability when timeZone is null or undefined', async () => {
      let result = await getVpnStatus(null as any);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });

      result = await getVpnStatus(undefined as any);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });

      result = await getVpnStatus({});
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should return 50% probability when geoip is missing', async () => {
      const timeZone = {
        localtime: 'America/New_York'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should return 50% probability when localtime is missing', async () => {
      const timeZone = {
        geoip: 'America/New_York'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should return 50% probability when geoip is "unknown"', async () => {
      const timeZone = {
        geoip: 'unknown',
        localtime: 'America/New_York'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should return 50% probability when localtime is "unknown"', async () => {
      const timeZone = {
        geoip: 'America/New_York',
        localtime: 'unknown'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should return 50% probability when both timezones are "unknown"', async () => {
      const timeZone = {
        geoip: 'unknown',
        localtime: 'unknown'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should return low VPN probability when timezones match exactly', async () => {
      const timeZone = {
        geoip: 'America/New_York',
        localtime: 'America/New_York'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.2 } });
    });

    it('should return high VPN probability when timezones mismatch', async () => {
      const timeZone = {
        geoip: 'America/New_York',
        localtime: 'Europe/London'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: true, probability: 0.75 } });
    });

    it('should handle timezone aliases correctly', async () => {
      // Test common timezone aliases that should be normalized to the same value
      const testCases = [
        {
          geoip: 'America/New_York',
          localtime: 'US/Eastern', // Should be normalized to America/New_York
          expected: { vpn: { status: false, probability: 0.2 } }
        },
        {
          geoip: 'Europe/London',
          localtime: 'GB', // Should be normalized to Europe/London
          expected: { vpn: { status: false, probability: 0.2 } }
        },
        {
          geoip: 'Asia/Tokyo',
          localtime: 'JST', // Should be normalized to Asia/Tokyo
          expected: { vpn: { status: false, probability: 0.2 } }
        }
      ];

      for (const testCase of testCases) {
        const result = await getVpnStatus({
          geoip: testCase.geoip,
          localtime: testCase.localtime
        });
        expect(result).toEqual(testCase.expected);
      }
    });

    it('should handle whitespace in timezone strings', async () => {
      const timeZone = {
        geoip: '  America/New_York  ',
        localtime: ' America/New_York '
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.2 } });
    });

    it('should detect VPN when aliases point to different timezones', async () => {
      const timeZone = {
        geoip: 'America/New_York',
        localtime: 'Europe/Paris' // Different timezone, should indicate VPN
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: true, probability: 0.75 } });
    });

    it('should handle case sensitivity correctly', async () => {
      const timeZone = {
        geoip: 'america/new_york',
        localtime: 'AMERICA/NEW_YORK'
      };
      
      const result = await getVpnStatus(timeZone);
      // Since these don't match exactly and aren't in the alias map, 
      // they should be treated as different timezones
      expect(result).toEqual({ vpn: { status: true, probability: 0.75 } });
    });

    it('should handle null values in timezone properties', async () => {
      const timeZone = {
        geoip: null,
        localtime: 'America/New_York'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should handle undefined values in timezone properties', async () => {
      const timeZone = {
        geoip: 'America/New_York',
        localtime: undefined
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should handle empty string values', async () => {
      const timeZone = {
        geoip: '',
        localtime: 'America/New_York'
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: false, probability: 0.5 } });
    });

    it('should handle common geographic mismatches', async () => {
      const vpnTestCases = [
        {
          geoip: 'America/New_York',
          localtime: 'Asia/Shanghai'
        },
        {
          geoip: 'Europe/London',
          localtime: 'America/Los_Angeles'
        },
        {
          geoip: 'Asia/Tokyo',
          localtime: 'Australia/Sydney'
        }
      ];

      for (const testCase of vpnTestCases) {
        const result = await getVpnStatus(testCase);
        expect(result).toEqual({ vpn: { status: true, probability: 0.75 } });
      }
    });

    it('should handle regional timezone matches within same area', async () => {
      const timeZone = {
        geoip: 'America/New_York',
        localtime: 'America/Chicago' // Different US timezones, should indicate VPN
      };
      
      const result = await getVpnStatus(timeZone);
      expect(result).toEqual({ vpn: { status: true, probability: 0.75 } });
    });

    it('should return consistent results for multiple calls with same input', async () => {
      const timeZone = {
        geoip: 'Europe/Berlin',
        localtime: 'Asia/Tokyo'
      };
      
      const result1 = await getVpnStatus(timeZone);
      const result2 = await getVpnStatus(timeZone);
      
      expect(result1).toEqual(result2);
      expect(result1).toEqual({ vpn: { status: true, probability: 0.75 } });
    });
  });
}); 