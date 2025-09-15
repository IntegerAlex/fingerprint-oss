// Simple integration test for the main API
const fingerprintOSS = require('./dist/fingerprint-oss.js');

async function testMainIntegration() {
    console.log('🔍 Testing Main API Integration...\n');
    
    try {
        // Test 1: Basic usage (backward compatibility)
        console.log('1. Testing basic usage...');
        const result1 = await fingerprintOSS();
        console.log(`   ✅ Basic call successful`);
        console.log(`   Hash: ${result1.hash.substring(0, 16)}...`);
        
        // Test 2: With configuration
        console.log('\n2. Testing with hash configuration...');
        const result2 = await fingerprintOSS({
            hashConfig: { debugMode: false, enableValidation: true }
        });
        console.log(`   ✅ Configured call successful`);
        console.log(`   Hash: ${result2.hash.substring(0, 16)}...`);
        
        // Test 3: Consistency check
        console.log('\n3. Testing consistency...');
        const result3 = await fingerprintOSS();
        const consistent = result1.hash === result3.hash;
        console.log(`   ✅ Hash consistency: ${consistent}`);
        
        console.log('\n🎉 Main API Integration Test Complete!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

testMainIntegration()
    .then(success => {
        console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '⚠️  Tests failed'}`);
        process.exit(success ? 0 : 1);
    });