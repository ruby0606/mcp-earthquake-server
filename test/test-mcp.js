#!/usr/bin/env node

// Test script to verify MCP server works before Claude Desktop
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing USGS Earthquake MCP Server...\n');

// Test requests to send to the MCP server
const testRequests = [
  {
    name: "List Tools",
    request: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {}
    }
  },
  {
    name: "Get Recent Earthquakes (M4.0+)",
    request: {
      jsonrpc: "2.0", 
      id: 2,
      method: "tools/call",
      params: {
        name: "get_recent_earthquakes",
        arguments: {
          magnitude_min: 4.0,
          limit: 5
        }
      }
    }
  },
  {
    name: "Get Daily Summary",
    request: {
      jsonrpc: "2.0",
      id: 3, 
      method: "tools/call",
      params: {
        name: "get_earthquake_summary",
        arguments: {
          type: "daily",
          include_predictions: true
        }
      }
    }
  }
];

async function testMCPServer() {
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  
  for (const test of testRequests) {
    console.log(`\n📋 Testing: ${test.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await sendMCPRequest(serverPath, test.request);
      console.log('✅ Success!');
      
      if (test.name === "List Tools") {
        const tools = result?.tools || [];
        console.log(`Found ${tools.length} tools:`);
        tools.forEach(tool => console.log(`  • ${tool.name}: ${tool.description}`));
      } else if (test.name.includes("Recent Earthquakes")) {
        try {
          const content = JSON.parse(result?.content?.[0]?.text || '{}');
          console.log(`Found ${content.count || 0} recent earthquakes`);
          if (content.earthquakes) {
            content.earthquakes.forEach(eq => {
              console.log(`  • M${eq.magnitude} - ${eq.location} (${eq.time})`);
            });
          }
        } catch (e) {
          console.log('Response:', JSON.stringify(result, null, 2));
        }
      } else {
        console.log('Response received (truncated):', JSON.stringify(result, null, 2).substring(0, 200) + '...');
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('\n🎉 MCP Server testing complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Install Claude Desktop from claude.ai/download');
  console.log('2. Restart Claude Desktop (if already installed)');
  console.log('3. Look for "usgs-earthquake-server" in Claude\'s tool list');
  console.log('4. Try asking Claude: "What recent earthquakes have happened?"');
}

function sendMCPRequest(serverPath, request) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Server exited with code ${code}. Error: ${stderr}`));
        return;
      }
      
      try {
        // Extract JSON response from stdout (ignore server status messages)
        const lines = stdout.split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        
        if (jsonLine) {
          const response = JSON.parse(jsonLine);
          resolve(response.result);
        } else {
          reject(new Error('No valid JSON response found'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error.message}`));
      }
    });
    
    // Send request
    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();
    
    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill();
      reject(new Error('Request timeout'));
    }, 10000);
  });
}

testMCPServer().catch(console.error);
