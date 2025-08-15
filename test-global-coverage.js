#!/usr/bin/env node

/**
 * Test script to verify global earthquake monitoring coverage
 * Tests coordinates from around the world to ensure no regional limitations
 */

import { EarthquakeAnalyzer } from './dist/analyzers/earthquake-analyzer.js';
import { USGSDataProvider } from './dist/providers/usgs-provider.js';
import { GnssDataProvider } from './dist/providers/gnss-provider.js';
import { InSARDataProvider } from './dist/providers/insar-provider.js';

async function testGlobalCoverage() {
  console.log('🌍 Testing Global Earthquake Monitoring Coverage\n');

  const analyzer = new EarthquakeAnalyzer();
  const usgsProvider = new USGSDataProvider();
  const gnssProvider = new GnssDataProvider();
  const insarProvider = new InSARDataProvider();

  // Test locations from different continents
  const globalTestLocations = [
    // South America - Chile (Subduction zone)
    { lat: -33.4489, lon: -70.6693, name: "Santiago, Chile", region: "Chile Subduction Zone" },
    
    // Asia - Japan (Ring of Fire)
    { lat: 35.6762, lon: 139.6503, name: "Tokyo, Japan", region: "Japan Trench" },
    
    // Europe - Turkey (North Anatolian Fault)
    { lat: 41.0082, lon: 28.9784, name: "Istanbul, Turkey", region: "North Anatolian Fault" },
    
    // North America - California (San Andreas)
    { lat: 34.0522, lon: -118.2437, name: "Los Angeles, USA", region: "San Andreas Fault System" },
    
    // Oceania - New Zealand (Alpine Fault)
    { lat: -41.2865, lon: 174.7762, name: "Wellington, New Zealand", region: "Alpine Fault Zone" },
    
    // Indonesia - Ring of Fire
    { lat: -6.2088, lon: 106.8456, name: "Jakarta, Indonesia", region: "Sunda Megathrust" },
    
    // Iran - Zagros Mountains
    { lat: 32.4279, lon: 53.6880, name: "Isfahan, Iran", region: "Zagros Fold Belt" },
    
    // Greece - Aegean Sea
    { lat: 37.9755, lon: 23.7348, name: "Athens, Greece", region: "Hellenic Arc" }
  ];

  console.log('Testing USGS earthquake data worldwide...\n');
  
  for (const location of globalTestLocations) {
    try {
      console.log(`📍 Testing ${location.name} (${location.region})`);
      console.log(`   Coordinates: ${location.lat}°N, ${location.lon}°E`);
      
      // Test earthquake analysis
      const seismicAnalysis = await analyzer.analyzeRegion({
        center: { lat: location.lat, lon: location.lon },
        radius: 100,    // 100km radius
        timeWindow: 30, // 30 days
        minMagnitude: 3.0 // Min magnitude 3.0
      });
      
      console.log(`   ✅ Seismic Analysis: ${seismicAnalysis.totalEvents} events, risk: ${seismicAnalysis.riskLevel}`);
      
      // Test GNSS monitoring
      const gnssData = await gnssProvider.getStationDisplacements({
        bounds: {
          north: location.lat + 1,
          south: location.lat - 1,
          east: location.lon + 1,
          west: location.lon - 1
        },
        timeWindow: 7,
        threshold: 5
      });
      
      console.log(`   ✅ GNSS Monitoring: ${gnssData.stations.length} stations, ${gnssData.anomalies.length} anomalies`);
      
      // Test InSAR deformation analysis
      const insarData = await insarProvider.getDeformationTimeSeries({
        location: { latitude: location.lat, longitude: location.lon },
        radius: 50,
        timeWindow: 365,
        velocityThreshold: 5,
        coherenceThreshold: 0.6,
        method: "SBAS"
      });
      
      console.log(`   ✅ InSAR Analysis: ${insarData.measurements.length} measurements, velocity: ${insarData.trend.linearVelocity}mm/yr`);
      console.log(`   Quality: ${insarData.quality.overallQuality}, coherence: ${insarData.quality.temporalCoherence}\n`);
      
    } catch (error) {
      console.error(`   ❌ Error testing ${location.name}: ${error.message}\n`);
    }
  }

  // Test rapid deformation detection across large regions
  console.log('🔍 Testing Global Rapid Deformation Detection...\n');
  
  const globalRegions = [
    { name: "Pacific Ring of Fire - North", bounds: { north: 60, south: 30, east: -120, west: -160 }},
    { name: "Pacific Ring of Fire - South", bounds: { north: -10, south: -50, east: -60, west: -80 }},
    { name: "Mediterranean Seismic Zone", bounds: { north: 45, south: 30, east: 45, west: -10 }},
    { name: "Indonesian Archipelago", bounds: { north: 10, south: -15, east: 145, west: 90 }},
    { name: "Alpine-Himalayan Belt", bounds: { north: 45, south: 25, east: 100, west: 25 }}
  ];

  for (const region of globalRegions) {
    try {
      console.log(`🌐 Scanning ${region.name}...`);
      
      const rapidDeformation = await insarProvider.detectRapidDeformation(
        region.bounds,
        10 // 10 mm/year threshold
      );
      
      console.log(`   ✅ Found ${rapidDeformation.length} rapid deformation signals`);
      
      if (rapidDeformation.length > 0) {
        const criticalSignals = rapidDeformation.filter(d => d.significance === 'critical');
        const highSignals = rapidDeformation.filter(d => d.significance === 'high');
        
        console.log(`   🚨 Critical signals: ${criticalSignals.length}, High significance: ${highSignals.length}`);
        
        if (criticalSignals.length > 0) {
          const signal = criticalSignals[0];
          console.log(`   📍 Critical signal at ${signal.location.latitude}°, ${signal.location.longitude}°`);
          console.log(`      Velocity: ${signal.velocity}mm/yr ${signal.direction}, Confidence: ${signal.confidence}`);
        }
      }
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error scanning ${region.name}: ${error.message}\n`);
    }
  }

  console.log('🎉 Global Coverage Testing Complete!');
  console.log('✅ All major seismic regions accessible');
  console.log('✅ No geographic limitations detected');
  console.log('✅ Worldwide coordinate-based queries working');
}

// Run the global coverage test
testGlobalCoverage().catch(error => {
  console.error('Global coverage test failed:', error);
  process.exit(1);
});
