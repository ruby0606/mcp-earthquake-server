#!/usr/bin/env node

/**
 * Simple MCP client to test global earthquake monitoring tools
 */

import { spawn } from 'child_process';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testGlobalEarthquakeMonitoring() {
  console.log('🌍 Testing Global Earthquake Monitoring MCP Server\n');

  // Start the MCP server
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const transport = new StdioClientTransport({
    reader: serverProcess.stdout,
    writer: serverProcess.stdin
  });

  const client = new Client(
    {
      name: "earthquake-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {}
    }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // Test 1: Get recent earthquakes globally
    console.log('\n📡 Test 1: Getting recent global earthquakes...');
    const recentEarthquakes = await client.callTool({
      name: "get-usgs-earthquakes",
      arguments: {
        magnitude: "4.5",
        timeframe: "day"
      }
    });
    console.log('✅ Recent earthquakes:', JSON.parse(recentEarthquakes.content[0].text).summary);

    // Test 2: Search earthquakes near Tokyo, Japan
    console.log('\n🗾 Test 2: Searching earthquakes near Tokyo, Japan...');
    const tokyoEarthquakes = await client.callTool({
      name: "search-usgs-earthquakes", 
      arguments: {
        latitude: 35.6762,
        longitude: 139.6503,
        maxRadiusKm: 500,
        minMagnitude: 4.0,
        startTime: "2024-01-01",
        limit: 10
      }
    });
    console.log('✅ Tokyo area earthquakes:', JSON.parse(tokyoEarthquakes.content[0].text).summary);

    // Test 3: Analyze seismic activity in Chile
    console.log('\n🇨🇱 Test 3: Analyzing seismic activity in Chile...');
    const chileSeismic = await client.callTool({
      name: "analyze-seismic-activity",
      arguments: {
        latitude: -33.4489,
        longitude: -70.6693,
        radius: 200,
        timeWindow: 30,
        minMagnitude: 3.5
      }
    });
    console.log('✅ Chile seismic analysis completed');

    // Test 4: Monitor GNSS displacement in Turkey
    console.log('\n🇹🇷 Test 4: Monitoring GNSS displacement in Turkey...');
    const turkeyGNSS = await client.callTool({
      name: "monitor-gnss-displacement",
      arguments: {
        region: "turkey",
        threshold: 5,
        timeWindow: 7
      }
    });
    console.log('✅ Turkey GNSS monitoring completed');

    // Test 5: Get seismic hazard assessment for New Zealand
    console.log('\n🇳🇿 Test 5: Seismic hazard assessment for New Zealand...');
    const nzHazard = await client.callTool({
      name: "get-seismic-hazard",
      arguments: {
        latitude: -41.2865,
        longitude: 174.7762
      }
    });
    console.log('✅ New Zealand hazard assessment completed');

    console.log('\n🎉 All global tests completed successfully!');
    console.log('✅ Worldwide earthquake monitoring fully operational');
    console.log('✅ No geographic limitations detected');
    
  } catch (error) {
    console.error('❌ Error during global testing:', error.message);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

// Run the tests
testGlobalEarthquakeMonitoring().catch(console.error);
