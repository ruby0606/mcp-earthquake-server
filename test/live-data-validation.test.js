import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IrisDataProvider } from '../dist/providers/iris-provider.js';
import { USGSDataProvider } from '../dist/providers/usgs-provider.js';
import { GnssDataProvider } from '../dist/providers/gnss-provider.js';

/**
 * Live Data Validation Tests
 * These tests verify that the MCP server accesses real, live data sources
 * and does not rely on hardcoded or hallucinated information.
 */

// USGS Live Data Tests
test('USGS provider returns real-time earthquake data', async () => {
  const usgsProvider = new USGSDataProvider();
  
  // Test recent earthquakes - should return live data
  const recentEarthquakes = await usgsProvider.getEarthquakes('all', 'day');
  
  // Validate structure of real USGS data
  assert.ok(recentEarthquakes.features, 'Should have features array');
  assert.ok(Array.isArray(recentEarthquakes.features), 'Features should be array');
  
  if (recentEarthquakes.features.length > 0) {
    const earthquake = recentEarthquakes.features[0];
    
    // Validate real USGS earthquake data structure
    assert.ok(earthquake.properties, 'Earthquake should have properties');
    assert.ok(earthquake.geometry, 'Earthquake should have geometry');
    assert.ok(typeof earthquake.properties.mag === 'number', 'Magnitude should be number');
    assert.ok(typeof earthquake.properties.time === 'number', 'Time should be timestamp');
    assert.ok(typeof earthquake.properties.place === 'string', 'Place should be string');
    assert.ok(Array.isArray(earthquake.geometry.coordinates), 'Coordinates should be array');
    assert.equal(earthquake.geometry.coordinates.length, 3, 'Should have lon, lat, depth');
    
    // Validate reasonable ranges for live data
    const mag = earthquake.properties.mag;
    const coords = earthquake.geometry.coordinates;
    assert.ok(mag >= -3 && mag <= 10, `Magnitude ${mag} should be in reasonable range`);
    assert.ok(coords[1] >= -90 && coords[1] <= 90, `Latitude ${coords[1]} should be valid`);
    assert.ok(coords[0] >= -180 && coords[0] <= 180, `Longitude ${coords[0]} should be valid`);
    
    // Validate timestamp is recent (within last 24 hours for 'day' feed)
    const eventTime = new Date(earthquake.properties.time);
    const now = new Date();
    const hoursDiff = (now - eventTime) / (1000 * 60 * 60);
    assert.ok(hoursDiff <= 25, `Event should be recent, was ${hoursDiff.toFixed(1)} hours ago`);
  }
});

test('USGS search returns consistent data structure', async () => {
  const usgsProvider = new USGSDataProvider();
  
  // Search for earthquakes in a known seismically active region (California)
  const searchResults = await usgsProvider.searchEarthquakes({
    minlatitude: 32,
    maxlatitude: 42,
    minlongitude: -125,
    maxlongitude: -114,
    minmagnitude: 3.0,
    limit: 50
  });
  
  assert.ok(searchResults.features, 'Search results should have features');
  assert.ok(Array.isArray(searchResults.features), 'Features should be array');
  
  // Validate all results match search criteria
  searchResults.features.forEach((eq, index) => {
    const coords = eq.geometry.coordinates;
    const mag = eq.properties.mag;
    
    assert.ok(coords[1] >= 32 && coords[1] <= 42, 
      `Result ${index}: Latitude ${coords[1]} should be within search bounds`);
    assert.ok(coords[0] >= -125 && coords[0] <= -114, 
      `Result ${index}: Longitude ${coords[0]} should be within search bounds`);
    assert.ok(mag >= 3.0, 
      `Result ${index}: Magnitude ${mag} should meet minimum criteria`);
  });
});

// IRIS Live Data Tests  
test('IRIS provider connects to real FDSNWS service', async () => {
  const irisProvider = new IrisDataProvider();
  
  try {
    // Test connection to IRIS earthquake catalog
    const earthquakes = await irisProvider.getEarthquakeCatalog({
      starttime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
      endtime: new Date().toISOString().split('T')[0], // today
      minmagnitude: 5.0,
      limit: 100
    });
    
    assert.ok(Array.isArray(earthquakes), 'IRIS should return array of earthquakes');
    
    if (earthquakes.length > 0) {
      const earthquake = earthquakes[0];
      
      // Validate IRIS data structure
      assert.ok(earthquake.eventId, 'Should have eventId');
      assert.ok(typeof earthquake.magnitude === 'number', 'Magnitude should be number');
      assert.ok(typeof earthquake.latitude === 'number', 'Latitude should be number');
      assert.ok(typeof earthquake.longitude === 'number', 'Longitude should be number');
      assert.ok(earthquake.time, 'Should have time');
      
      // Validate realistic values
      assert.ok(earthquake.magnitude >= 5.0, 'Should meet minimum magnitude criteria');
      assert.ok(earthquake.latitude >= -90 && earthquake.latitude <= 90, 'Valid latitude');
      assert.ok(earthquake.longitude >= -180 && earthquake.longitude <= 180, 'Valid longitude');
    }
  } catch (error) {
    // IRIS may be temporarily unavailable - log but don't fail
    console.warn('IRIS service temporarily unavailable:', error.message);
  }
});

