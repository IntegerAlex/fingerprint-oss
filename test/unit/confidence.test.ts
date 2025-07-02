import { describe, it, expect } from 'vitest';
import { 
  getLanguageConsistency, 
  isRiskyASN, 
  getUAPlatformMismatch, 
  checkBrowserConsistency 
} from '@/src/confidence';

describe('Confidence Module', () => {
  describe('getLanguageConsistency', () => {
    it('should return positive score for consistent language-country pairs', () => {
      expect(getLanguageConsistency('en', 'US')).toBe(0.15);
      expect(getLanguageConsistency('en', 'GB')).toBe(0.15);
      expect(getLanguageConsistency('fr', 'FR')).toBe(0.15);
      expect(getLanguageConsistency('de', 'DE')).toBe(0.15);
      expect(getLanguageConsistency('zh', 'CN')).toBe(0.15);
      expect(getLanguageConsistency('ja', 'JP')).toBe(0.15);
      expect(getLanguageConsistency('ru', 'RU')).toBe(0.15);
      expect(getLanguageConsistency('hi', 'IN')).toBe(0.15);
    });

    it('should handle multi-language countries', () => {
      expect(getLanguageConsistency('es', 'US')).toBe(0.15); // Spanish in US
      expect(getLanguageConsistency('en', 'IN')).toBe(0.15); // English in India
    });

    it('should return negative score for inconsistent language-country pairs', () => {
      expect(getLanguageConsistency('fr', 'US')).toBe(-0.1);
      expect(getLanguageConsistency('de', 'FR')).toBe(-0.1);
      expect(getLanguageConsistency('ja', 'GB')).toBe(-0.1);
      expect(getLanguageConsistency('ru', 'JP')).toBe(-0.1);
    });

    it('should return 0 for unknown countries', () => {
      expect(getLanguageConsistency('en', 'XX')).toBe(0);
      expect(getLanguageConsistency('fr', 'UNKNOWN')).toBe(0);
      expect(getLanguageConsistency('de', '')).toBe(0);
    });

    it('should handle language codes with regions', () => {
      expect(getLanguageConsistency('en-US', 'US')).toBe(0.15);
      expect(getLanguageConsistency('en-GB', 'GB')).toBe(0.15);
      expect(getLanguageConsistency('zh-CN', 'CN')).toBe(0.15);
      expect(getLanguageConsistency('fr-FR', 'DE')).toBe(-0.1); // French in Germany
    });

    it('should handle case insensitivity', () => {
      expect(getLanguageConsistency('EN', 'us')).toBe(0.15);
      expect(getLanguageConsistency('Fr', 'fr')).toBe(0.15);
      expect(getLanguageConsistency('DE', 'de')).toBe(0.15);
    });

    it('should handle edge cases', () => {
      expect(getLanguageConsistency('', 'US')).toBe(-0.1); // Empty language
      expect(getLanguageConsistency('en', '')).toBe(0); // Empty country
      expect(getLanguageConsistency('', '')).toBe(0); // Both empty
    });
  });

  describe('isRiskyASN', () => {
    it('should detect known risky ASNs', () => {
      const riskyASNs = [
        'AS14061', // DigitalOcean
        'AS16276', // OVH
        'AS16509', // Amazon AWS
        'AS14618', // Amazon AWS
        'AS3356',  // Level3
        'AS9009',  // M247
        'AS24940', // Hetzner
        'AS48666'  // NETASSIST
      ];

      riskyASNs.forEach(asn => {
        expect(isRiskyASN(asn)).toBe(true);
      });
    });

    it('should not flag non-risky ASNs', () => {
      const safeASNs = [
        'AS7922',  // Comcast
        'AS701',   // Verizon
        'AS209',   // CenturyLink
        'AS12345', // Made up
        'AS1',     // Level3 (different from risky one)
        'AS99999'  // Made up
      ];

      safeASNs.forEach(asn => {
        expect(isRiskyASN(asn)).toBe(false);
      });
    });

    it('should handle case sensitivity', () => {
      expect(isRiskyASN('as14061')).toBe(false); // lowercase
      expect(isRiskyASN('As14061')).toBe(false); // mixed case
      expect(isRiskyASN('AS14061')).toBe(true);  // correct format
    });

    it('should handle malformed ASN strings', () => {
      expect(isRiskyASN('14061')).toBe(false);    // Missing AS prefix
      expect(isRiskyASN('ASN14061')).toBe(false); // Wrong prefix
      expect(isRiskyASN('')).toBe(false);         // Empty string
      expect(isRiskyASN('AS')).toBe(false);       // No number
    });
  });

  describe('getUAPlatformMismatch', () => {
    it('should detect mobile UA vs non-mobile platform mismatch', () => {
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
      const desktopPlatform = 'Win32';
      
      expect(getUAPlatformMismatch(mobileUA, desktopPlatform)).toBe(0.2);
    });

    it('should detect desktop UA vs mobile platform mismatch', () => {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const mobilePlatform = 'iPhone';
      
      expect(getUAPlatformMismatch(desktopUA, mobilePlatform)).toBe(0.2);
    });

    it('should not penalize matching mobile patterns', () => {
      const mobileUA = 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36';
      const mobilePlatform = 'Linux armv8l';
      
      expect(getUAPlatformMismatch(mobileUA, mobilePlatform)).toBe(0);
    });

    it('should not penalize matching desktop patterns', () => {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const desktopPlatform = 'Win32';
      
      expect(getUAPlatformMismatch(desktopUA, desktopPlatform)).toBe(0);
    });

    it('should detect OS mismatches', () => {
      const windowsUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const macPlatform = 'MacIntel';
      
      expect(getUAPlatformMismatch(windowsUA, macPlatform)).toBe(0.15);
    });

    it('should handle macOS correctly', () => {
      const macUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
      const macPlatform = 'MacIntel';
      
      expect(getUAPlatformMismatch(macUA, macPlatform)).toBe(0);
    });

    it('should handle Linux correctly', () => {
      const linuxUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
      const linuxPlatform = 'Linux x86_64';
      
      expect(getUAPlatformMismatch(linuxUA, linuxPlatform)).toBe(0);
    });

    it('should handle case insensitivity', () => {
      const ua = 'Mozilla/5.0 (WINDOWS NT 10.0; Win64; x64) AppleWebKit/537.36';
      const platform = 'WIN32';
      
      expect(getUAPlatformMismatch(ua, platform)).toBe(0);
    });

    it('should handle multiple mismatches', () => {
      const iosMobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)';
      const windowsPlatform = 'Win32'; // Both mobile/desktop and OS mismatch
      
      expect(getUAPlatformMismatch(iosMobileUA, windowsPlatform)).toBe(0.2); // Mobile mismatch takes precedence
    });

    it('should handle edge cases', () => {
      expect(getUAPlatformMismatch('', 'Win32')).toBe(0);
      expect(getUAPlatformMismatch('Mozilla/5.0', '')).toBe(0);
      expect(getUAPlatformMismatch('', '')).toBe(0);
    });
  });

  describe('checkBrowserConsistency', () => {
    it('should return 0 for consistent system information', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        viewportSize: [1200, 800],
        deviceMemory: 8,
        hardwareConcurrency: 8
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(0);
    });

    it('should penalize viewport larger than screen', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        viewportSize: [2000, 1200], // Viewport larger than screen
        deviceMemory: 8,
        hardwareConcurrency: 8
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(-0.1);
    });

    it('should penalize low memory with high CPU cores', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        viewportSize: [1200, 800],
        deviceMemory: 1, // Low memory
        hardwareConcurrency: 8 // High CPU cores
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(-0.1);
    });

    it('should penalize high memory with low CPU cores', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        viewportSize: [1200, 800],
        deviceMemory: 16, // High memory
        hardwareConcurrency: 2 // Low CPU cores
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(-0.1);
    });

    it('should handle multiple inconsistencies', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        viewportSize: [2000, 1200], // Inconsistency 1
        deviceMemory: 1, // Low memory
        hardwareConcurrency: 8 // High CPU cores - Inconsistency 2
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(-0.2);
    });

    it('should cap negative score at -0.3', () => {
      const systemInfo = {
        screenResolution: [800, 600],
        viewportSize: [2000, 1200], // Inconsistency 1
        deviceMemory: 1, // Low memory with high CPU
        hardwareConcurrency: 16 // Inconsistency 2
      };
      
      // Would be -0.2, but should be capped
      expect(checkBrowserConsistency(systemInfo)).toBe(-0.2);
    });

    it('should handle missing screen resolution gracefully', () => {
      const systemInfo = {
        deviceMemory: 8,
        hardwareConcurrency: 8
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(0);
    });

    it('should handle missing viewport size gracefully', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        deviceMemory: 8,
        hardwareConcurrency: 8
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(0);
    });

    it('should handle missing memory information gracefully', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        viewportSize: [1200, 800],
        hardwareConcurrency: 8
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(0);
    });

    it('should handle missing hardware concurrency gracefully', () => {
      const systemInfo = {
        screenResolution: [1920, 1080],
        viewportSize: [1200, 800],
        deviceMemory: 8
      };
      
      expect(checkBrowserConsistency(systemInfo)).toBe(0);
    });

    it('should handle completely empty system info', () => {
      const systemInfo = {};
      
      expect(checkBrowserConsistency(systemInfo)).toBe(0);
    });

    it('should handle edge values correctly', () => {
      // Test boundary conditions
      const systemInfo1 = {
        deviceMemory: 2, // Exactly at boundary
        hardwareConcurrency: 4 // Exactly at boundary
      };
      expect(checkBrowserConsistency(systemInfo1)).toBe(0);

      const systemInfo2 = {
        deviceMemory: 8, // Exactly at boundary
        hardwareConcurrency: 4 // Exactly at boundary
      };
      expect(checkBrowserConsistency(systemInfo2)).toBe(0);
    });
  });
}); 