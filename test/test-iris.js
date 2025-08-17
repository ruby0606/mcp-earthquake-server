#!/usr/bin/env node

/**
 * Test the fixed IRIS provider to verify API format issues are resolved
 */

import { IrisDataProvider } from './dist/providers/iris-provider.js';

async function testIrisProvider() {
  console.log('🧪 Testing Fixed IRIS Provider...\n');

  const irisProvider = new IrisDataProvider();

  try {
    console.log('📡 Testing earthquake catalog with text format...');
    
    const catalog = await irisProvider.getEarthquakeCatalog({
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-02T00:00:00Z',
      minMagnitude: 4.0,
      latitude: 35.0,
      longitude: -118.0,
      maxRadius: 10
    });

    console.log(`✅ Success! Retrieved ${catalog.length} earthquakes`);
    
    if (catalog.length > 0) {
      const event = catalog[0];
      console.log(`📍 Sample event: M${event.magnitude} ${event.location}`);
      console.log(`   Time: ${event.time}`);
      console.log(`   Coordinates: ${event.latitude.toFixed(3)}°N, ${Math.abs(event.longitude).toFixed(3)}°${event.longitude < 0 ? 'W' : 'E'}`);
      console.log(`   Depth: ${event.depth.toFixed(1)}km\n`);
    }

    console.log('🎉 IRIS API format issue resolved!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIrisProvider().catch(console.error);
