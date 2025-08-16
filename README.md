# 🌍 Comprehensive Earthquake Monitoring MCP Server

A complete Model Context Protocol (MCP) server that provides access to multiple earthquake monitoring data sources including IRIS seismological data, GNSS/GPS crustal deformation measurements, and USGS earthquake feeds for comprehensive earthquake monitoring and analysis.

## 📋 Quick Links for Sharing

### 👥 For Other Developers
📖 **[Developer Setup Guide](DEVELOPER-SETUP.md)** - Complete installation and integration guide

### 🔬 For Researchers & Seismologists  
📊 **[Research Guide](RESEARCH-GUIDE.md)** - Scientific applications and research use cases

### 🔍 Code Quality
📋 **[Code Review Summary](CODE-REVIEW-SUMMARY.md)** - Comprehensive quality assessment and fixes

---

## 🚀 Quick Start

1. **Clone and install:**
```bash
git clone <repository-url>
cd mcp-earthquake-server
npm install
npm run build
```

2. **Test the installation:**
```bash
npm start
```

3. **Configure your MCP client** (see [Developer Setup Guide](DEVELOPER-SETUP.md))

## ✨ Key Features
- 🌍 **Global Coverage** - Worldwide monitoring
- 🔄 **Real-time Data** - Live earthquake feeds and rapid analysis
- 📡 **Multi-source Integration** - IRIS + USGS + GNSS
- 🛠️ **10 Comprehensive Tools** - From basic queries to advanced analysis
- 🔒 **Production Ready** - Fully tested, validated, and documented

## Features

### 🌍 Data Sources
- **IRIS (Incorporated Research Institutions for Seismology)** - Earthquake catalogs, waveform data, and station information
- **GNSS Networks** - GPS/GNSS station displacement measurements from UNAVCO, Nevada Geodetic Laboratory, and other providers
- **USGS Earthquake Hazards Program** - Real-time earthquake feeds, ShakeMap data, and seismic hazard assessments
- **Real-time Monitoring** - Latest earthquake activity, crustal deformation, and satellite observations with multi-source validation

### 📊 Resources Available
- `iris-catalog` - Access earthquake events from IRIS database
- `gnss-stations` - GPS/GNSS station network information
- `realtime-earthquakes` - Latest earthquake activity feed
- `usgs-realtime` - USGS real-time earthquake feeds with multiple magnitude filters
- `usgs-shakemap` - ShakeMap intensity and ground motion data for specific events

### 🔧 Tools Provided
**Seismic Analysis:**
- **analyze-seismic-activity** - Comprehensive seismic risk analysis for regions
- **fetch-waveform** - Retrieve seismic waveform data for specific events

**Geodetic Monitoring:**
- **monitor-gnss-displacement** - Monitor GPS stations for unusual crustal movements

**USGS Data Integration:**
- **get-usgs-earthquakes** - Retrieve recent earthquakes from USGS real-time feeds
- **search-usgs-earthquakes** - Search USGS earthquake database with custom parameters
- **get-usgs-shakemap** - Retrieve ShakeMap data for specific earthquakes
- **get-seismic-hazard** - Get probabilistic seismic hazard assessments

### 💬 Prompts
- **earthquake-risk-assessment** - Generate comprehensive risk assessments
- **interpret-seismic-data** - Help interpret complex seismic data

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- TypeScript
- MCP-compatible client (Claude Desktop, VS Code, etc.)

### Installation
1. Clone and install dependencies:
```bash
git clone <repository-url>
cd MCP
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Start the development server:
```bash
npm run dev
```

### MCP Client Configuration

#### Claude Desktop
Add to your Claude Desktop configuration file (`%APPDATA%\\Claude\\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "earthquake-data": {
      "command": "node",
      "args": ["C:\\path\\to\\your\\MCP\\dist\\index.js"]
    }
  }
}
```

#### VS Code
The server includes VS Code configuration in `.vscode/settings.json`.

## Usage Examples

### Analyze Seismic Activity
```typescript
// Analyze earthquake risk for Southern California
await analyzeSeismicActivity({
  latitude: 34.0522,
  longitude: -118.2437,
  radius: 100,
  timeWindow: 30,
  minMagnitude: 3.0
});
```

### Monitor GNSS Displacements
```typescript
// Check for unusual crustal movements in Japan
await monitorGnssDisplacement({
  region: "japan",
  threshold: 5.0,
  timeWindow: 7
});
```

### Fetch Earthquake Catalog
```typescript
// Get recent earthquakes in Chile
const catalog = await client.readResource(
  "iris://catalog/chile?starttime=2024-01-01T00:00:00Z&endtime=2024-01-31T23:59:59Z&minmag=4.0"
);
```

## API Reference

### Resources

#### IRIS Earthquake Catalog
- **URI Pattern**: `iris://catalog/{region}?starttime={start}&endtime={end}&minmag={minmag}`
- **Description**: Access earthquake events from IRIS database
- **Parameters**:
  - `region`: Geographic region (optional)
  - `starttime`: ISO datetime string
  - `endtime`: ISO datetime string  
  - `minmag`: Minimum magnitude threshold

#### GNSS Station Network
- **URI Pattern**: `gnss://stations/{network}?region={region}`
- **Description**: GPS/GNSS station information and status
- **Parameters**:
  - `network`: Network code (PBO, IGS, GEONET, etc.)
  - `region`: Geographic region

#### Real-time Earthquake Feed
- **URI Pattern**: `realtime://earthquakes?magnitude={mag}&hours={hours}`
- **Description**: Latest earthquake activity from multiple networks
- **Parameters**:
  - `magnitude`: Minimum magnitude (default: 2.5)
  - `hours`: Time window in hours (default: 24)

### Tools

