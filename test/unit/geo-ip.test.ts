import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeolocationInfo, fetchGeolocationInfo } from '@/src/geo-ip';

// Mock fetch globally
global.fetch = vi.fn();

describe('Geo-IP Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('fetchGeolocationInfo', () => {
    it('should return valid data when API is accessible', async () => {
      // Mock successful API response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ipAddress: '8.8.8.8',
          country: { isoCode: 'US', name: 'United States' },
          city: { name: 'Mountain View', geonameId: 789012 },
          location: { timeZone: 'America/Los_Angeles', latitude: 37.4056, longitude: -122.0775, accuracyRadius: 50 },
          traits: { isAnonymous: false, ipAddress: '8.8.8.8', network: '8.8.8.0/24' }
        })
      });

      const result = await fetchGeolocationInfo();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('ipAddress');
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('traits');
      
      expect(result.ipAddress).toBe('8.8.8.8');
      expect(result.country.isoCode).toBe('US');
      expect(result.city.name).toBe('Mountain View');
    });

    it('should return mock data when API fails', async () => {
      // Mock API failure
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await fetchGeolocationInfo();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('ipAddress');
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('traits');
      
      // Should return mock data
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.country.isoCode).toBe('US');
      expect(result.country.name).toBe('United States');
    });

    it('should have proper GeolocationInfo structure', async () => {
      const result = await fetchGeolocationInfo();
      
      expect(result).toMatchObject({
        ipAddress: expect.any(String),
        country: {
          isoCode: expect.any(String),
          name: expect.any(String)
        },
        registeredCountry: {
          isoCode: expect.any(String),
          name: expect.any(String),
          isInEuropeanUnion: expect.any(Boolean)
        },
        city: {
          name: expect.any(String),
          geonameId: expect.any(Number)
        },
        continent: {
          code: expect.any(String),
          name: expect.any(String)
        },
        subdivisions: expect.any(Array),
        location: {
          accuracyRadius: expect.any(Number),
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          timeZone: expect.any(String)
        },
        postal: {
          code: expect.any(String)
        },
        traits: {
          isAnonymous: expect.any(Boolean),
          isAnonymousProxy: expect.any(Boolean),
          isAnonymousVpn: expect.any(Boolean),
          isAnycast: expect.any(Boolean),
          isHostingProvider: expect.any(Boolean),
          isLegitimateProxy: expect.any(Boolean),
          isPublicProxy: expect.any(Boolean),
          isResidentialProxy: expect.any(Boolean),
          isSatelliteProvider: expect.any(Boolean),
          isTorExitNode: expect.any(Boolean),
          ipAddress: expect.any(String),
          network: expect.any(String)
        }
      });
    });

    it('should provide consistent mock data', async () => {
      // Mock API failure to ensure we get consistent mock data
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result1 = await fetchGeolocationInfo();
      const result2 = await fetchGeolocationInfo();
      
      expect(result1).toEqual(result2);
    });

    it('should never return null', async () => {
      // Test various failure scenarios
      const scenarios = [
        () => (global.fetch as any).mockRejectedValue(new Error('Network error')),
        () => (global.fetch as any).mockResolvedValue({ ok: false, statusText: 'Not Found' }),
        () => (global.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve(null) }),
        () => (global.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
      ];

      for (const scenario of scenarios) {
        scenario();
        const result = await fetchGeolocationInfo();
        expect(result).not.toBeNull();
        expect(result).toBeDefined();
        expect(result).toHaveProperty('ipAddress');
      }
    });

    it('should validate mock data structure', async () => {
      // Force mock data by causing API failure
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await fetchGeolocationInfo();
      
      // Validate specific mock data values
      expect(result.city.name).toBe('New York');
      expect(result.location.timeZone).toBe('America/New_York');
      expect(result.postal.code).toBe('10001');
      expect(result.traits.isAnonymous).toBe(false);
      expect(result.traits.network).toBe('192.168.1.0/24');
    });

    it('should have valid subdivision structure', async () => {
      // Force mock data
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await fetchGeolocationInfo();
      
      expect(result.subdivisions).toHaveLength(1);
      expect(result.subdivisions[0]).toEqual({
        isoCode: 'NY',
        name: 'New York'
      });
    });

    it('should handle malformed API responses gracefully', async () => {
      // Mock malformed response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalidData: true })
      });
      
      const result = await fetchGeolocationInfo();
      
      // Should still return valid GeolocationInfo structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('traits');
    });

    it('should handle partial API responses', async () => {
      // Mock partial response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ipAddress: '1.2.3.4',
          country: { isoCode: 'GB', name: 'United Kingdom' }
          // Missing other fields
        })
      });
      
      const result = await fetchGeolocationInfo();
      
      expect(result.ipAddress).toBe('1.2.3.4');
      expect(result.country.isoCode).toBe('GB');
      // Should have fallback values for missing fields
      expect(result.city).toBeDefined();
      expect(result.location).toBeDefined();
      expect(result.traits).toBeDefined();
    });
  });

  describe('GeolocationInfo type validation', () => {
    it('should have correct type structure', () => {
      const geoInfo: GeolocationInfo = {
        ipAddress: '192.168.1.1',
        country: { isoCode: 'US', name: 'United States' },
        registeredCountry: { isoCode: 'US', name: 'United States', isInEuropeanUnion: false },
        city: { name: 'San Francisco', geonameId: 123456 },
        continent: { code: 'NA', name: 'North America' },
        subdivisions: [{ isoCode: 'CA', name: 'California' }],
        location: {
          accuracyRadius: 100,
          latitude: 37.7749,
          longitude: -122.4194,
          timeZone: 'America/Los_Angeles'
        },
        postal: { code: '94102' },
        traits: {
          isAnonymous: false,
          isAnonymousProxy: false,
          isAnonymousVpn: false,
          isAnycast: false,
          isHostingProvider: false,
          isLegitimateProxy: false,
          isPublicProxy: false,
          isResidentialProxy: false,
          isSatelliteProvider: false,
          isTorExitNode: false,
          ipAddress: '192.168.1.1',
          network: '192.168.1.0/24'
        }
      };

      expect(typeof geoInfo.ipAddress).toBe('string');
      expect(typeof geoInfo.country.isoCode).toBe('string');
      expect(typeof geoInfo.location.latitude).toBe('number');
      expect(typeof geoInfo.location.longitude).toBe('number');
      expect(typeof geoInfo.traits.isAnonymous).toBe('boolean');
    });

    it('should support optional properties', () => {
      const geoInfo: GeolocationInfo = {
        ipAddress: '192.168.1.1',
        country: { isoCode: 'US', name: 'United States' },
        registeredCountry: { isoCode: 'US', name: 'United States' }, // isInEuropeanUnion is optional
        city: { name: 'San Francisco', geonameId: 123456 },
        continent: { code: 'NA', name: 'North America' },
        subdivisions: [],
        location: {
          accuracyRadius: 100,
          latitude: 37.7749,
          longitude: -122.4194,
          timeZone: 'America/Los_Angeles'
        },
        postal: { code: '94102' },
        traits: {
          isAnonymous: false,
          isAnonymousProxy: false,
          isAnonymousVpn: false,
          isAnycast: false,
          isHostingProvider: false,
          isLegitimateProxy: false,
          isPublicProxy: false,
          isResidentialProxy: false,
          isSatelliteProvider: false,
          isTorExitNode: false,
          ipAddress: '192.168.1.1',
          network: '192.168.1.0/24'
        }
      };

      expect(geoInfo.registeredCountry.isInEuropeanUnion).toBeUndefined();
      expect(geoInfo.subdivisions).toHaveLength(0);
    });
  });
}); 