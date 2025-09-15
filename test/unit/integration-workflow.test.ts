import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fingerprintOSS, { 
    generateId, 
    generateIdWithDebug, 
    compareInputs,
    HashGeneratorConfig,
    HashGenerationResult,
    InputComparisonResult
} from '@/src/index';
import { SystemInfo } from '@/src/types';

/**
 * Integration Tests for Existing Fingerprinting Workflow Compatibility
 * 
 * This test suite verifies that the new hash generation capabilities
 * maintain backward compatibility with existing fingerprinting workflows
 * and that the enhanced API works correctly with the main integration points.
 * 
 * Requirements covered:
 * - Backward compatibility with existing generateId() usage (1.1, 1.2)
 * - Integration with main API and configuration support
 * - Workflow compatibility testing
 */

describe('Integration Workflow Compatibility Tests', () => {
    const originalWindow = global.window;
    const originalNavigator = global.navigator;
    const originalFetch = global.fetch;

    // Mock system info for consistent testing
    const mockSystemInfo: SystemInfo = {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Win32",
        screenResolution: [1920, 1080],
        colorDepth: 24,
        colorGamut: "srgb",
        os: { os: "Windows", version: "10" },
        webGL: {
            vendor: "Google Inc. (NVIDIA)",
            renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
            imageHash: "webgl_test_hash_v1"
        },
        canvas: {
            winding: true,
            geometry: "test_canvas_geometry",
            text: "test_canvas_text"
        },
        audio: 124.04344968475198,
        fontPreferences: {
            detectedFonts: ["Arial", "Calibri", "Georgia", "Times New Roman", "Verdana"].sort()
        },
        mathConstants: {
            acos: 1.4455469250725552,
            acosh: 0.8813735870195429,
            asinh: 0.8813735870195429,
            atanh: 0.5493061443340549,
            expm1: 1.718281828459045,
            sinh: 1.1752011936438014,
            cosh: 1.5430806348152437,
            tanh: 0.7615941559557649,
        },
        plugins: [
            {
                name: "PDF Viewer",
                description: "Portable Document Format",
                mimeTypes: [{ type: "application/pdf", suffixes: "pdf" }]
            }
        ],
        languages: ["en-US", "en"],
        timezone: "America/New_York",
        incognito: { isPrivate: false, browserName: "Chrome" },
        bot: { isBot: false, signals: [], confidence: 0 },
        cookiesEnabled: true,
        doNotTrack: null,
        localStorage: true,
        sessionStorage: true,
        indexedDB: true,
        touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
        vendor: "Google Inc.",
        vendorFlavors: ["Google Chrome"],
        confidenceScore: 0.95,
        deviceMemory: 8,
        hardwareConcurrency: 8,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup mock browser environment
        global.window = {
            screen: { width: 1920, height: 1080, colorDepth: 24 },
            location: { origin: 'https://test.com' },
            localStorage: {
                setItem: vi.fn(),
                getItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            sessionStorage: {
                setItem: vi.fn(),
                getItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            }
        } as any;

        global.navigator = {
            userAgent: mockSystemInfo.userAgent,
            platform: mockSystemInfo.platform,
            languages: mockSystemInfo.languages,
            cookieEnabled: mockSystemInfo.cookiesEnabled,
            doNotTrack: mockSystemInfo.doNotTrack,
            vendor: mockSystemInfo.vendor,
            hardwareConcurrency: mockSystemInfo.hardwareConcurrency,
            maxTouchPoints: mockSystemInfo.touchSupport.maxTouchPoints,
            plugins: { length: 0 }
        } as any;

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                ipAddress: '192.168.1.1',
                country: { isoCode: 'US', name: 'United States' },
                location: { timeZone: 'America/New_York' },
                traits: { isAnonymous: false }
            })
        });
    });

    afterEach(() => {
        global.window = originalWindow;
        global.navigator = originalNavigator;
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    describe('Backward Compatibility Tests', () => {
        it('should maintain backward compatibility with existing generateId() usage', async () => {
            // Test the original function signature without configuration
            const hash1 = await generateId(mockSystemInfo);
            const hash2 = await generateId(mockSystemInfo);
            
            // Should produce consistent results
            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/);
            expect(typeof hash1).toBe('string');
            expect(hash1.length).toBe(64);
        });

        it('should work with existing workflow patterns', async () => {
            // Simulate existing workflow: get system info, then generate hash
            const systemInfo = await fingerprintOSS.getSystemInfo();
            const hash = await generateId(systemInfo);
            
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should maintain consistent hash output for same input across multiple calls', async () => {
            const iterations = 10;
            const hashes: string[] = [];
            
            for (let i = 0; i < iterations; i++) {
                const hash = await generateId(mockSystemInfo);
                hashes.push(hash);
            }
            
            // All hashes should be identical
            const uniqueHashes = new Set(hashes);
            expect(uniqueHashes.size).toBe(1);
            
            console.log(`Backward Compatibility Test: Generated consistent hash ${hashes[0].substring(0, 16)}... across ${iterations} iterations`);
        });

        it('should work with the main fingerprintOSS function without configuration', async () => {
            const result = await fingerprintOSS();
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(result).toHaveProperty('systemInfo');
            expect(result).toHaveProperty('confidenceAssessment');
            expect(typeof result.hash).toBe('string');
            expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        });
    });

    describe('Enhanced API Integration Tests', () => {
        it('should support optional configuration parameters in main API', async () => {
            const hashConfig: HashGeneratorConfig = {
                debugMode: true,
                strictMode: false,
                enableValidation: true
            };
            
            const result = await fingerprintOSS({ 
                transparency: false,
                hashConfig 
            });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(typeof result.hash).toBe('string');
            expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should work with debug mode configuration', async () => {
            const hashConfig: HashGeneratorConfig = {
                debugMode: true
            };
            
            const result = await fingerprintOSS({ hashConfig });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(typeof result.hash).toBe('string');
            expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should work with strict mode configuration', async () => {
            const hashConfig: HashGeneratorConfig = {
                strictMode: true,
                enableValidation: true
            };
            
            const result = await fingerprintOSS({ hashConfig });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(typeof result.hash).toBe('string');
            expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should support custom fallback configuration', async () => {
            const hashConfig: HashGeneratorConfig = {
                customFallbacks: {
                    userAgent: 'custom_test_ua_fallback',
                    platform: 'custom_test_platform_fallback'
                }
            };
            
            const result = await fingerprintOSS({ hashConfig });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(typeof result.hash).toBe('string');
            expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        });
    });

    describe('New Hash Generation Capabilities Tests', () => {
        it('should export and work with generateIdWithDebug function', async () => {
            const result: HashGenerationResult = await generateIdWithDebug(mockSystemInfo, { 
                debugMode: true 
            });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(result).toHaveProperty('debugInfo');
            expect(typeof result.hash).toBe('string');
            expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
            
            // Debug info should be present
            expect(result.debugInfo).toBeDefined();
            expect(result.debugInfo!).toHaveProperty('originalInput');
            expect(result.debugInfo!).toHaveProperty('normalizedInput');
            expect(result.debugInfo!).toHaveProperty('appliedFallbacks');
            expect(result.debugInfo!).toHaveProperty('hashInput');
            expect(result.debugInfo!).toHaveProperty('processingTime');
            expect(typeof result.debugInfo!.processingTime).toBe('number');
        });

        it('should export and work with compareInputs function', async () => {
            const modifiedSystemInfo = { 
                ...mockSystemInfo, 
                userAgent: 'Modified User Agent' 
            };
            
            const comparison: InputComparisonResult = await compareInputs(
                mockSystemInfo, 
                modifiedSystemInfo
            );
            
            expect(comparison).toBeDefined();
            expect(comparison).toHaveProperty('identical');
            expect(comparison).toHaveProperty('differences');
            expect(comparison).toHaveProperty('normalizedInput1');
            expect(comparison).toHaveProperty('normalizedInput2');
            expect(comparison).toHaveProperty('hashInput1');
            expect(comparison).toHaveProperty('hashInput2');
            
            expect(comparison.identical).toBe(false);
            expect(Array.isArray(comparison.differences)).toBe(true);
            expect(comparison.differences.length).toBeGreaterThan(0);
            
            // Should detect the user agent difference
            const userAgentDiff = comparison.differences.find(d => d.property === 'userAgent');
            expect(userAgentDiff).toBeDefined();
            expect(userAgentDiff!.affectsHash).toBe(true);
        });

        it('should export hash generation types and interfaces', () => {
            // Test that types are properly exported (TypeScript compilation test)
            const config: HashGeneratorConfig = {
                debugMode: true,
                strictMode: false,
                enableValidation: true
            };
            
            expect(config).toBeDefined();
            expect(typeof config.debugMode).toBe('boolean');
            expect(typeof config.strictMode).toBe('boolean');
            expect(typeof config.enableValidation).toBe('boolean');
        });
    });

    describe('Integration with Existing Workflow Components', () => {
        it('should work with existing system info collection', async () => {
            const systemInfo = await fingerprintOSS.getSystemInfo();
            
            // Test with original generateId
            const hash1 = await generateId(systemInfo);
            
            // Test with enhanced generateIdWithDebug
            const result = await generateIdWithDebug(systemInfo, { debugMode: true });
            
            expect(hash1).toBeDefined();
            expect(result.hash).toBeDefined();
            expect(typeof hash1).toBe('string');
            expect(typeof result.hash).toBe('string');
            expect(hash1).toMatch(/^[a-f0-9]{64}$/);
            expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should work with existing geolocation integration', async () => {
            const geoInfo = await fingerprintOSS.fetchGeolocationInfo();
            const systemInfo = await fingerprintOSS.getSystemInfo();
            
            // Test that the main function works with hash configuration
            const result = await fingerprintOSS({
                hashConfig: { debugMode: false, enableValidation: true }
            });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(result).toHaveProperty('geolocation');
            expect(result).toHaveProperty('systemInfo');
        });

        it('should maintain performance characteristics', async () => {
            const iterations = 5;
            const times: number[] = [];
            
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                await generateId(mockSystemInfo);
                const end = performance.now();
                times.push(end - start);
            }
            
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            
            // Performance should be reasonable (adjust thresholds as needed)
            expect(avgTime).toBeLessThan(100); // Average under 100ms
            expect(maxTime).toBeLessThan(500);  // Max under 500ms
            
            console.log(`Performance Test: Average hash generation time: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
        });

        it('should handle error scenarios gracefully', async () => {
            // Test with malformed system info
            const malformedSystemInfo = {
                ...mockSystemInfo,
                webGL: null,
                canvas: null,
                audio: null,
                fontPreferences: null,
                mathConstants: null
            } as any;
            
            // Should not throw errors
            const hash = await generateId(malformedSystemInfo);
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            
            // Test with debug mode
            const result = await generateIdWithDebug(malformedSystemInfo, { 
                debugMode: true 
            });
            expect(result.hash).toBeDefined();
            expect(result.debugInfo).toBeDefined();
            
            // Should have applied fallbacks
            const fallbackCount = Object.keys(result.debugInfo!.appliedFallbacks).length;
            expect(fallbackCount).toBeGreaterThan(0);
        });
    });

    describe('Configuration Validation Tests', () => {
        it('should handle invalid configuration gracefully', async () => {
            const invalidConfig = {
                debugMode: 'invalid' as any,
                strictMode: 123 as any,
                enableValidation: 'yes' as any
            };
            
            // Should not throw errors with invalid config
            const result = await fingerprintOSS({ 
                hashConfig: invalidConfig 
            });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(typeof result.hash).toBe('string');
        });

        it('should work with partial configuration', async () => {
            const partialConfig: Partial<HashGeneratorConfig> = {
                debugMode: true
                // Other properties omitted
            };
            
            const result = await fingerprintOSS({ 
                hashConfig: partialConfig 
            });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(typeof result.hash).toBe('string');
        });

        it('should work with empty configuration', async () => {
            const emptyConfig: HashGeneratorConfig = {};
            
            const result = await fingerprintOSS({ 
                hashConfig: emptyConfig 
            });
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(typeof result.hash).toBe('string');
        });
    });

    describe('Cross-Environment Compatibility Tests', () => {
        it('should work in different browser environments', async () => {
            const environments = [
                {
                    name: 'Chrome',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    vendor: 'Google Inc.'
                },
                {
                    name: 'Firefox',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
                    vendor: ''
                },
                {
                    name: 'Safari',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
                    vendor: 'Apple Computer, Inc.'
                }
            ];
            
            const hashes: string[] = [];
            
            for (const env of environments) {
                const envSystemInfo = {
                    ...mockSystemInfo,
                    userAgent: env.userAgent,
                    vendor: env.vendor
                };
                
                const hash = await generateId(envSystemInfo);
                hashes.push(hash);
                
                expect(hash).toBeDefined();
                expect(typeof hash).toBe('string');
                expect(hash).toMatch(/^[a-f0-9]{64}$/);
            }
            
            // Different environments should produce different hashes
            const uniqueHashes = new Set(hashes);
            expect(uniqueHashes.size).toBe(environments.length);
            
            console.log('Cross-Environment Test: Generated unique hashes for', environments.length, 'different browser environments');
        });

        it('should maintain consistency within same environment', async () => {
            const iterations = 3;
            const hashes: string[] = [];
            
            for (let i = 0; i < iterations; i++) {
                const hash = await generateId(mockSystemInfo);
                hashes.push(hash);
            }
            
            // All hashes should be identical within same environment
            const uniqueHashes = new Set(hashes);
            expect(uniqueHashes.size).toBe(1);
        });
    });
});