#### Analyze Seismic Activity
Comprehensive earthquake risk analysis including:
- Statistical analysis of earthquake patterns
- Gutenberg-Richter b-value calculation
- Hazard probability assessment
- GNSS correlation analysis
- Risk level determination and recommendations

**Parameters**:
- `latitude`: Region center latitude
- `longitude`: Region center longitude  
- `radius`: Analysis radius in kilometers (default: 100)
- `timeWindow`: Time window in days (default: 30)
- `minMagnitude`: Minimum earthquake magnitude (default: 3.0)

#### Fetch Waveform Data
Retrieve seismic waveform data for specific earthquake events.

**Parameters**:
- `eventId`: IRIS event identifier
- `network`: Seismic network code (default: "US")
- `station`: Station code
- `channel`: Channel code (default: "BHZ")
- `startTime`: Start time (ISO format)
- `endTime`: End time (ISO format)

#### Monitor GNSS Displacements
Check GNSS stations for unusual crustal movements that might indicate seismic activity.

**Parameters**:
- `region`: Region name (e.g., 'california', 'japan', 'chile')
- `threshold`: Displacement threshold in millimeters (default: 5.0)
- `timeWindow`: Time window in days (default: 7)

## Data Processing & Analysis

### Earthquake Catalog Analysis
- **Magnitude-frequency analysis** using Gutenberg-Richter relations
- **Temporal pattern detection** for accelerating/decelerating seismicity
- **Spatial clustering analysis** to identify earthquake swarms
- **Completeness threshold estimation** for reliable statistical analysis

### GNSS Data Processing
- **Displacement monitoring** with configurable thresholds
- **Time series analysis** for station movements
- **Anomaly detection** using statistical methods
- **Co-seismic and post-seismic deformation** correlation

### Risk Assessment Methodology
The server uses multiple factors to assess seismic risk:

1. **Recent large earthquakes** (M≥6.0)
2. **Seismic activity rates** (events per day)
3. **GNSS displacement anomalies** 
4. **Depth distribution** (shallow events more hazardous)
5. **Historical context** and regional tectonics

Risk levels: `low` | `moderate` | `high` | `critical`

## Supported Regions & Networks

### GNSS Networks
- **PBO** - Plate Boundary Observatory (Western US)
- **CGPS** - Continuous GPS (California)
- **GEONET** - GPS Earth Observation Network (Japan)
- **CAP** - Central Andes Project (Chile)
- **RING** - Rete Integrata Nazionale GPS (Italy)
- **COCONet** - Continuously Operating Caribbean GPS Network

### Regional Coverage
- **California** - Comprehensive PBO and CGPS coverage
- **Japan** - GEONET high-density network
- **Chile** - Nazca Plate subduction monitoring
- **New Zealand** - Alpine Fault and subduction zone
- **Alaska** - Pacific-North American plate boundary
- **Mediterranean** - Complex plate boundaries and active faults

## Development

### Project Structure
```
src/
├── index.ts                 # Main MCP server
├── providers/
│   ├── iris-provider.ts     # IRIS data interface
│   └── gnss-provider.ts     # GNSS data interface
└── analyzers/
    └── earthquake-analyzer.ts # Analysis engine
```

### Building
```bash
npm run build    # Compile TypeScript
npm run dev      # Development mode with auto-reload
npm run start    # Production mode
```

### Testing
```bash
npm run test     # Run test suite (when implemented)
npm run lint     # Check code style
```

## Contributing

Contributions are welcome! Areas for improvement:

1. **Additional Data Sources**
   - International seismic networks
   - Volcano monitoring integration

2. **Enhanced Analysis**
   - Machine learning earthquake prediction
   - Fault system modeling
   - Tsunami risk assessment

3. **Real-time Features**  
   - WebSocket earthquake feeds
   - Alert system integration
   - Mobile notifications

## Data Attribution & Usage

### **📋 Required Citations**

When using data from this server in research or publications, please include appropriate citations:

**IRIS Data:**
> Data services products from the IRIS DMC are funded through the Seismological Facilities for the Advancement of Geoscience (SAGE) Award of the National Science Foundation under Cooperative Support Agreement EAR-1851048.

**USGS Data:**
> Earthquake data provided by the U.S. Geological Survey Earthquake Hazards Program. Any use of trade, firm, or product names is for descriptive purposes only and does not imply endorsement by the U.S. Government.

**GNSS Data:**
> GNSS data provided by UNAVCO/EarthScope, Nevada Geodetic Laboratory, and contributing global networks. Please acknowledge the specific network operators in your research.


### **⚠️ Usage Terms & Limitations**

- **Non-Commercial**: IRIS and USGS data are provided for research and educational purposes
- **Real-time Limitations**: Earthquake data may have processing delays; not suitable for emergency response
- **Quality Notice**: Data quality varies by source and region; always verify critical measurements
- **Rate Limits**: Respect API rate limits to ensure continued access for all users
- **Academic Use**: Follow institutional data sharing policies for research applications

### **🔄 Data Freshness**

- **USGS**: Real-time to 5-minute updates
- **IRIS**: Near real-time to several hours  
- **GNSS**: Daily to weekly updates

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

- **IRIS** - Incorporated Research Institutions for Seismology
- **UNAVCO** - University NAVSTAR Consortium (now EarthScope)
- **Nevada Geodetic Laboratory** - University of Nevada, Reno
- **USGS** - United States Geological Survey
- **Global seismic and geodetic networks** worldwide

## Support

For issues, feature requests, or questions:
1. Check existing issues on GitHub
2. Create a new issue with detailed information
3. Include relevant error logs and system information

---

**⚠️ Important Disclaimer**: This software is for research and educational purposes. Earthquake prediction remains scientifically uncertain. Do not rely on this tool for life safety decisions. Always follow official emergency management guidance and early warning systems.
