#!/usr/bin/env node

/**
 * Quick test for HTTP 204 handling in IRIS waveform fetching
 */

import { IrisDataProvider } from '../dist/providers/iris-provider.js';

async function testHTTP204Handling() {
    console.log('🧪 Testing HTTP 204 handling for IRIS waveform data...\n');

    const iris = new IrisDataProvider();

    try {
        // Test with parameters likely to return no data (HTTP 204)
        console.log('📡 Attempting to fetch waveform data that likely doesn\'t exist...');
        
        const result = await iris.getWaveformData({
            eventId: 'test-event',
            network: 'US',
            station: 'ANMO',
            channel: 'BHZ',
            startTime: '2025-08-17T00:00:00Z',
            endTime: '2025-08-17T00:01:00Z'  // Very recent time, likely no processed data yet
        });

        console.log('✅ Request completed successfully!');
        console.log('📊 Result summary:');
        console.log(`   - Quality: ${result.quality}`);
        console.log(`   - Sample count: ${result.samples.length}`);
        console.log(`   - Sample rate: ${result.sampleRate} Hz`);
        console.log(`   - Duration: ${result.duration} seconds`);
        
        if (result.quality === 'no-data-available') {
            console.log('🎯 HTTP 204 properly handled as "no-data-available"');
        } else {
            console.log('📈 Real waveform data received');
        }

    } catch (error) {
        console.log('❌ Error occurred:', error.message);
        
        if (error.message.includes('status 204')) {
            console.log('⚠️  HTTP 204 not properly handled - still throwing error');
        } else {
            console.log('ℹ️  Different error occurred (not HTTP 204)');
        }
    }
}

testHTTP204Handling();
