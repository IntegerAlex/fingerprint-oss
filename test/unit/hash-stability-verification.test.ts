import { describe, it, expect } from 'vitest';
import { generateId, generateIdWithDebug, compareInputs } from '@/src/hash';
import { SystemInfo } from '@/src/types';

/**
 * Hash Stability Verification Tests
 * 
 * These tests verify that the hash generation is stable, predictable, and works as intended.
 * This is a comprehensive verification of the hash stability implementation.
 */

describe('Hash Stability Verification', () => {
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

    describe('Basic Hash Consistency', () => {
        it('should generate identical hashes for identical input', async () => {
            const hash1 = await generateId(mockSystemInfo);
            const hash2 = await generateId(mockSystemInfo);
            const hash3 = await generateId(mockSystemInfo);
            
            expect(hash1).toBe(hash2);
            expect(hash2).toBe(hash3);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/); // Valid SHA-256 hash
            
            console.log(`✅ Consistent hash generated: ${hash1.substring(0, 16)}...`);
        });

        it('should generate identical hashes across multiple iterations', async () => {
            const iterations = 10;
            const hashes: string[] = [];
            
            for (let i = 0; i < iterations; i++) {
                const hash = await generateId(mockSystemInfo);
                hashes.push(hash);
            }
            
            const uniqueHashes = new Set(hashes);
            expect(uniqueHashes.size).toBe(1);
            
            console.log(`✅ ${iterations} iterations produced identical hash: ${hashes[0].substring(0, 16)}...`);
        });
    });

    describe('Configuration Consistency', () => {
        it('should generate identical hashes regardless of configuration options', async () => {
            const hash1 = await generateId(mockSystemInfo);
            const hash2 = await generateId(mockSystemInfo, { debugMode: false });
            const hash3 = await generateId(mockSystemInfo, { enableValidation: true });
            const hash4 = await generateId(mockSystemInfo, { debugMode: false, enableValidation: true });
            
            expect(hash1).toBe(hash2);
            expect(hash2).toBe(hash3);
            expect(hash3).toBe(hash4);
            
            console.log(`✅ Configuration-independent hash: ${hash1.substring(0, 16)}...`);
        });

        it('should generate identical hash in debug mode', async () => {
            const normalHash = await generateId(mockSystemInfo);
            const debugResult = await generateIdWithDebug(mockSystemInfo, { debugMode: true });
            
            expect(debugResult.hash).toBe(normalHash);
            expect(debugResult.debugInfo).toBeDefined();
            expect(debugResult.debugInfo!.processingTime).toBeGreaterThan(0);
            
            console.log(`✅ Debug mode hash matches: ${debugResult.hash.substring(0, 16)}...`);
            console.log(`   Processing time: ${debugResult.debugInfo!.processingTime.toFixed(2)}ms`);
        });
    });

    describe('Stability with Irrelevant Changes', () => {
        it('should produce identical hash when non-fingerprinting properties change', async () => {
            const originalHash = await generateId(mockSystemInfo);
            
            // Change properties that should NOT affect the hash
            const modifiedSystemInfo = {
                ...mockSystemInfo,
                timezone: "America/Los_Angeles", // Should not affect hash
                languages: ["es-ES", "en"], // Should not affect hash
                confidenceScore: 0.85, // Should not affect hash
            };
            
            const modifiedHash = await generateId(modifiedSystemInfo);
            
            expect(modifiedHash).toBe(originalHash);
            
            console.log(`✅ Hash stable with irrelevant changes: ${originalHash.substring(0, 16)}...`);
        });
    });

    describe('Sensitivity to Relevant Changes', () => {
        it('should produce different hash when fingerprinting properties change', async () => {
            const originalHash = await generateId(mockSystemInfo);
            
            // Change properties that SHOULD affect the hash
            const modifiedSystemInfo = {
                ...mockSystemInfo,
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15"
            };
            
            const modifiedHash = await generateId(modifiedSystemInfo);
            
            expect(modifiedHash).not.toBe(originalHash);
            expect(modifiedHash).toMatch(/^[a-f0-9]{64}$/);
            
            console.log(`✅ Hash changed with relevant changes:`);
            console.log(`   Original: ${originalHash.substring(0, 16)}...`);
            console.log(`   Modified: ${modifiedHash.substring(0, 16)}...`);
        });

        it('should detect differences in WebGL properties', async () => {
            const originalHash = await generateId(mockSystemInfo);
            
            const modifiedSystemInfo = {
                ...mockSystemInfo,
                webGL: {
                    ...mockSystemInfo.webGL,
                    imageHash: "different_webgl_hash"
                }
            };
            
            const modifiedHash = await generateId(modifiedSystemInfo);
            
            expect(modifiedHash).not.toBe(originalHash);
            
            console.log(`✅ Hash sensitive to WebGL changes`);
        });

        it('should detect differences in canvas properties', async () => {
            const originalHash = await generateId(mockSystemInfo);
            
            const modifiedSystemInfo = {
                ...mockSystemInfo,
                canvas: {
                    ...mockSystemInfo.canvas,
                    geometry: "different_canvas_geometry"
                }
            };
            
            const modifiedHash = await generateId(modifiedSystemInfo);
            
            expect(modifiedHash).not.toBe(originalHash);
            
            console.log(`✅ Hash sensitive to canvas changes`);
        });
    });

    describe('Performance Verification', () => {
        it('should generate hashes within acceptable time limits', async () => {
            const iterations = 50;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                await generateId(mockSystemInfo);
            }
            
            const endTime = performance.now();
            const avgTime = (endTime - startTime) / iterations;
            
            expect(avgTime).toBeLessThan(100); // Should be under 100ms per hash
            
            console.log(`✅ Performance test: ${avgTime.toFixed(2)}ms average per hash (${iterations} iterations)`);
        });
    });

    describe('Input Comparison Functionality', () => {
        it('should correctly identify identical inputs', async () => {
            const comparison = await compareInputs(mockSystemInfo, mockSystemInfo);
            
            expect(comparison.identical).toBe(true);
            expect(comparison.differences.length).toBe(0);
            expect(comparison.hashInput1).toBe(comparison.hashInput2);
            
            console.log(`✅ Input comparison correctly identifies identical inputs`);
        });

        it('should correctly identify different inputs', async () => {
            const modifiedSystemInfo = {
                ...mockSystemInfo,
                userAgent: "Different User Agent"
            };
            
            const comparison = await compareInputs(mockSystemInfo, modifiedSystemInfo);
            
            expect(comparison.identical).toBe(false);
            expect(comparison.differences.length).toBeGreaterThan(0);
            expect(comparison.hashInput1).not.toBe(comparison.hashInput2);
            
            const userAgentDiff = comparison.differences.find(d => d.property === 'userAgent');
            expect(userAgentDiff).toBeDefined();
            
            console.log(`✅ Input comparison correctly identifies different inputs`);
            console.log(`   Found ${comparison.differences.length} differences`);
        });
    });

    describe('Fallback Behavior', () => {
        it('should handle missing properties with consistent fallbacks', async () => {
            const incompleteSystemInfo = {
                ...mockSystemInfo,
                audio: null,
                webGL: null,
                canvas: null
            } as any;
            
            const hash1 = await generateId(incompleteSystemInfo);
            const hash2 = await generateId(incompleteSystemInfo);
            
            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/);
            
            console.log(`✅ Consistent fallback behavior: ${hash1.substring(0, 16)}...`);
        });
    });

    describe('Edge Cases', () => {
        it('should handle extreme values consistently', async () => {
            const extremeSystemInfo = {
                ...mockSystemInfo,
                screenResolution: [99999, 99999],
                colorDepth: 999,
                hardwareConcurrency: 999,
                deviceMemory: 999
            };
            
            const hash1 = await generateId(extremeSystemInfo);
            const hash2 = await generateId(extremeSystemInfo);
            
            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/);
            
            console.log(`✅ Handles extreme values consistently: ${hash1.substring(0, 16)}...`);
        });
    });

    describe('Overall Stability Verification', () => {
        it('should pass comprehensive stability test', async () => {
            console.log('\n🔍 Running comprehensive hash stability verification...\n');
            
            // Test 1: Basic consistency
            const hash1 = await generateId(mockSystemInfo);
            const hash2 = await generateId(mockSystemInfo);
            const basicConsistency = hash1 === hash2;
            
            // Test 2: Debug mode consistency
            const debugResult = await generateIdWithDebug(mockSystemInfo, { debugMode: true });
            const debugConsistency = debugResult.hash === hash1;
            
            // Test 3: Configuration consistency
            const configHash = await generateId(mockSystemInfo, { enableValidation: true });
            const configConsistency = configHash === hash1;
            
            // Test 4: Irrelevant changes stability
            const modifiedInfo = { ...mockSystemInfo, timezone: "UTC" };
            const modifiedHash = await generateId(modifiedInfo);
            const irrelevantStability = modifiedHash === hash1;
            
            // Test 5: Relevant changes detection
            const significantInfo = { ...mockSystemInfo, userAgent: "Different Browser" };
            const significantHash = await generateId(significantInfo);
            const relevantSensitivity = significantHash !== hash1;
            
            // Verify all tests pass
            expect(basicConsistency).toBe(true);
            expect(debugConsistency).toBe(true);
            expect(configConsistency).toBe(true);
            expect(irrelevantStability).toBe(true);
            expect(relevantSensitivity).toBe(true);
            
            console.log('📊 Stability Test Results:');
            console.log(`   ✅ Basic consistency: ${basicConsistency}`);
            console.log(`   ✅ Debug mode consistency: ${debugConsistency}`);
            console.log(`   ✅ Configuration consistency: ${configConsistency}`);
            console.log(`   ✅ Irrelevant changes stability: ${irrelevantStability}`);
            console.log(`   ✅ Relevant changes sensitivity: ${relevantSensitivity}`);
            console.log('\n🎉 Hash stability verification PASSED!');
        });
    });
});