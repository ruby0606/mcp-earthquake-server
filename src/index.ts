#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { IrisDataProvider } from "./providers/iris-provider.js";
import { GnssDataProvider, DisplacementMeasurement } from "./providers/gnss-provider.js";
import { USGSDataProvider } from "./providers/usgs-provider.js";
import { EarthquakeAnalyzer } from "./analyzers/earthquake-analyzer.js";
import {
  SYSTEM_CONFIG,
  MAGNITUDE_THRESHOLDS,
  ANALYSIS_DEFAULTS,
  GNSS_THRESHOLDS,
  VALIDATION,
  GEOGRAPHIC_LIMITS
} from "./config/scientific-constants.js";

/**
 * MCP Server for IRIS Seismological, GNSS, and USGS Earthquake Data
 * 
 * DATA ATTRIBUTION NOTICE:
 * - IRIS data: Funded by NSF/SAGE (EAR-1851048)
 * - USGS data: U.S. Geological Survey Earthquake Hazards Program  
 * - GNSS data: UNAVCO/EarthScope and global network providers
 * 
 * USAGE: Research and educational purposes only. Not for emergency response.
 * See README.md for complete attribution requirements and usage terms.
 * 
 * This server provides access to:
 * - IRIS earthquake catalog and waveform data
 * - GNSS/GPS station displacement measurements
 * - Real-time seismic monitoring
 * - Earthquake analysis and predictions
 */

const server = new McpServer({
  name: "earthquake-data-server",
  version: SYSTEM_CONFIG.VERSION
});

const irisProvider = new IrisDataProvider();
const gnssProvider = new GnssDataProvider();
const usgsProvider = new USGSDataProvider();
const analyzer = new EarthquakeAnalyzer();

// === RESOURCES ===

