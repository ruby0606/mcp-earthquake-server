// Quick test to verify the specific error case is fixed
import { USGSDataProvider } from './dist/providers/usgs-provider.js';

async function testSpecificError() {
  console.log('🔍 Testing specific error case fix...\n');
  
  const usgsProvider = new USGSDataProvider();
  
  try {
    // Test the exact scenario that was causing the 400 error
    const result = await usgsProvider.searchEarthquakes({
      minMagnitude: 4.0,
      startTime: '2025-08-01',
      endTime: '2025-08-17',
      limit: 10
    });
    
    console.log(`✅ SUCCESS: Found ${result.features.length} earthquakes`);
    console.log(`📊 Query executed without 400 error`);
    
    if (result.features.length > 0) {
      const latest = result.features[0];
      const date = new Date(latest.properties.time).toISOString().split('T')[0];
      console.log(`📍 Latest: M${latest.properties.mag} on ${date} at ${latest.properties.place}`);
    }
    
  } catch (error) {
    console.error('❌ Error still occurs:', error.message);
  }
}

testSpecificError();
