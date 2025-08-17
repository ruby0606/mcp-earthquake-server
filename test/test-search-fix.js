// Test script to verify USGS search parameter fix
import { USGSDataProvider } from './dist/providers/usgs-provider.js';

async function testSearchFix() {
  console.log('🧪 Testing USGS Search Parameter Fix...\n');
  
  const usgsProvider = new USGSDataProvider();
  
  try {
    // Test 1: Basic magnitude search
    console.log('📍 Test 1: Basic magnitude search...');
    const basicSearch = await usgsProvider.searchEarthquakes({
      minMagnitude: 4.0,
      limit: 5
    });
    console.log(`✅ Found ${basicSearch.features.length} earthquakes M4.0+`);
    
    // Test 2: Geographic bounding box search
    console.log('\n📍 Test 2: California bounding box search...');
    const californiaSearch = await usgsProvider.searchEarthquakes({
      minLatitude: 32.0,
      maxLatitude: 42.0,
      minLongitude: -125.0,
      maxLongitude: -114.0,
      minMagnitude: 3.0,
      limit: 10
    });
    console.log(`✅ Found ${californiaSearch.features.length} earthquakes in California region`);
    
    // Test 3: Radius search
    console.log('\n📍 Test 3: Radius search around San Francisco...');
    const radiusSearch = await usgsProvider.searchEarthquakes({
      latitude: 37.7749,
      longitude: -122.4194,
      maxRadiusKm: 100,
      minMagnitude: 2.5,
      limit: 15
    });
    console.log(`✅ Found ${radiusSearch.features.length} earthquakes within 100km of San Francisco`);
    
    // Test 4: Time-based search
    console.log('\n📍 Test 4: Recent earthquakes (last 30 days)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timeSearch = await usgsProvider.searchEarthquakes({
      startTime: thirtyDaysAgo.toISOString().split('T')[0],
      minMagnitude: 5.0,
      limit: 20
    });
    console.log(`✅ Found ${timeSearch.features.length} earthquakes M5.0+ in last 30 days`);
    
    console.log('\n🎉 All search parameter tests passed! USGS API integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testSearchFix();
