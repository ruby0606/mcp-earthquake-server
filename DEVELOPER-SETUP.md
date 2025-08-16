# 🌍 MCP Earthquake Monitoring Server - Developer Setup Guide

A comprehensive Model Context Protocol (MCP) server for global earthquake monitoring and seismic data analysis. This server integrates multiple authoritative data sources including IRIS, USGS, and GNSS networks to provide worldwide earthquake monitoring capabilities.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm** or **yarn** package manager
- **TypeScript** knowledge (helpful but not required)
- **MCP-compatible client** (Claude Desktop, VS Code with MCP extension, or custom implementation)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd mcp-earthquake-server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the project:**
```bash
npm run build
```

4. **Test the installation:**
```bash
npm run start
```

### Quick Test
```bash
# Test IRIS integration
node test-iris.js

# Test global coverage
node test-global-coverage.js
```

## 📋 Client Configuration

### Claude Desktop Setup

Add to your Claude Desktop configuration (`%APPDATA%\Claude\claude_desktop_config.json` on Windows, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "earthquake-monitoring": {
      "command": "node",
      "args": ["/path/to/mcp-earthquake-server/dist/index.js"],
      "env": {}
    }
  }
}
```

### VS Code Setup

1. **Install MCP extension** (if available)
2. **Add to VS Code settings.json:**
```json
{
  "mcp.servers": {
    "earthquake-monitoring": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/mcp-earthquake-server"
    }
  }
}
```

### Custom MCP Client

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: '/path/to/mcp-earthquake-server',
  stdio: ['pipe', 'pipe', 'pipe']
});

const transport = new StdioClientTransport({
  reader: serverProcess.stdout,
  writer: serverProcess.stdin
});

const client = new Client({
  name: "earthquake-client",
  version: "1.0.0"
}, { capabilities: {} });

await client.connect(transport);

// Use earthquake monitoring tools
const recentEarthquakes = await client.callTool({
  name: "get-usgs-earthquakes",
  arguments: { magnitude: "4.5", timeframe: "day" }
});
```

## 🔧 Available Tools

### Seismic Analysis
- **`analyze-seismic-activity`** - Comprehensive regional earthquake analysis
- **`fetch-waveform`** - Retrieve seismic waveform data from IRIS

### Geodetic Monitoring  
- **`monitor-gnss-displacement`** - Monitor GPS stations for crustal movements

### Satellite Analysis
- **`detect-rapid-deformation`** - Detect anomalous ground movements
- **`generate-interferogram`** - Create SAR interferograms

### Real-time Data
- **`get-usgs-earthquakes`** - Recent earthquake feeds with magnitude filters
- **`search-usgs-earthquakes`** - Custom earthquake database searches
- **`get-usgs-shakemap`** - ShakeMap intensity data for specific events
- **`get-seismic-hazard`** - Probabilistic seismic hazard assessments

### Resources
- **`iris-catalog`** - IRIS earthquake catalog access
- **`gnss-stations`** - GNSS station network information
- **`realtime-earthquakes`** - Live earthquake feeds
- **`usgs-realtime`** - USGS real-time earthquake data

## 💡 Usage Examples

### Basic Earthquake Analysis
```javascript
// Analyze seismic activity around Tokyo
const tokyoAnalysis = await client.callTool({
  name: "analyze-seismic-activity",
  arguments: {
    latitude: 35.6762,
    longitude: 139.6503,
    radius: 200,
    timeWindow: 30,
    minMagnitude: 3.0
  }
});
```

### Global Deformation Monitoring
```javascript
// Monitor rapid deformation globally
const globalDeformation = await client.callTool({
  name: "detect-rapid-deformation", 
  arguments: {
    north: 60,
    south: -60,
    east: 180,
    west: -180,
    velocityThreshold: 15
  }
});
```

### Real-time Earthquake Feeds
```javascript
// Get significant recent earthquakes
const significantQuakes = await client.callTool({
  name: "get-usgs-earthquakes",
  arguments: {
    magnitude: "significant",
    timeframe: "week"
  }
});
```

## 🌐 Global Coverage

This server supports **worldwide earthquake monitoring** with no geographic restrictions:

- **Americas**: California, Chile, Alaska, Caribbean, Eastern US
- **Asia-Pacific**: Japan, Indonesia, Philippines, New Zealand, Australia  
- **Europe-Mediterranean**: Turkey, Italy, Greece, Iceland
- **Africa**: East African Rift, Morocco, South Africa
- **Mid-Ocean Ridges**: Atlantic, Pacific, Indian Ocean spreading centers

### Supported Coordinate Ranges
- **Latitude**: -90° to +90° (South to North)
- **Longitude**: -180° to +180° (West to East)  
- **Radius**: 1km to 20,000km
- **Magnitude**: 0.0 to 10.0
- **Time Windows**: 1 day to 10 years

## 📊 Data Sources

