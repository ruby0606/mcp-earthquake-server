# Example Usage of the Earthquake Data MCP Server

This document provides practical examples of how to use the MCP server for earthquake monitoring and analysis.

## 🚀 Quick Start Examples

### 1. Real-time Earthquake Monitoring

**Query recent earthquakes in California:**
```
Resource: realtime://earthquakes?magnitude=3.0&hours=24
```

**Sample Response:**
```json
[
  {
    "eventId": "us7000kxyz",
    "time": "2024-08-15T14:30:22Z",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "depth": 8.2,
    "magnitude": 4.1,
    "magnitudeType": "ml",
    "location": "5 km NNE of Los Angeles, CA",
    "source": "ci",
    "status": "reviewed"
  }
]
```

### 2. Seismic Risk Analysis

**Analyze earthquake risk for Tokyo:**
```javascript
Tool: analyze-seismic-activity
Parameters: {
  "latitude": 35.6762,
  "longitude": 139.6503,
  "radius": 150,
  "timeWindow": 60,
  "minMagnitude": 4.0
}
```

**Sample Analysis Output:**
```
## Seismic Activity Analysis

**Region:** 35.676°N, 139.650°W (150km radius)
**Time Period:** Last 60 days
**Minimum Magnitude:** M4.0+

### Summary
- **Total Events:** 23
- **Average Magnitude:** M4.7
- **Largest Event:** M6.2
- **Risk Level:** moderate

### Pattern Analysis
- **Depth Distribution:** Average: 45.2km | Shallow (≤35km): 8 | Intermediate (35-300km): 15 | Deep (>300km): 0
- **Temporal Pattern:** Steady activity pattern
- **Spatial Clustering:** Moderately clustered (65% within 25km)

### Recommendations
- Continue routine monitoring and data collection
- Maintain preparedness for earthquake emergencies
```

### 3. GNSS Displacement Monitoring

**Monitor crustal movements in Japan:**
```javascript
Tool: monitor-gnss-displacement
Parameters: {
  "region": "japan",
  "threshold": 3.0,
  "timeWindow": 14
}
```

**Sample GNSS Output:**
```
## GNSS Displacement Monitoring

**Region:** japan
**Threshold:** 3.0mm
**Time Window:** 14 days
**Stations Monitored:** 12
**Alerts:** 2

### Displacement Summary
- **GEONET01:** 2.3mm ✅ (east)
- **GEONET02:** 8.1mm ⚠️ (north)
- **GEONET03:** 1.7mm ✅ (up)
- **GEONET04:** 4.2mm ⚠️ (horizontal)

### ⚠️ High Displacement Alerts
- **GEONET02:** 8.1mm displacement north
  Location: 36.0829°N, 140.0769°W
  Last Update: 2024-08-15T12:00:00Z

- **GEONET04:** 4.2mm displacement horizontal
  Location: 35.1815°N, 138.9094°W
  Last Update: 2024-08-15T11:30:00Z
```

### 4. Historical Earthquake Catalog

**Get California earthquakes from the past month:**
```
Resource: iris://catalog/california?starttime=2024-07-15T00:00:00Z&endtime=2024-08-15T23:59:59Z&minmag=4.5
```

### 5. Risk Assessment Prompt

**Generate comprehensive risk assessment:**
```javascript
Prompt: earthquake-risk-assessment
Parameters: {
  "location": "San Francisco Bay Area",
  "timeframe": "next 6 months",
  "populationDensity": "high"
}
```

## 🔧 Integration Examples

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "earthquake-monitoring": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Code\\MCP\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### VS Code Integration

The server automatically works in VS Code with the included `.vscode/settings.json`:
```json
{
  "mcpServers": {
    "earthquake-data": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 💡 Use Cases

### 1. Research & Academic Applications
- **Seismology Studies**: Access to comprehensive IRIS earthquake catalogs
- **Geodesy Research**: GNSS displacement analysis for crustal deformation studies
- **Risk Assessment**: Statistical analysis of earthquake patterns for hazard evaluation

### 2. Emergency Management
- **Real-time Monitoring**: Track current seismic activity and anomalies
- **Risk Communication**: Generate public-friendly risk assessments
- **Planning Support**: Historical analysis for emergency preparedness

### 3. Infrastructure & Engineering
- **Site Assessment**: Evaluate seismic hazards for construction projects
- **Monitoring**: Track ground movements that might affect infrastructure
- **Validation**: Compare multiple data sources for engineering decisions

### 4. Insurance & Finance
- **Risk Modeling**: Quantitative earthquake risk assessment
- **Portfolio Analysis**: Regional seismic exposure evaluation
- **Claims Preparation**: Historical earthquake impact analysis

## 🚨 Important Usage Guidelines

### Data Interpretation
- **Statistical Analysis**: Results are based on historical patterns
- **Confidence Levels**: Always check confidence ratings in outputs  
- **Temporal Limitations**: Recent data may have processing delays
- **Regional Variations**: Completeness varies by geographic region

### Emergency Protocols
- **NOT for Emergency Response**: Use official sources (USGS, JMA, etc.)
- **Preparedness Only**: Suitable for planning, not immediate decisions
- **Scientific Context**: Earthquake prediction is scientifically uncertain

### Data Quality Considerations
- **Network Reliability**: GNSS and seismic networks have varying quality
- **Processing Delays**: Real-time data may lag by minutes to hours
- **Seasonal Effects**: GNSS measurements affected by weather patterns
- **Instrumental Limitations**: Equipment precision varies by location

## 📊 Advanced Analysis Examples

### Gutenberg-Richter Analysis
```javascript
// From seismic analysis output:
{
  "bValue": 0.95,
  "aValue": 4.2,
  "completeness": 3.1,
  "confidence": 0.87
}
```

**Interpretation:**
- b-value ≈ 1.0: Normal tectonic environment
- Completeness M3.1+: Reliable statistics above this threshold
- High confidence: Robust statistical analysis

### Temporal Pattern Recognition
```javascript
// Analysis output examples:
"temporalPattern": "Accelerating activity pattern detected"
"temporalPattern": "Steady activity pattern"  
"temporalPattern": "Decreasing activity pattern"
```

### Spatial Clustering Analysis
```javascript
// Clustering indicators:
"spatialClustering": "Highly clustered (78% within 25km)"
"spatialClustering": "Dispersed pattern (avg distance: 45.3km)"
```

## 🔄 Workflow Integration

### Daily Monitoring Routine
1. **Check Real-time Feed**: `realtime://earthquakes?magnitude=2.5&hours=24`
2. **Review GNSS Alerts**: Run displacement monitoring for regions of interest
3. **Analyze Patterns**: Use analysis tools for significant activity
4. **Generate Reports**: Create risk assessments for stakeholders

### Research Workflow
1. **Define Study Area**: Set geographic bounds and time windows
2. **Collect Catalog Data**: Gather comprehensive earthquake histories  
3. **Statistical Analysis**: Apply Gutenberg-Richter and temporal analysis
4. **GNSS Correlation**: Compare seismic and geodetic observations
5. **Risk Assessment**: Synthesize findings into hazard evaluation

### Emergency Planning Integration
1. **Historical Baseline**: Establish normal activity patterns
2. **Threshold Setting**: Define alert levels for anomalous activity
3. **Monitoring Protocol**: Regular checks of key indicators
4. **Response Triggers**: Link analysis outputs to action plans

---

**📖 For complete API documentation, see README.md**
**🔧 For technical details, check the source code in `/src`**
**⚠️ Always follow official emergency management guidance**
