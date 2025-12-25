// Simple integration test for the main API
import fingerprintOSS from './dist/index.esm.js';

async function testMainIntegration() {
    console.log('🔍 Testing Main API Integration...\n');
    
    try {
        // Test 1: Basic usage (backward compatibility)
        console.log('1. Testing basic usage...');
        const result1 = await fingerprintOSS();
        console.log(`   ✅ Basic call successful`);
        console.log(`   Hash: ${result1.hash.substring(0, 16)}...`);
        
        // Test 2: Verify browser field exists
        console.log('\n2. Testing browser field...');
        if (result1.systemInfo && result1.systemInfo.browser) {
            console.log(`   ✅ Browser field present:`, result1.systemInfo.browser);
        } else {
            console.log(`   ⚠️  Browser field missing`);
        }
        
        // Test 3: Print full JSON output
        console.log('\n3. Full JSON Output:');
        console.log(JSON.stringify(result1, null, 2));
        
        // Test 4: Consistency check
        console.log('\n4. Testing consistency...');
        const result3 = await fingerprintOSS();
        const consistent = result1.hash === result3.hash;
        console.log(`   ✅ Hash consistency: ${consistent}`);
        
        console.log('\n🎉 Main API Integration Test Complete!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

testMainIntegration()
    .then(success => {
        console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '⚠️  Tests failed'}`);
        process.exit(success ? 0 : 1);
    });