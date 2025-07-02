import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateJSON } from '@/src/json';
import { GeolocationInfo } from '@/src/geo-ip';
import { SystemInfo } from '@/src/types';

// Mock the VPN module
vi.mock('@/src/vpn', () => ({
  getVpnStatus: vi.fn().mockResolvedValue({ vpn: { status: false, probability: 0.5 } })
}));

// Mock the hash module
vi.mock('@/src/hash', () => ({
  generateId: vi.fn().mockResolvedValue('mock-hash-12345')
}));



describe('JSON Module', () => {
  let mockGeolocationInfo: GeolocationInfo;
  let mockSystemInfo: SystemInfo;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockGeolocationInfo = {
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

    mockSystemInfo = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      screenResolution: [1920, 1080],
      colorDepth: 24,
      colorGamut: 'srgb',
      os: { os: 'Windows', version: '10' },
      webGL: { vendor: 'Google Inc.', renderer: 'ANGLE', imageHash: 'mock_hash' },
      canvas: { winding: true, geometry: 'canvas-geom', text: 'canvas-text' },
      audio: 123.456,
      fontPreferences: { detectedFonts: ['Arial', 'Times'] },
      mathConstants: { acos: 1.23, acosh: 2.34, asinh: 3.45, atanh: 4.56, expm1: 5.67, sinh: 6.78, cosh: 7.89, tanh: 8.90 },
      plugins: [],
      languages: ['en-US', 'en'],
      timezone: 'America/New_York',
      incognito: { isPrivate: false, browserName: 'Chrome' },
      bot: { isBot: false, signals: [], confidence: 0.1 },
      cookiesEnabled: true,
      doNotTrack: '1',
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
      vendor: 'Google Inc.',
      vendorFlavors: ['Chrome'],
      confidenceScore: 0.85,
             hardwareConcurrency: 8,
       deviceMemory: 8
    };
  });

  describe('generateJSON', () => {
    it('should generate JSON with system confidence assessment', async () => {
      const result = await generateJSON(mockGeolocationInfo, mockSystemInfo);
      
      expect(result).toHaveProperty('confidenceAssessment');
      expect(result.confidenceAssessment).toHaveProperty('system');
      expect(result.confidenceAssessment.system).toMatchObject({
        score: 0.85,
        rating: expect.any(String),
        description: expect.any(String),
        reliability: expect.any(String),
        level: expect.any(String),
        factors: expect.any(String)
      });
    });

    it('should include combined confidence when provided', async () => {
      const combinedScore = 0.75;
      const result = await generateJSON(mockGeolocationInfo, mockSystemInfo, combinedScore);
      
      expect(result.confidenceAssessment).toHaveProperty('combined');
      expect(result.confidenceAssessment.combined).toMatchObject({
        score: 0.75,
        rating: expect.any(String),
        description: expect.any(String),
        reliability: expect.any(String),
        level: expect.any(String),
        factors: expect.any(String)
      });
    });

    it('should include geolocation information when provided', async () => {
      const result = await generateJSON(mockGeolocationInfo, mockSystemInfo);
      
      expect(result).toHaveProperty('geolocation');
      expect(result.geolocation).toMatchObject({
        vpnStatus: { vpn: { status: false, probability: 0.5 } },
        ip: '192.168.1.1',
        city: 'San Francisco',
        region: { isoCode: 'CA', name: 'California' },
        country: { isoCode: 'US', name: 'United States' },
        continent: { code: 'NA', name: 'North America' },
        location: {
          accuracyRadius: 100,
          latitude: 37.7749,
          longitude: -122.4194,
          timeZone: 'America/Los_Angeles'
        },
        traits: {
          isAnonymous: false,
          isAnonymousProxy: false,
          isAnonymousVpn: false,
          network: '192.168.1.0/24'
        }
      });
    });

    it('should handle null geolocation gracefully', async () => {
      const result = await generateJSON(null, mockSystemInfo);
      
      expect(result).toHaveProperty('geolocation');
      expect(result.geolocation).toBeNull();
    });

    it('should include system information', async () => {
      const result = await generateJSON(mockGeolocationInfo, mockSystemInfo);
      
      expect(result).toHaveProperty('systemInfo');
      expect(result.systemInfo).toEqual(mockSystemInfo);
    });

    it('should include generated hash', async () => {
      const result = await generateJSON(mockGeolocationInfo, mockSystemInfo);
      
      expect(result).toHaveProperty('hash');
      expect(result.hash).toBe('mock-hash-12345');
    });

    it('should interpret different confidence levels correctly', async () => {
      // Test high confidence
      const highConfidenceSystem = { ...mockSystemInfo, confidenceScore: 0.9 };
      const highResult = await generateJSON(mockGeolocationInfo, highConfidenceSystem);
      expect(highResult.confidenceAssessment.system.level).toBe('high');
      expect(highResult.confidenceAssessment.system.rating).toBe('High Confidence');

      // Test medium confidence
      const mediumConfidenceSystem = { ...mockSystemInfo, confidenceScore: 0.6 };
      const mediumResult = await generateJSON(mockGeolocationInfo, mediumConfidenceSystem);
      expect(mediumResult.confidenceAssessment.system.level).toBe('medium-high');

      // Test low confidence
      const lowConfidenceSystem = { ...mockSystemInfo, confidenceScore: 0.2 };
      const lowResult = await generateJSON(mockGeolocationInfo, lowConfidenceSystem);
      expect(lowResult.confidenceAssessment.system.level).toBe('low');
    });

    it('should handle bot detection signals', async () => {
      const botSystemInfo = {
        ...mockSystemInfo,
        bot: { isBot: true, signals: ['strong:ua-bot', 'medium:few-plugins'], confidence: 0.8 }
      };
      
      const result = await generateJSON(mockGeolocationInfo, botSystemInfo);
      
      expect(result.confidenceAssessment.system.factors).toContain('Bot signals detected');
      expect(result.confidenceAssessment.system.factors).toContain('strong:ua-bot');
      expect(result.confidenceAssessment.system.factors).toContain('medium:few-plugins');
    });

    it('should detect proxy and VPN factors in combined assessment', async () => {
      const proxyGeoInfo = {
        ...mockGeolocationInfo,
        traits: {
          ...mockGeolocationInfo.traits,
          isAnonymousProxy: true,
          isAnonymousVpn: true,
          isHostingProvider: true,
          isTorExitNode: true
        }
      };
      
      const result = await generateJSON(proxyGeoInfo, mockSystemInfo, 0.4);
      
      expect(result.confidenceAssessment.combined?.factors).toContain('Proxy detected');
      expect(result.confidenceAssessment.combined?.factors).toContain('VPN detected');
      expect(result.confidenceAssessment.combined?.factors).toContain('Hosting provider detected');
      expect(result.confidenceAssessment.combined?.factors).toContain('Tor exit node detected');
    });

    it('should handle missing geolocation traits gracefully', async () => {
      const incompleteGeoInfo = {
        ...mockGeolocationInfo,
        traits: undefined as any
      };
      
      const result = await generateJSON(incompleteGeoInfo, mockSystemInfo, 0.7);
      
      expect(result.confidenceAssessment.combined?.factors).toBe('No suspicious network factors detected');
    });

    it('should use correct timezone for VPN detection', async () => {
      const result = await generateJSON(mockGeolocationInfo, mockSystemInfo);
      
      // VPN detection should be called with correct parameters
      const { getVpnStatus } = await import('@/src/vpn');
      expect(getVpnStatus).toHaveBeenCalledWith({
        geoip: 'America/Los_Angeles',
        localtime: 'America/New_York'
      });
    });

    it('should handle edge cases in confidence assessment', async () => {
      // Test boundary values
      const boundaryTests = [0.35, 0.5, 0.65, 0.8];
      
      for (const score of boundaryTests) {
        const testSystemInfo = { ...mockSystemInfo, confidenceScore: score };
        const result = await generateJSON(mockGeolocationInfo, testSystemInfo);
        
        expect(result.confidenceAssessment.system.score).toBe(score);
        expect(result.confidenceAssessment.system.level).toMatch(/^(low|medium-low|medium|medium-high|high)$/);
      }
    });

    it('should maintain data integrity across calls', async () => {
      const result1 = await generateJSON(mockGeolocationInfo, mockSystemInfo);
      const result2 = await generateJSON(mockGeolocationInfo, mockSystemInfo);
      
      // Results should be consistent (excluding any time-based factors)
      expect(result1.systemInfo).toEqual(result2.systemInfo);
      expect(result1.confidenceAssessment.system.score).toBe(result2.confidenceAssessment.system.score);
    });
  });
}); 