// IRIS Earthquake Catalog
server.registerResource(
  "iris-catalog",
  "iris://catalog/{region}?starttime={start}&endtime={end}&minmag={minmag}",
  {
    title: "IRIS Earthquake Catalog",
    description: "Access earthquake events from IRIS (Incorporated Research Institutions for Seismology)",
    mimeType: "application/json"
  },
  async (uri) => {
    const url = new URL(uri.href);
    const params = new URLSearchParams(url.search);
    const region = url.pathname.split('/')[2];
    const start = params.get('starttime') || new Date(Date.now() - ANALYSIS_DEFAULTS.STANDARD_TIME_WINDOW * 24 * 60 * 60 * 1000).toISOString();
    const end = params.get('endtime') || new Date().toISOString();
    const minmag = params.get('minmag') || MAGNITUDE_THRESHOLDS.MODERATE_IMPACT.toString();
    
    const earthquakes = await irisProvider.getEarthquakeCatalog({
      region,
      startTime: start,
      endTime: end,
      minMagnitude: parseFloat(minmag)
    });
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(earthquakes, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// GNSS Station Data
server.registerResource(
  "gnss-stations",
  "gnss://stations/{network}?region={region}",
  {
    title: "GNSS Station Network",
    description: "GPS/GNSS station information and current status",
    mimeType: "application/json"
  },
  async (uri) => {
    const url = new URL(uri.href);
    const params = new URLSearchParams(url.search);
    const network = url.pathname.split('/')[2];
    const region = params.get('region');
    
    const stations = await gnssProvider.getStations(network, region || undefined);
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(stations, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// Real-time Earthquake Feed
server.registerResource(
  "realtime-earthquakes",
  "realtime://earthquakes?magnitude={mag}&hours={hours}",
  {
    title: "Real-time Earthquake Feed",
    description: "Latest earthquake activity from multiple networks",
    mimeType: "application/json"
  },
  async (uri) => {
    const url = new URL(uri.href);
    const params = new URLSearchParams(url.search);
    const mag = params.get('magnitude') || MAGNITUDE_THRESHOLDS.LOCAL_SIGNIFICANCE.toString();
    const hours = params.get('hours') || "24";
    
    const recentQuakes = await irisProvider.getRealtimeEarthquakes({
      minMagnitude: parseFloat(mag),
      timeWindow: parseInt(hours)
    });
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(recentQuakes, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);


// USGS Real-time Earthquakes Resource
server.registerResource(
  "usgs-realtime",
  "usgs://earthquakes/{timeframe}?magnitude={magnitude}",
  {
    title: "USGS Real-time Earthquakes",
    description: "Real-time earthquake data from USGS feeds",
    mimeType: "application/json"
  },
  async (uri) => {
    const url = new URL(uri.href);
    const params = new URLSearchParams(url.search);
    const timeframe = url.pathname.split('/')[2] as 'hour' | 'day' | 'week' | 'month';
    const magnitude = (params.get('magnitude') || 'all') as 'significant' | 'all' | '4.5' | '2.5' | '1.0';
    
    const earthquakes = await usgsProvider.getEarthquakes(magnitude, timeframe);
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(earthquakes, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// USGS ShakeMap Resource
server.registerResource(
  "usgs-shakemap",
  "usgs://shakemap/{eventid}",
  {
    title: "USGS ShakeMap Data",
    description: "ShakeMap intensity and ground motion data for specific earthquakes",
    mimeType: "application/json"
  },
  async (uri) => {
    const eventId = uri.href.split('/').pop() || '';
    const shakeMapData = await usgsProvider.getShakeMap(eventId);
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(shakeMapData, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// === TOOLS ===

// Analyze Seismic Activity
server.registerTool(
  "analyze-seismic-activity",
  {
    title: "Analyze Seismic Activity",
    description: "Analyze earthquake patterns and assess seismic risk for a region",
    inputSchema: {
      latitude: z.number().min(GEOGRAPHIC_LIMITS.LATITUDE_MIN).max(GEOGRAPHIC_LIMITS.LATITUDE_MAX).describe("Latitude of the region center"),
      longitude: z.number().min(GEOGRAPHIC_LIMITS.LONGITUDE_MIN).max(GEOGRAPHIC_LIMITS.LONGITUDE_MAX).describe("Longitude of the region center"),
      radius: z.number().min(ANALYSIS_DEFAULTS.MIN_ANALYSIS_RADIUS).max(ANALYSIS_DEFAULTS.MAX_ANALYSIS_RADIUS).default(ANALYSIS_DEFAULTS.STANDARD_RADIUS).describe("Analysis radius in kilometers"),
      timeWindow: z.number().min(VALIDATION.MIN_TIME_WINDOW_DAYS).max(VALIDATION.MAX_TIME_WINDOW_DAYS).default(ANALYSIS_DEFAULTS.STANDARD_TIME_WINDOW).describe("Time window in days"),
      minMagnitude: z.number().min(VALIDATION.MIN_ANALYSIS_MAGNITUDE).max(VALIDATION.MAX_THEORETICAL_MAGNITUDE).default(MAGNITUDE_THRESHOLDS.REGIONAL_ANALYSIS).describe("Minimum earthquake magnitude")
    }
  },
  async ({ latitude, longitude, radius, timeWindow, minMagnitude }) => {
    try {
      const analysis = await analyzer.analyzeRegion({
        center: { lat: latitude, lon: longitude },
        radius,
        timeWindow,
        minMagnitude
      });

      return {
        content: [{
          type: "text",
          text: `## Seismic Activity Analysis

**Region:** ${latitude.toFixed(3)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(3)}°${longitude >= 0 ? 'E' : 'W'} (${radius}km radius)
**Time Period:** Last ${timeWindow} days
**Minimum Magnitude:** M${minMagnitude}+

### Summary
- **Total Events:** ${analysis.totalEvents}
- **Average Magnitude:** M${analysis.averageMagnitude.toFixed(2)}
- **Largest Event:** M${analysis.largestMagnitude}
- **Risk Level:** ${analysis.riskLevel}

### Pattern Analysis
- **Depth Distribution:** ${analysis.depthStats}
- **Temporal Pattern:** ${analysis.temporalPattern}
- **Spatial Clustering:** ${analysis.spatialClustering}

### Recommendations
${analysis.recommendations.join('\n- ')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing seismic activity: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Fetch Waveform Data
server.registerTool(
  "fetch-waveform",
  {
    title: "Fetch Seismic Waveform",
    description: "Retrieve seismic waveform data from IRIS for a specific event",
    inputSchema: {
      eventId: z.string().describe("IRIS event ID"),
      network: z.string().default("US").describe("Seismic network code"),
      station: z.string().describe("Station code"),
      channel: z.string().default("BHZ").describe("Channel code (e.g., BHZ, BHN, BHE)"),
      startTime: z.string().describe("Start time (ISO format)"),
      endTime: z.string().describe("End time (ISO format)")
    }
  },
  async ({ eventId, network, station, channel, startTime, endTime }) => {
    try {
      const waveform = await irisProvider.getWaveformData({
        eventId,
        network,
        station,
        channel,
        startTime,
        endTime
      });

      return {
        content: [
          {
            type: "text",
            text: `## Waveform Data Retrieved

**Event ID:** ${eventId}
**Station:** ${network}.${station}.${channel}
**Time Range:** ${startTime} to ${endTime}
**Samples:** ${waveform.samples.length} data points
**Sample Rate:** ${waveform.sampleRate} Hz
**Duration:** ${waveform.duration.toFixed(1)}s

### Waveform Analysis
- **Peak Amplitude:** ${waveform.peakAmplitude.toFixed(6)} counts
- **RMS Amplitude:** ${waveform.rmsAmplitude.toFixed(6)} counts
- **Signal Quality:** ${waveform.quality.toUpperCase()}
- **Data Format:** MinISEED (${(waveform.samples.length * 4 / 1024).toFixed(1)} KB)

### Sample Data Preview
\`\`\`
First 10 samples: [${waveform.samples.slice(0, 10).map(s => s.toFixed(3)).join(', ')}${waveform.samples.length > 10 ? ', ...' : ''}]
Last 10 samples:  [${waveform.samples.slice(-10).map(s => s.toFixed(3)).join(', ')}]
\`\`\`

**Status:** ✅ Waveform data successfully retrieved from IRIS FDSNWS dataselect service`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error fetching waveform data: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Monitor GNSS Displacements
server.registerTool(
  "monitor-gnss-displacement",
  {
    title: "Monitor GNSS Displacements",
    description: "Check GNSS stations for unusual crustal movements that might indicate seismic activity",
    inputSchema: {
      region: z.string().describe("Region name (e.g., 'california', 'japan', 'chile')"),
      threshold: z.number().min(VALIDATION.MIN_DISPLACEMENT_THRESHOLD).max(VALIDATION.MAX_DISPLACEMENT_THRESHOLD).default(GNSS_THRESHOLDS.SIGNIFICANT_DISPLACEMENT).describe("Displacement threshold in millimeters"),
      timeWindow: z.number().min(VALIDATION.MIN_TIME_WINDOW_DAYS).max(VALIDATION.MAX_TIME_WINDOW_DAYS).default(ANALYSIS_DEFAULTS.SHORT_TERM_WINDOW).describe("Time window in days")
    }
  },
  async ({ region, threshold, timeWindow }) => {
    try {
      const displacements = await gnssProvider.monitorDisplacements({
        region,
        threshold,
        timeWindow
      });

      const alerts = displacements.filter((d: DisplacementMeasurement) => d.displacement > threshold);

      return {
        content: [{
          type: "text",
          text: `## GNSS Displacement Monitoring

**Region:** ${region}
**Threshold:** ${threshold}mm
**Time Window:** ${timeWindow} days
**Stations Monitored:** ${displacements.length}
**Alerts:** ${alerts.length}

### Displacement Summary
${displacements.slice(0, 10).map((d: DisplacementMeasurement) => 
  `- **${d.stationId}:** ${d.displacement.toFixed(2)}mm ${d.displacement > threshold ? '⚠️' : '✅'} (${d.direction})`
).join('\n')}

${alerts.length > 0 ? `
### ⚠️ High Displacement Alerts
${alerts.map((a: DisplacementMeasurement) => 
  `- **${a.stationId}:** ${a.displacement.toFixed(2)}mm displacement ${a.direction}
    Location: ${a.latitude.toFixed(4)}°${a.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(a.longitude).toFixed(4)}°${a.longitude >= 0 ? 'E' : 'W'}
    Last Update: ${a.timestamp}`
).join('\n\n')}
` : '### ✅ No significant displacements detected'}

### Analysis
- **Average Displacement:** ${(displacements.reduce((sum: number, d: DisplacementMeasurement) => sum + d.displacement, 0) / displacements.length).toFixed(2)}mm
- **Max Displacement:** ${Math.max(...displacements.map((d: DisplacementMeasurement) => d.displacement)).toFixed(2)}mm
- **Trending Direction:** ${displacements[0]?.trending || 'Stable'}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error monitoring GNSS displacements: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Get Recent USGS Earthquakes
server.registerTool(
  "get-usgs-earthquakes",
  {
    title: "Get Recent USGS Earthquakes",
    description: "Retrieve recent earthquakes from USGS real-time feeds with various filters",
    inputSchema: {
      timeframe: z.enum(["hour", "day", "week", "month"]).default("day").describe("Time period for earthquake data"),
      magnitude: z.enum(["significant", "all", "4.5", "2.5", "1.0"]).default("all").describe("Minimum magnitude filter")
    }
  },
  async ({ timeframe, magnitude }) => {
    try {
      const earthquakes = await usgsProvider.getEarthquakes(timeframe, magnitude);
      const significantEvents = earthquakes.features.filter(eq => eq.properties.mag >= MAGNITUDE_THRESHOLDS.SIGNIFICANT);
      const recentEvents = earthquakes.features.slice(0, 10);

      return {
        content: [{
          type: "text",
          text: `## USGS Recent Earthquakes

**Time Period:** Past ${timeframe}
**Magnitude Filter:** ${magnitude}
**Total Events:** ${earthquakes.features.length}
**Significant Events (M≥5.0):** ${significantEvents.length}

### Recent Significant Events
${recentEvents.map(eq => {
  const date = new Date(eq.properties.time).toISOString().split('T')[0];
  const coords = `${eq.geometry.coordinates[1].toFixed(3)}°N, ${Math.abs(eq.geometry.coordinates[0]).toFixed(3)}°${eq.geometry.coordinates[0] < 0 ? 'W' : 'E'}`;
  const depth = `${eq.geometry.coordinates[2].toFixed(1)}km`;
  const alert = eq.properties.alert ? ` (${eq.properties.alert.toUpperCase()} alert)` : '';
  const felt = eq.properties.felt ? ` - ${eq.properties.felt} reports` : '';
  
  return `- **M${eq.properties.mag}** ${eq.properties.place}
    - **Date:** ${date} | **Depth:** ${depth} | **Coords:** ${coords}${alert}${felt}
    - **Status:** ${eq.properties.status} | **Network:** ${eq.properties.net.toUpperCase()}${eq.properties.tsunami ? ' | 🌊 Tsunami' : ''}`;
}).join('\n\n')}

### Summary Statistics
- **Largest Event:** M${Math.max(...earthquakes.features.map(eq => eq.properties.mag)).toFixed(1)}
- **Average Magnitude:** M${(earthquakes.features.reduce((sum, eq) => sum + eq.properties.mag, 0) / earthquakes.features.length).toFixed(1)}
- **Shallowest Event:** ${Math.min(...earthquakes.features.map(eq => eq.geometry.coordinates[2])).toFixed(1)}km depth
- **Most Felt Event:** ${Math.max(...earthquakes.features.map(eq => eq.properties.felt || 0))} reports

${significantEvents.length > 0 ? `
### ⚠️ Notable Activity
${significantEvents.length} significant earthquakes (M≥5.0) detected in the past ${timeframe}.
${significantEvents.some(eq => eq.properties.alert === 'red' || eq.properties.alert === 'orange') ? 
  '🚨 High-impact events detected - review ShakeMap data for affected areas.' : 
  '📊 Monitor for potential aftershock sequences and regional patterns.'}
` : '✅ No significant earthquake activity in the specified timeframe.'}

**Data Source:** USGS Earthquake Hazards Program
**Last Updated:** ${new Date(earthquakes.metadata.generated).toLocaleString()}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving USGS earthquake data: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Search USGS Earthquakes
server.registerTool(
  "search-usgs-earthquakes",
  {
    title: "Search USGS Earthquake Database",
    description: "Search USGS earthquake database with custom parameters",
    inputSchema: {
      startTime: z.string().optional().describe("Start time (YYYY-MM-DD)"),
      endTime: z.string().optional().describe("End time (YYYY-MM-DD)"),
      minLatitude: z.number().min(GEOGRAPHIC_LIMITS.LATITUDE_MIN).max(GEOGRAPHIC_LIMITS.LATITUDE_MAX).optional().describe("Minimum latitude"),
      maxLatitude: z.number().min(GEOGRAPHIC_LIMITS.LATITUDE_MIN).max(GEOGRAPHIC_LIMITS.LATITUDE_MAX).optional().describe("Maximum latitude"),
      minLongitude: z.number().min(GEOGRAPHIC_LIMITS.LONGITUDE_MIN).max(GEOGRAPHIC_LIMITS.LONGITUDE_MAX).optional().describe("Minimum longitude"),
      maxLongitude: z.number().min(GEOGRAPHIC_LIMITS.LONGITUDE_MIN).max(GEOGRAPHIC_LIMITS.LONGITUDE_MAX).optional().describe("Maximum longitude"),
      latitude: z.number().min(GEOGRAPHIC_LIMITS.LATITUDE_MIN).max(GEOGRAPHIC_LIMITS.LATITUDE_MAX).optional().describe("Center latitude for radius search"),
      longitude: z.number().min(GEOGRAPHIC_LIMITS.LONGITUDE_MIN).max(GEOGRAPHIC_LIMITS.LONGITUDE_MAX).optional().describe("Center longitude for radius search"),
      maxRadiusKm: z.number().min(ANALYSIS_DEFAULTS.MIN_ANALYSIS_RADIUS).max(ANALYSIS_DEFAULTS.MAX_ANALYSIS_RADIUS).optional().describe("Maximum radius in kilometers"),
      minMagnitude: z.number().min(MAGNITUDE_THRESHOLDS.MINIMUM_DETECTABLE).max(MAGNITUDE_THRESHOLDS.THEORETICAL_MAX).optional().describe("Minimum magnitude"),
      maxMagnitude: z.number().min(MAGNITUDE_THRESHOLDS.MINIMUM_DETECTABLE).max(MAGNITUDE_THRESHOLDS.THEORETICAL_MAX).optional().describe("Maximum magnitude"),
      limit: z.number().min(1).max(ANALYSIS_DEFAULTS.MAX_SEARCH_RESULTS).default(ANALYSIS_DEFAULTS.STANDARD_RESULT_LIMIT).describe("Maximum number of results")
    }
  },
  async (params) => {
    try {
      const searchResults = await usgsProvider.searchEarthquakes(params);
      const totalEvents = searchResults.features.length;
      const avgMagnitude = totalEvents > 0 ? searchResults.features.reduce((sum, eq) => sum + eq.properties.mag, 0) / totalEvents : 0;

      return {
        content: [{
          type: "text",
          text: `## USGS Earthquake Search Results

**Search Parameters:**
${params.startTime ? `- **Start Time:** ${params.startTime}` : ''}
${params.endTime ? `- **End Time:** ${params.endTime}` : ''}
${params.minMagnitude ? `- **Min Magnitude:** M${params.minMagnitude}` : ''}
${params.maxMagnitude ? `- **Max Magnitude:** M${params.maxMagnitude}` : ''}
${params.latitude && params.longitude ? `- **Center:** ${params.latitude.toFixed(3)}°N, ${Math.abs(params.longitude).toFixed(3)}°${params.longitude < 0 ? 'W' : 'E'}` : ''}
${params.maxRadiusKm ? `- **Radius:** ${params.maxRadiusKm}km` : ''}

**Results:** ${totalEvents} earthquakes found

### Top Results by Magnitude
${searchResults.features.slice(0, 15).sort((a, b) => b.properties.mag - a.properties.mag).map((eq, index) => {
  const date = new Date(eq.properties.time).toISOString().split('T')[0];
  const coords = `${eq.geometry.coordinates[1].toFixed(3)}°N, ${Math.abs(eq.geometry.coordinates[0]).toFixed(3)}°${eq.geometry.coordinates[0] < 0 ? 'W' : 'E'}`;
  
  return `${index + 1}. **M${eq.properties.mag}** - ${eq.properties.place}
   **Date:** ${date} | **Depth:** ${eq.geometry.coordinates[2].toFixed(1)}km | **Coords:** ${coords}`;
}).join('\n\n')}

### Search Summary
- **Total Events:** ${totalEvents}
- **Average Magnitude:** M${avgMagnitude.toFixed(1)}
- **Magnitude Range:** M${Math.min(...searchResults.features.map(eq => eq.properties.mag)).toFixed(1)} - M${Math.max(...searchResults.features.map(eq => eq.properties.mag)).toFixed(1)}
- **Depth Range:** ${Math.min(...searchResults.features.map(eq => eq.geometry.coordinates[2])).toFixed(1)}km - ${Math.max(...searchResults.features.map(eq => eq.geometry.coordinates[2])).toFixed(1)}km

${totalEvents >= params.limit ? `\n⚠️ Results limited to ${params.limit} events. Use more specific search criteria for complete results.` : ''}

**Data Source:** USGS Earthquake Hazards Program`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching USGS earthquakes: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Get USGS ShakeMap
server.registerTool(
  "get-usgs-shakemap",
  {
    title: "Get USGS ShakeMap Data",
    description: "Retrieve ShakeMap intensity and ground motion data for a specific earthquake",
    inputSchema: {
      eventId: z.string().describe("USGS event ID (e.g., 'us6000jllz')")
    }
  },
  async ({ eventId }) => {
    try {
      const shakeMap = await usgsProvider.getShakeMap(eventId);
      const maxStation = shakeMap.stationData?.reduce((max, station) => 
        station.intensity > (max?.intensity || 0) ? station : max
      );

      return {
        content: [{
          type: "text",
          text: `## USGS ShakeMap Data

**Event ID:** ${shakeMap.eventId}
**Event:** M${shakeMap.magnitude} ${shakeMap.location}
**Time:** ${new Date(shakeMap.eventTime).toLocaleString()}
**Coordinates:** ${shakeMap.latitude.toFixed(4)}°N, ${Math.abs(shakeMap.longitude).toFixed(4)}°${shakeMap.longitude < 0 ? 'W' : 'E'}
**Depth:** ${shakeMap.depth.toFixed(1)}km

### Intensity Information
- **Maximum Intensity:** ${shakeMap.maxIntensity} (Modified Mercalli)
- **ShakeMap Version:** ${shakeMap.version}
- **Stations Reporting:** ${shakeMap.stationData?.length || 0}

${maxStation ? `
### Highest Intensity Station
- **Station:** ${maxStation.name} (${maxStation.stationId})
- **Location:** ${maxStation.latitude.toFixed(4)}°N, ${Math.abs(maxStation.longitude).toFixed(4)}°${maxStation.longitude < 0 ? 'W' : 'E'}
- **Intensity:** ${maxStation.intensity} MMI
- **Peak Ground Acceleration:** ${maxStation.peakGroundAcceleration}g
- **Peak Ground Velocity:** ${maxStation.peakGroundVelocity} cm/s
` : ''}

### Intensity Contours
${shakeMap.contourData?.map(contour => 
  `- **Intensity ${contour.intensity}:** ${contour.coordinates.length} boundary points`
).join('\n') || 'No contour data available'}

### Ground Motion Summary
${shakeMap.stationData ? `
**Station Statistics:**
- **Average Intensity:** ${(shakeMap.stationData.reduce((sum, s) => sum + s.intensity, 0) / shakeMap.stationData.length).toFixed(1)} MMI
- **Max PGA:** ${Math.max(...shakeMap.stationData.map(s => s.peakGroundAcceleration)).toFixed(2)}g
- **Max PGV:** ${Math.max(...shakeMap.stationData.map(s => s.peakGroundVelocity)).toFixed(1)} cm/s
` : 'No station data available'}

### Impact Assessment
${shakeMap.maxIntensity >= 8 ? '🚨 Severe shaking - widespread damage expected' :
  shakeMap.maxIntensity >= 6 ? '⚠️ Strong to very strong shaking - moderate damage possible' :
  shakeMap.maxIntensity >= 4 ? '📊 Light to moderate shaking - minor damage in vulnerable structures' :
  '✅ Weak to light shaking - little to no damage expected'}

**ShakeMap URL:** ${shakeMap.shakemapUrl}
**Data Source:** USGS Earthquake Hazards Program`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving ShakeMap data: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Get Seismic Hazard
server.registerTool(
  "get-seismic-hazard",
  {
    title: "Get USGS Seismic Hazard Assessment",
    description: "Retrieve probabilistic seismic hazard assessment for a location",
    inputSchema: {
      latitude: z.number().min(GEOGRAPHIC_LIMITS.LATITUDE_MIN).max(GEOGRAPHIC_LIMITS.LATITUDE_MAX).describe("Latitude of the location"),
      longitude: z.number().min(GEOGRAPHIC_LIMITS.LONGITUDE_MIN).max(GEOGRAPHIC_LIMITS.LONGITUDE_MAX).describe("Longitude of the location")
    }
  },
  async ({ latitude, longitude }) => {
    try {
      await usgsProvider.getSeismicHazard(latitude, longitude);
      // This should never be reached due to the error thrown
      return {
        content: [{
          type: "text",
          text: "Unexpected error in seismic hazard assessment"
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `## Seismic Hazard Assessment

**Location:** ${latitude.toFixed(4)}°N, ${Math.abs(longitude).toFixed(4)}°${longitude < 0 ? 'W' : 'E'}

**Status:** Feature Not Available

${(error as Error).message}

### Alternative Resources:
- USGS Earthquake Hazards Program: https://earthquake.usgs.gov/hazards/
- USGS Design Maps: https://earthquake.usgs.gov/hazards/designmaps/
- ShakeMaps available via get-usgs-shakemap tool`
        }]
      };
    }
  }
);

// === PROMPTS ===

// Earthquake Risk Assessment Prompt
server.registerPrompt(
  "earthquake-risk-assessment",
  {
    title: "Earthquake Risk Assessment",
    description: "Generate a comprehensive earthquake risk assessment for a specific location",
    argsSchema: {
      location: z.string().describe("Location name or coordinates"),
      timeframe: z.string().optional().describe("Assessment timeframe (default: 30 days)"),
      populationDensity: z.enum(["low", "medium", "high"]).describe("Population density of the area")
    }
  },
  ({ location, timeframe, populationDensity }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please provide a comprehensive earthquake risk assessment for ${location} over the next ${timeframe || "30 days"}. 

Consider the following factors:
1. Recent seismic activity patterns
2. Historical earthquake data
3. Geological fault systems
4. GNSS crustal movement data
5. Population density: ${populationDensity}
6. Infrastructure vulnerability
7. Emergency preparedness recommendations

Please analyze available IRIS seismological data and GNSS measurements to provide:
- Current risk level (low/moderate/high/critical)
- Probability estimates for different magnitude ranges
- Specific hazards and vulnerabilities
- Recommended preparedness actions
- Monitoring recommendations

Format the response as a detailed risk assessment report.`
      }
    }]
  })
);

// Seismic Data Interpretation Prompt
server.registerPrompt(
  "interpret-seismic-data",
  {
    title: "Interpret Seismic Data",
    description: "Help interpret complex seismic waveform and catalog data",
    argsSchema: {
      dataType: z.enum(["waveform", "catalog", "gnss", "combined"]).describe("Type of seismic data to interpret"),
      analysisGoal: z.string().describe("What you want to understand from the data")
    }
  },
  ({ dataType, analysisGoal }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please help me interpret ${dataType} seismic data with the goal of understanding: ${analysisGoal}

Please explain:
1. Key parameters and what they mean
2. How to identify significant patterns or anomalies
3. Relationship to earthquake processes
4. Implications for seismic hazard assessment
5. Limitations and uncertainties in the data

Use technical terminology but provide clear explanations suitable for earthquake monitoring and research purposes.`
      }
    }]
  })
);

async function main() {
  const transport = new StdioServerTransport();
  
  console.error("🌍 Starting Comprehensive Earthquake Monitoring MCP Server...");
  console.error("📡 Connecting to IRIS, UNAVCO, USGS, and satellite data providers...");
  
  await server.connect(transport);
  console.error("✅ Multi-source Earthquake Data Server is running!");
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error("🛑 Shutting down MCP server...");
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error("🛑 Shutting down MCP server...");
  process.exit(0);
});

main().catch((error) => {
  console.error("❌ Server error:", error);
  process.exit(1);
});
