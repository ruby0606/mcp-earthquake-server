#!/usr/bin/env node

/**
 * Test InSAR integration in the MCP Earthquake Server
 */

import { spawn } from "child_process";
import { join } from "path";

console.log("🛰️ Testing InSAR Integration in MCP Earthquake Server...\n");

const serverPath = join(process.cwd(), "dist", "index.js");

const server = spawn("node", [serverPath], {
  stdio: ["pipe", "pipe", "pipe"]
});

let mcpReady = false;
let toolCount = 0;

// Send MCP initialization
setTimeout(() => {
  console.log("📡 Sending MCP initialization...");
  
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  };
  
  server.stdin.write(JSON.stringify(initMessage) + "\n");
}, 1000);

// Request tools list
setTimeout(() => {
  console.log("🔧 Requesting tools list...");
  
  const toolsMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  
  server.stdin.write(JSON.stringify(toolsMessage) + "\n");
}, 2000);

server.stdout.on("data", (data) => {
  const output = data.toString();
  
  // Look for JSON-RPC responses
  if (output.includes('"jsonrpc"')) {
    try {
      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.includes('"jsonrpc"')) {
          const response = JSON.parse(line);
          
          if (response.id === 1 && response.result) {
            console.log("✅ MCP initialization successful");
            console.log(`   Server: ${response.result.serverInfo.name} v${response.result.serverInfo.version}`);
            mcpReady = true;
          }
          
          if (response.id === 2 && response.result?.tools) {
            console.log(`✅ Found ${response.result.tools.length} tools:`);
            const tools = response.result.tools;
            
            // Check for our InSAR tools
            const insarTools = tools.filter(t => t.name.includes('insar') || t.name.includes('deformation') || t.name.includes('interferogram'));
            
            tools.forEach(tool => {
              const emoji = tool.name.includes('insar') || tool.name.includes('deformation') || tool.name.includes('interferogram') ? '🛰️' : 
                           tool.name.includes('gnss') ? '📡' : 
                           tool.name.includes('seismic') || tool.name.includes('earthquake') ? '🌍' : '🔧';
              console.log(`   ${emoji} ${tool.name}: ${tool.description}`);
            });
            
            console.log(`\n🎯 InSAR Tools Found: ${insarTools.length}`);
            insarTools.forEach(tool => {
              console.log(`   🛰️ ${tool.name}`);
            });
            
            server.kill();
            
            // Final summary
            setTimeout(() => {
              console.log("\n📊 Integration Test Summary:");
              console.log(`   ✅ Total tools: ${tools.length}`);
              console.log(`   🛰️ InSAR tools: ${insarTools.length}`);
              console.log(`   📡 GNSS tools: ${tools.filter(t => t.name.includes('gnss')).length}`);
              console.log(`   🌍 Seismic tools: ${tools.filter(t => t.name.includes('seismic') || t.name.includes('earthquake')).length}`);
              console.log("\n🚀 Enhanced earthquake monitoring server is ready!");
              process.exit(0);
            }, 100);
          }
        }
      }
    } catch (e) {
      // Ignore non-JSON output
    }
  }
});

server.stderr.on("data", (data) => {
  console.error("❌ Server error:", data.toString());
});

server.on("close", (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
});

// Cleanup after timeout
setTimeout(() => {
  if (server && !server.killed) {
    server.kill();
    console.log("⏰ Test timeout - cleaning up");
    process.exit(1);
  }
}, 10000);
