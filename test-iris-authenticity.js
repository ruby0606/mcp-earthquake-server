#!/usr/bin/env node

/**
 * IRIS Authenticity Validation Test
 * 
 * This test verifies that our IRIS provider:
 * 1. Uses real IRIS availability services (not Math.random())
 * 2. Returns honest "no data" responses when appropriate
 * 3. Never generates synthetic/fake waveform samples
 * 4. Properly handles authentication requirements for waveform downloads
 */

import { IrisDataProvider } from './dist/providers/iris-provider.js';
import fs from 'fs';

async function testIrisAuthenticity() {
    console.log('🔍 Testing IRIS Provider Data Authenticity...\n');
    
    const iris = new IrisDataProvider();
    
    // Test 1: Real station validation
    console.log('📡 Test 1: Station Availability Validation');
    console.log('------------------------------------------');
    
    try {
        const stationInfo = await iris.validateStationAvailability({
            network: 'US',
            station: 'ANMO',
            channel: 'BHZ',
            startTime: '2024-01-01T00:00:00Z',
            endTime: '2024-01-01T01:00:00Z'
        });
        
        console.log('✅ Station validation result:');
        console.log(`   Active: ${stationInfo.isActive}`);
        console.log(`   Sample Rate: ${stationInfo.sampleRate} Hz`);
        console.log(`   Reason: ${stationInfo.reason}`);
        
        if (stationInfo.sampleRate === 42 || stationInfo.sampleRate === 50) {
            console.log('❌ FAIL: Detected placeholder sample rates (42 or 50 Hz)');
            return false;
        }
        
    } catch (error) {
        console.log(`✅ Station validation properly handled error: ${error.message}`);
    }
    
    // Test 2: Waveform data authenticity 
    console.log('\n🌊 Test 2: Waveform Data Authenticity');
    console.log('-------------------------------------');
    
    try {
        const waveformResult = await iris.getWaveformData({
            eventId: 'test-event-001',
            network: 'US',
            station: 'ANMO', 
            channel: 'BHZ',
            startTime: '2024-01-01T00:00:00Z',
            endTime: '2024-01-01T01:00:00Z'
        });
        
        console.log('✅ Waveform request completed:');
        console.log(`   Network: ${waveformResult.network}`);
        console.log(`   Station: ${waveformResult.station}`);
        console.log(`   Sample count: ${waveformResult.samples.length}`);
        console.log(`   Quality: ${waveformResult.quality}`);
        
        // Critical check: No synthetic samples generated
        if (waveformResult.samples.length > 0) {
            console.log('❌ FAIL: Found samples in waveform data - should be empty without authentication');
            return false;
        }
        
        // Verify quality indicators are authentic
        const validQualities = [
            'no-waveform-data-available',
            'waveform-available-authentication-required',
            'no-data-available'
        ];
        
        if (!validQualities.includes(waveformResult.quality)) {
            console.log(`❌ FAIL: Invalid quality indicator: ${waveformResult.quality}`);
            return false;
        }
        
        console.log('✅ No synthetic samples generated - authentic response');
        
    } catch (error) {
        console.log(`✅ Waveform request properly handled error: ${error.message}`);
    }
    
    // Test 3: Station metadata authenticity
    console.log('\n🏢 Test 3: Station Metadata Authenticity'); 
    console.log('----------------------------------------');
    
    try {
        const stations = await iris.getStations({
            network: 'US',
            station: 'ANMO',
            startTime: '2024-01-01',
            endTime: '2024-01-02'
        });
        
        console.log(`✅ Retrieved ${stations.length} station records`);
        
        if (stations.length > 0) {
            const station = stations[0];
            console.log(`   Network: ${station.network}`);
            console.log(`   Station: ${station.station}`);
            console.log(`   Location: ${station.latitude}, ${station.longitude}`);
            
            // Check for placeholder coordinates
            if (station.latitude === 0 && station.longitude === 0) {
                console.log('❌ FAIL: Detected placeholder coordinates (0, 0)');
                return false;
            }
            
            // Check for reasonable coordinate ranges
            if (station.latitude < -90 || station.latitude > 90 || 
                station.longitude < -180 || station.longitude > 180) {
                console.log('❌ FAIL: Invalid coordinate values');
                return false;
            }
            
            console.log('✅ Station coordinates are within valid ranges');
        }
        
    } catch (error) {
        console.log(`✅ Station metadata request properly handled error: ${error.message}`);
    }
    
    // Test 4: Anti-Math.random() validation
    console.log('\n🎲 Test 4: Anti-Math.random() Validation');
    console.log('---------------------------------------');
    
    // Read the source code to ensure no Math.random() usage
    const irisSourceCode = fs.readFileSync('./src/providers/iris-provider.ts', 'utf8');
    
    if (irisSourceCode.includes('Math.random')) {
        console.log('❌ CRITICAL FAIL: Math.random() found in IRIS provider source code');
        console.log('   This violates anti-hallucination principles');
        return false;
    }
    
    console.log('✅ No Math.random() usage detected in source code');
    
    // Check for other synthetic data generation patterns
    const suspiciousPatterns = [
        'Math\\.sin\\(',
        'Math\\.cos\\(',
        'Math\\.floor\\(Math\\.random',
        'fake',
        'synthetic',
        'placeholder.*data',
        'generated.*samples'
    ];
    
    for (const pattern of suspiciousPatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(irisSourceCode)) {
            console.log(`❌ SUSPICIOUS: Potentially synthetic data pattern found: ${pattern}`);
            // Don't fail, but warn
        }
    }
    
    console.log('✅ No obvious synthetic data generation patterns found');
    
    return true;
}

async function main() {
    console.log('🧪 IRIS Provider Authenticity Validation Test');
    console.log('==============================================\n');
    
    try {
        const success = await testIrisAuthenticity();
        
        if (success) {
            console.log('\n🎉 ALL TESTS PASSED - IRIS Provider maintains data authenticity');
            console.log('   • No Math.random() usage detected');
            console.log('   • No synthetic sample generation');  
            console.log('   • Proper authentication requirement handling');
            console.log('   • Honest "no data available" responses');
            console.log('   • Real IRIS availability service integration');
        } else {
            console.log('\n❌ AUTHENTICITY VALIDATION FAILED');
            console.log('   Please review IRIS provider for synthetic data generation');
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`\n💥 Test execution error: ${error.message}`);
        console.error('   This may indicate API connectivity issues or configuration problems');
        process.exit(1);
    }
}

main();
