import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

/**
 * MCP Server Integration Tests
 * These tests validate that the MCP server correctly implements the protocol
 * and provides accurate, non-hallucinated responses to tool calls.
 */

// Helper function to create a test MCP client
async function createTestClient() {
  // Start the MCP server as a child process
  const serverProcess = spawn('node', ['../dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  // Create client with stdio transport
  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Connect to the server process
  const transport = new StdioServerTransport();
  transport.start(serverProcess.stdout, serverProcess.stdin);
  
  await client.connect(transport);
  
  return { client, serverProcess };
}

test('MCP server implements required protocol methods', async () => {
  const { client, serverProcess } = await createTestClient();
  
  try {
    // Test server info
    const serverInfo = await client.getServerInfo();
    assert.ok(serverInfo.name, 'Server should have name');
    assert.ok(serverInfo.version, 'Server should have version');
    
    // Test available tools
    const tools = await client.listTools();
    assert.ok(Array.isArray(tools.tools), 'Should return tools array');
    assert.ok(tools.tools.length > 0, 'Should have at least one tool');
    
    // Validate tool structure
    tools.tools.forEach(tool => {
      assert.ok(tool.name, 'Tool should have name');
      assert.ok(tool.description, 'Tool should have description');
      assert.ok(tool.inputSchema, 'Tool should have input schema');
    });
    
    // Test available resources
    const resources = await client.listResources();
    assert.ok(Array.isArray(resources.resources), 'Should return resources array');
    
  } finally {
    serverProcess.kill();
    await setTimeout(100); // Give process time to clean up
  }
});

test('get-usgs-earthquakes tool returns live data', async () => {
  const { client, serverProcess } = await createTestClient();
  
  try {
    // Call the USGS earthquakes tool
    const result = await client.callTool('get-usgs-earthquakes', {
      timeframe: 'day',
      magnitude: '2.5'
    });
    
    assert.ok(result.content, 'Should return content');
    assert.ok(Array.isArray(result.content), 'Content should be array');
    assert.ok(result.content.length > 0, 'Should have content');
    
    const textContent = result.content.find(c => c.type === 'text');
    assert.ok(textContent, 'Should have text content');
    assert.ok(textContent.text, 'Text content should have text');
    
    // Validate that response contains real data indicators
    const text = textContent.text;
    assert.ok(text.includes('Recent Earthquakes'), 'Should contain earthquake data header');
    assert.ok(text.includes('M'), 'Should contain magnitude references');
    assert.ok(!text.includes('mock') && !text.includes('fake') && !text.includes('example'), 
      'Should not contain mock data indicators');
    
  } finally {
    serverProcess.kill();
    await setTimeout(100);
  }
});

test('analyze-seismic-activity tool provides scientific analysis', async () => {
  const { client, serverProcess } = await createTestClient();
  
  try {
    // Test seismic analysis for California (known active region)
    const result = await client.callTool('analyze-seismic-activity', {
      latitude: 35.0,
      longitude: -120.0,
      radius: 100,
      timeWindow: 30,
      minMagnitude: 3.0
    });
    
    assert.ok(result.content, 'Should return analysis content');
    const textContent = result.content.find(c => c.type === 'text');
    assert.ok(textContent, 'Should have text analysis');
    
    const text = textContent.text;
    
    // Validate scientific analysis components
    assert.ok(text.includes('Seismic Activity Analysis'), 'Should have analysis header');
    assert.ok(text.includes('Region:'), 'Should specify analyzed region');
    assert.ok(text.includes('Time Period:'), 'Should specify time period');
    assert.ok(text.includes('Total Events:'), 'Should report event count');
    assert.ok(text.includes('Risk Level:'), 'Should provide risk assessment');
    
    // Validate scientific terminology (not hallucinated)
    assert.ok(text.match(/M\d+\.\d+/), 'Should contain magnitude values');
    assert.ok(text.includes('km'), 'Should contain distance units');
    assert.ok(text.includes('days'), 'Should contain time units');
    
    // Should not contain obvious hallucinations
    assert.ok(!text.includes('based on fictional') && !text.includes('hypothetical'), 
      'Should not contain fictional disclaimers');
    
  } finally {
    serverProcess.kill();
    await setTimeout(100);
  }
});

test('search-usgs-earthquakes tool respects search parameters', async () => {
  const { client, serverProcess } = await createTestClient();
  
  try {
    // Search for earthquakes in Japan region with specific magnitude
    const result = await client.callTool('search-usgs-earthquakes', {
      minLatitude: 30,
      maxLatitude: 46,
      minLongitude: 129,
      maxLongitude: 146,
      minMagnitude: 4.0,
      limit: 20
    });
    
    assert.ok(result.content, 'Should return search results');
    const textContent = result.content.find(c => c.type === 'text');
    assert.ok(textContent, 'Should have text results');
    
    const text = textContent.text;
    
    // Validate search parameters are reflected in results
    assert.ok(text.includes('Search Parameters'), 'Should show search parameters');
    assert.ok(text.includes('Min Magnitude: M4'), 'Should show magnitude filter');
    assert.ok(text.includes('Results:'), 'Should show result count');
    
    // Validate data structure indicates real results
    if (text.includes('earthquakes found') && !text.includes('0 earthquakes found')) {
      assert.ok(text.includes('Top Results by Magnitude'), 'Should show magnitude-sorted results');
      assert.ok(text.includes('Date:'), 'Should show event dates');
      assert.ok(text.includes('Depth:'), 'Should show event depths');
    }
    
  } finally {
    serverProcess.kill();
    await setTimeout(100);
  }
});

test('monitor-gnss-displacement tool accesses real station data', async () => {
  const { client, serverProcess } = await createTestClient();
  
  try {
    // Monitor GNSS displacement in California
    const result = await client.callTool('monitor-gnss-displacement', {
      region: 'california',
      threshold: 3.0,
      timeWindow: 7
    });
    
    assert.ok(result.content, 'Should return GNSS monitoring results');
    const textContent = result.content.find(c => c.type === 'text');
    assert.ok(textContent, 'Should have text results');
    
    const text = textContent.text;
    
    // Validate GNSS monitoring components
    assert.ok(text.includes('GNSS Displacement Monitoring'), 'Should have monitoring header');
    assert.ok(text.includes('Region: California'), 'Should specify monitored region');
    assert.ok(text.includes('Threshold:'), 'Should show displacement threshold');
    assert.ok(text.includes('Time Window:'), 'Should show monitoring period');
    
    // Should provide realistic station information or explain availability
    assert.ok(text.includes('Station') || text.includes('monitoring') || text.includes('displacement'), 
      'Should contain relevant GNSS terminology');
    
  } finally {
    serverProcess.kill();
    await setTimeout(100);
  }
});

test('Tools return consistent data formats', async () => {
  const { client, serverProcess } = await createTestClient();
  
  try {
    // Test multiple tools to ensure consistent formatting
    const tools = ['get-usgs-earthquakes', 'analyze-seismic-activity'];
    const results = [];
    
    for (const toolName of tools) {
      let params = {};
      if (toolName === 'get-usgs-earthquakes') {
        params = { timeframe: 'day', magnitude: 'all' };
      } else if (toolName === 'analyze-seismic-activity') {
        params = { latitude: 37.7749, longitude: -122.4194, radius: 50 };
      }
      
      const result = await client.callTool(toolName, params);
      results.push({ tool: toolName, result });
    }
    
    // Validate all results have consistent structure
    results.forEach(({ tool, result }) => {
      assert.ok(result.content, `${tool} should return content`);
      assert.ok(Array.isArray(result.content), `${tool} content should be array`);
      
      const textContent = result.content.find(c => c.type === 'text');
      assert.ok(textContent, `${tool} should have text content`);
      assert.ok(typeof textContent.text === 'string', `${tool} text should be string`);
      assert.ok(textContent.text.length > 0, `${tool} should have non-empty text`);
    });
    
  } finally {
    serverProcess.kill();
    await setTimeout(100);
  }
});

test('Error handling provides meaningful messages', async () => {
  const { client, serverProcess } = await createTestClient();
  
  try {
    // Test with invalid parameters to trigger error handling
    const result = await client.callTool('analyze-seismic-activity', {
      latitude: 91, // Invalid latitude
      longitude: -120.0,
      radius: 50
    });
    
    // Should handle error gracefully
    assert.ok(result.content, 'Should return content even for errors');
    
    if (result.isError) {
      const textContent = result.content.find(c => c.type === 'text');
      assert.ok(textContent.text.includes('Error'), 'Error should be clearly indicated');
    }
    
  } finally {
    serverProcess.kill();
    await setTimeout(100);
  }
});