### IRIS (Incorporated Research Institutions for Seismology)
- **Endpoint**: `https://service.iris.edu/fdsnws/event/1/`
- **Coverage**: Global earthquake catalog, waveforms, station metadata
- **Update Frequency**: Real-time to near-real-time
- **Data Format**: Text (pipe-delimited)

### USGS Earthquake Hazards Program  
- **Endpoint**: `https://earthquake.usgs.gov/earthquakes/feed/`
- **Coverage**: Global real-time earthquakes, ShakeMaps, hazard data
- **Update Frequency**: Real-time (1-5 minute delays)
- **Data Format**: GeoJSON

### GNSS Networks (GPS/GLONASS/Galileo)
- **Sources**: UNAVCO, Nevada Geodetic Lab, regional networks
- **Coverage**: Global crustal deformation measurements
- **Update Frequency**: Daily to weekly
- **Precision**: Millimeter-level displacement detection

## 🔒 Rate Limits and Best Practices

### API Rate Limits
- **IRIS**: ~10 requests/minute (recommended)
- **USGS**: No strict limits, but be respectful
- **Caching**: Results cached internally for performance

### Responsible Usage
```javascript
// Good: Reasonable time windows
const analysis = await client.callTool({
  name: "analyze-seismic-activity",
  arguments: {
    timeWindow: 30, // 30 days - reasonable
    radius: 100     // 100km - focused analysis
  }
});

// Avoid: Excessive requests
// Don't: timeWindow: 3650 (10 years), radius: 20000 (global)
```

### Performance Tips
- Use appropriate time windows (7-90 days typical)
- Limit search radius to area of interest
- Cache results for repeated analyses  
- Batch multiple location queries when possible

## 🧪 Development and Testing

### Project Structure
```
mcp-earthquake-server/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── providers/            # Data source integrations
│   │   ├── iris-provider.ts  # IRIS seismological data
│   │   ├── usgs-provider.ts  # USGS earthquake feeds  
│   │   ├── gnss-provider.ts  # GNSS station networks
│   └── analyzers/
│       └── earthquake-analyzer.ts # Analysis engine
├── dist/                     # Compiled JavaScript
├── test-*.js                # Test scripts
└── package.json
```

### Development Commands
```bash
# Development mode with auto-reload
npm run dev

# Build TypeScript
npm run build  

# Production start
npm run start

# Run tests
node test-iris.js
node test-global-coverage.js
```

### Adding New Features

1. **New Data Provider**:
```typescript
// src/providers/new-provider.ts
export class NewDataProvider {
  async getData(params: DataParams): Promise<DataResult> {
    // Implementation
  }
}
```

2. **New Tool**:
```typescript
// In src/index.ts
server.registerTool("new-tool", {
  title: "New Analysis Tool",
  description: "Description of what it does",
  inputSchema: {
    parameter: z.string().describe("Parameter description")
  }
}, async ({ parameter }) => {
  // Tool implementation
});
```

## 🤝 Contributing

### For Researchers
- **Report Issues**: Found inaccurate data or analysis? Please report!
- **Suggest Features**: Need specific analysis capabilities?
- **Validation**: Help validate results against known seismic events
- **Documentation**: Improve scientific accuracy of descriptions

### For Developers  
- **Code Contributions**: Bug fixes, performance improvements
- **New Integrations**: Additional data sources, analysis methods
- **Client Libraries**: SDKs for different programming languages
- **Testing**: Expand test coverage and validation

### Getting Started Contributing
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-capability`
3. **Make changes** and add tests
4. **Submit pull request** with detailed description

## 📄 License and Citation

### License
This project is licensed under the **MIT License** - see LICENSE file for details.

### Citation
If you use this server in research, please cite:
```bibtex
@software{mcp_earthquake_server,
  title={MCP Earthquake Monitoring Server},
  author={[Your Name/Organization]},
  year={2025},
  url={https://github.com/[username]/mcp-earthquake-server},
  note={Comprehensive earthquake monitoring via Model Context Protocol}
}
```

### Acknowledgments
- **IRIS**: Earthquake catalog and waveform data
- **USGS**: Real-time earthquake feeds and hazard assessments
- **UNAVCO/EarthScope**: GNSS crustal deformation measurements

## ⚠️ Disclaimer

This software is for **research and educational purposes**. Earthquake prediction remains scientifically uncertain. **Do not rely on this tool for life safety decisions.** Always follow official emergency management guidance and early warning systems.

For emergency earthquake information, consult:
- **USGS**: https://earthquake.usgs.gov/
- **Local seismic networks** and emergency management agencies
- **Official tsunami warning systems**

## 📞 Support

### Community Support
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Research applications and use cases
- **Documentation**: Wiki and guides

### Professional Support
For commercial applications or custom development:
- Technical consulting available
- Custom integrations and analysis tools
- Training and workshops for research teams

---

**🌍 Happy Earthquake Monitoring! 🌍**

*Advancing earthquake science through open, accessible, and comprehensive seismic data integration.*