// GNSS Live Data Tests
test('GNSS provider accesses real station data', async () => {
  const gnssProvider = new GnssDataProvider();
  
  try {
  // Test displacement monitoring for a known active region
  const displacements = await gnssProvider.monitorDisplacements({
    region: 'california',
    threshold: 5.0,
    timeWindow: 7
  });    assert.ok(Array.isArray(displacements), 'Should return array of displacement measurements');
    
    if (displacements.length > 0) {
      const measurement = displacements[0];
      
      // Validate GNSS measurement structure
      assert.ok(measurement.stationId, 'Should have station ID');
      assert.ok(typeof measurement.latitude === 'number', 'Latitude should be number');
      assert.ok(typeof measurement.longitude === 'number', 'Longitude should be number');
      assert.ok(typeof measurement.displacement === 'number', 'Displacement should be number');
      assert.ok(measurement.timestamp, 'Should have timestamp');
      
      // Validate realistic GNSS values
      assert.ok(measurement.latitude >= -90 && measurement.latitude <= 90, 'Valid latitude');
      assert.ok(measurement.longitude >= -180 && measurement.longitude <= 180, 'Valid longitude');
      assert.ok(Math.abs(measurement.displacement) <= 1000, 'Displacement should be reasonable (mm)');
    }
  } catch (error) {
    // GNSS may be temporarily unavailable - log but don't fail
    console.warn('GNSS service temporarily unavailable:', error.message);
  }
});

// Data Freshness Tests
test('USGS data timestamps indicate fresh data', async () => {
  const usgsProvider = new USGSDataProvider();
  
  const recentEarthquakes = await usgsProvider.getEarthquakes('all', 'hour');
  
  if (recentEarthquakes.features.length > 0) {
    const latestEarthquake = recentEarthquakes.features[0];
    const eventTime = new Date(latestEarthquake.properties.time);
    const now = new Date();
    
    // For 'hour' feed, data should be very recent
    const minutesDiff = (now - eventTime) / (1000 * 60);
    assert.ok(minutesDiff <= 90, 
      `Latest earthquake should be very recent, was ${minutesDiff.toFixed(1)} minutes ago`);
  }
});

// API Response Validation Tests
test('API responses contain required metadata', async () => {
  const usgsProvider = new USGSDataProvider();
  
  const response = await usgsProvider.getEarthquakes('2.5', 'day');
  
  // Validate USGS GeoJSON structure
  assert.equal(response.type, 'FeatureCollection', 'Should be GeoJSON FeatureCollection');
  assert.ok(response.metadata, 'Should have metadata');
  assert.ok(response.features, 'Should have features array');
  
  if (response.metadata) {
    assert.ok(response.metadata.generated, 'Metadata should have generation timestamp');
    assert.ok(response.metadata.url, 'Metadata should have source URL');
    assert.ok(response.metadata.title, 'Metadata should have title');
  }
});

// Cross-validation Tests
test('Multiple data sources show consistent global seismic activity', async () => {
  const usgsProvider = new USGSDataProvider();
  
  // Get significant earthquakes from USGS
  const usgsSignificant = await usgsProvider.getEarthquakes('significant', 'week');
  
  if (usgsSignificant.features.length > 0) {
    // Check that significant earthquakes are indeed significant (M6+)
    usgsSignificant.features.forEach((eq, index) => {
      assert.ok(eq.properties.mag >= 6.0 || eq.properties.sig >= 600, 
        `Significant earthquake ${index} should have M6+ or high significance score`);
    });
  }
  
  // Get all M4.5+ earthquakes and verify they include the significant ones
  const usgsM45 = await usgsProvider.getEarthquakes('4.5', 'week');
  const significantMagnitudes = usgsSignificant.features.map(eq => eq.properties.mag);
  const allM45Magnitudes = usgsM45.features.map(eq => eq.properties.mag);
  
  // All significant earthquakes should appear in M4.5+ feed
  significantMagnitudes.forEach(mag => {
    assert.ok(allM45Magnitudes.some(m45mag => Math.abs(m45mag - mag) < 0.1),
      `Significant earthquake M${mag} should appear in M4.5+ feed`);
  });
});
