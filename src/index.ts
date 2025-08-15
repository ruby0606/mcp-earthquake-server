#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { IrisDataProvider } from "./providers/iris-provider.js";
import { GnssDataProvider, DisplacementMeasurement } from "./providers/gnss-provider.js";
import { InSARDataProvider } from "./providers/insar-provider.js";
import { USGSDataProvider } from "./providers/usgs-provider.js";
import { EarthquakeAnalyzer } from "./analyzers/earthquake-analyzer.js";

/**
 * MCP Server for IRIS Seismological, GNSS, and InSAR Earthquake Data
 * 
 * DATA ATTRIBUTION NOTICE:
 * - IRIS data: Funded by NSF/SAGE (EAR-1851048)
 * - USGS data: U.S. Geological Survey Earthquake Hazards Program  
 * - GNSS data: UNAVCO/EarthScope and global network providers
 * - InSAR data: ESA Sentinel-1, JAXA ALOS-2, DLR TerraSAR-X missions
 * 
 * USAGE: Research and educational purposes only. Not for emergency response.
 * See README.md for complete attribution requirements and usage terms.
 * 
 * This server provides access to:
 * - IRIS earthquake catalog and waveform data
 * - GNSS/GPS station displacement measurements
 * - InSAR ground deformation measurements
 * - Real-time seismic monitoring
 * - Earthquake analysis and predictions
 */

const server = new McpServer({
  name: "earthquake-data-server",
  version: "1.0.0"
});

const irisProvider = new IrisDataProvider();
const gnssProvider = new GnssDataProvider();
const insarProvider = new InSARDataProvider();
const usgsProvider = new USGSDataProvider();
const analyzer = new EarthquakeAnalyzer();

// Helper function to get regional coordinates
function getRegionalCoordinates(region: string): { lat: number; lon: number } {
  const regions: Record<string, { lat: number; lon: number }> = {
    california: { lat: 37.0, lon: -120.0 },
    japan: { lat: 36.0, lon: 138.0 },
    chile: { lat: -33.0, lon: -71.0 },
    newzealand: { lat: -41.0, lon: 174.0 },
    alaska: { lat: 64.0, lon: -153.0 },
    italy: { lat: 42.0, lon: 13.0 },
    turkey: { lat: 39.0, lon: 35.0 },
    global: { lat: 0.0, lon: 0.0 }
  };
  return regions[region] || regions.global;
}

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
    const start = params.get('starttime') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = params.get('endtime') || new Date().toISOString();
    const minmag = params.get('minmag') || "4.0";
    
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
    const mag = params.get('magnitude') || "2.5";
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

// InSAR Deformation Data
server.registerResource(
  "insar-deformation",
  "insar://deformation/{region}?starttime={start}&endtime={end}&method={method}",
  {
    title: "InSAR Ground Deformation",
    description: "Satellite radar interferometry ground deformation measurements",
    mimeType: "application/json"
  },
  async (uri) => {
    const url = new URL(uri.href);
    const params = new URLSearchParams(url.search);
    const region = url.pathname.split('/')[2];
    const start = params.get('starttime') || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const end = params.get('endtime') || new Date().toISOString();
    const method = params.get('method') || "SBAS";
    
    // Get regional coordinates
    const coords = getRegionalCoordinates(region);
    
    const timeSeries = await insarProvider.getDeformationTimeSeries({
      location: { latitude: coords.lat, longitude: coords.lon },
      radius: 100,
      timeWindow: Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)),
      velocityThreshold: 5.0,
      coherenceThreshold: 0.6,
      method: method as "SBAS" | "PSI" | "StaMPS"
    });
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(timeSeries, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// InSAR Products Catalog
server.registerResource(
  "insar-products",
  "insar://products/{mission}?region={region}&starttime={start}&endtime={end}",
  {
    title: "InSAR Product Catalog",
    description: "Available satellite radar products for interferometric analysis",
    mimeType: "application/json"
  },
  async (uri) => {
    const url = new URL(uri.href);
    const params = new URLSearchParams(url.search);
    const mission = url.pathname.split('/')[2];
    const region = params.get('region');
    const start = params.get('starttime') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const end = params.get('endtime') || new Date().toISOString();
    
    let boundingBox;
    if (region) {
      const coords = getRegionalCoordinates(region);
      boundingBox = {
        north: coords.lat + 2,
        south: coords.lat - 2,
        east: coords.lon + 2,
        west: coords.lon - 2
      };
    }
    
    const products = await insarProvider.searchProducts({
      region: boundingBox,
      dateRange: { start, end },
      mission: mission !== "all" ? mission : undefined
    });
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(products, null, 2),
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
      latitude: z.number().min(-90).max(90).describe("Latitude of the region center"),
      longitude: z.number().min(-180).max(180).describe("Longitude of the region center"),
      radius: z.number().min(1).max(20000).default(100).describe("Analysis radius in kilometers"),
      timeWindow: z.number().min(1).max(3650).default(30).describe("Time window in days"),
      minMagnitude: z.number().min(0).max(10).default(3.0).describe("Minimum earthquake magnitude")
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
**Samples:** ${waveform.samples.length}
**Sample Rate:** ${waveform.sampleRate} Hz
**Duration:** ${waveform.duration}s

### Waveform Analysis
- **Peak Amplitude:** ${waveform.peakAmplitude}
- **RMS Amplitude:** ${waveform.rmsAmplitude}
- **Signal Quality:** ${waveform.quality}

*Note: Raw waveform data available via resource link below*`
          },
          {
            type: "resource_link",
            uri: `waveform://${eventId}/${network}/${station}/${channel}`,
            name: `${eventId}_${network}_${station}_${channel}.json`,
            mimeType: "application/json",
            description: "Raw waveform data in JSON format"
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
      threshold: z.number().min(0.1).max(1000).default(5.0).describe("Displacement threshold in millimeters"),
      timeWindow: z.number().min(1).max(365).default(7).describe("Time window in days")
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

// Analyze InSAR Deformation
server.registerTool(
  "analyze-insar-deformation",
  {
    title: "Analyze InSAR Ground Deformation",
    description: "Analyze satellite radar interferometry data for ground deformation patterns",
    inputSchema: {
      latitude: z.number().min(-90).max(90).describe("Latitude of the analysis center"),
      longitude: z.number().min(-180).max(180).describe("Longitude of the analysis center"),
      radius: z.number().min(1).max(5000).default(50).describe("Analysis radius in kilometers"),
      timeWindow: z.number().min(1).max(3650).default(365).describe("Time window in days"),
      method: z.enum(["SBAS", "PSI", "StaMPS"]).default("SBAS").describe("InSAR processing method"),
      velocityThreshold: z.number().min(0.1).max(1000).default(5.0).describe("Velocity threshold in mm/year")
    }
  },
  async ({ latitude, longitude, radius, timeWindow, method, velocityThreshold }) => {
    try {
      const timeSeries = await insarProvider.getDeformationTimeSeries({
        location: { latitude, longitude },
        radius,
        timeWindow,
        velocityThreshold,
        coherenceThreshold: 0.6,
        method
      });

      return {
        content: [{
          type: "text",
          text: `## InSAR Deformation Analysis

**Location:** ${latitude.toFixed(4)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}
**Analysis Period:** ${timeSeries.timeRange.start} to ${timeSeries.timeRange.end}
**Processing Method:** ${method}
**Data Points:** ${timeSeries.measurements.length}

### Deformation Summary
- **Linear Velocity:** ${timeSeries.trend.linearVelocity.toFixed(2)} mm/year
- **Acceleration:** ${timeSeries.trend.acceleration.toFixed(3)} mm/year²
- **Seasonal Amplitude:** ${timeSeries.trend.seasonalAmplitude.toFixed(2)} mm
- **Confidence:** ${(timeSeries.trend.confidence * 100).toFixed(1)}%

### Data Quality Assessment
- **Temporal Coherence:** ${(timeSeries.quality.temporalCoherence * 100).toFixed(1)}%
- **Spatial Consistency:** ${(timeSeries.quality.spatialConsistency * 100).toFixed(1)}%
- **Atmospheric Artifacts:** ${timeSeries.quality.atmosphericArtifacts}
- **Overall Quality:** ${timeSeries.quality.overallQuality}

### Recent Measurements
${timeSeries.measurements.slice(-5).map(m => 
  `- **${m.date}:** ${m.displacement.toFixed(1)}mm (vel: ${m.velocity.toFixed(1)} mm/yr, coherence: ${(m.coherence * 100).toFixed(0)}%)`
).join('\n')}

### Interpretation
${timeSeries.trend.linearVelocity > 5 ? "⚠️ Significant uplift detected - possible magmatic or tectonic activity" : 
  timeSeries.trend.linearVelocity < -5 ? "⚠️ Significant subsidence detected - possible groundwater extraction or tectonic settling" :
  "✅ Stable ground conditions with normal seasonal variations"}

${Math.abs(timeSeries.trend.acceleration) > 0.1 ? "📈 Acceleration in deformation rate detected - monitoring recommended" : ""}

### Data Reliability
Quality: **${timeSeries.quality.overallQuality.toUpperCase()}**
- Measurements with coherence > 0.7: ${Math.round(timeSeries.measurements.filter(m => m.coherence > 0.7).length / timeSeries.measurements.length * 100)}%
- Atmospheric correction applied: ${Math.round(timeSeries.measurements.filter(m => m.atmosphericCorrection).length / timeSeries.measurements.length * 100)}%`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing InSAR deformation: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Detect Rapid Deformation
server.registerTool(
  "detect-rapid-deformation",
  {
    title: "Detect Rapid Ground Deformation",
    description: "Detect anomalous ground deformation that might indicate seismic or volcanic activity",
    inputSchema: {
      north: z.number().min(-90).max(90).describe("Northern boundary latitude"),
      south: z.number().min(-90).max(90).describe("Southern boundary latitude"),
      east: z.number().min(-180).max(180).describe("Eastern boundary longitude"),
      west: z.number().min(-180).max(180).describe("Western boundary longitude"),
      velocityThreshold: z.number().min(0.1).max(1000).default(10).describe("Velocity threshold for detection in mm/year")
    }
  },
  async ({ north, south, east, west, velocityThreshold }) => {
    // Validate boundaries
    if (north <= south) {
      return {
        content: [{
          type: "text",
          text: "Error: Northern boundary must be greater than southern boundary"
        }],
        isError: true
      };
    }
    
    if (Math.abs(east - west) < 0.001) {
      return {
        content: [{
          type: "text",
          text: "Error: Eastern and western boundaries must be different"
        }],
        isError: true
      };
    }
    
    try {
      const detections = await insarProvider.detectRapidDeformation(
        { north, south, east, west },
        velocityThreshold
      );

      const criticalDetections = detections.filter(d => d.significance === "critical");
      const highDetections = detections.filter(d => d.significance === "high");

      return {
        content: [{
          type: "text",
          text: `## Rapid Deformation Detection

**Search Area:** ${north.toFixed(3)}°N to ${south.toFixed(3)}°N, ${east.toFixed(3)}°E to ${west.toFixed(3)}°E
**Velocity Threshold:** ${velocityThreshold} mm/year
**Detections:** ${detections.length} anomalous areas found

### Alert Summary
- 🚨 **Critical:** ${criticalDetections.length} locations
- ⚠️ **High:** ${highDetections.length} locations  
- 📊 **Medium/Low:** ${detections.length - criticalDetections.length - highDetections.length} locations

${criticalDetections.length > 0 ? `
### 🚨 Critical Deformation Alerts
${criticalDetections.map(d => 
  `- **Location:** ${d.location.latitude.toFixed(4)}°N, ${d.location.longitude.toFixed(4)}°E
  - **Velocity:** ${d.velocity.toFixed(1)} mm/year (${d.direction})
  - **Type:** ${d.anomalyType}
  - **Confidence:** ${(d.confidence * 100).toFixed(0)}%
  - **Last Update:** ${d.lastUpdate.split('T')[0]}`
).join('\n\n')}
` : ''}

${highDetections.length > 0 ? `
### ⚠️ High Significance Detections
${highDetections.slice(0, 3).map(d => 
  `- **${d.location.latitude.toFixed(4)}°N, ${d.location.longitude.toFixed(4)}°E:** ${d.velocity.toFixed(1)} mm/yr ${d.direction} (${d.anomalyType})`
).join('\n')}
${highDetections.length > 3 ? `\n... and ${highDetections.length - 3} more high-significance detections` : ''}
` : ''}

### Analysis Summary
${detections.length === 0 ? "✅ No significant deformation anomalies detected in the specified region." :
  criticalDetections.length > 0 ? "🚨 Critical deformation rates detected - immediate investigation recommended" :
  highDetections.length > 0 ? "⚠️ Elevated deformation rates observed - continued monitoring advised" :
  "📊 Minor deformation variations within normal ranges"}

### Recommendations
${criticalDetections.length > 0 ? "- Immediate field verification of critical deformation areas\n- Enhanced monitoring frequency\n- Coordination with local seismic networks" :
  highDetections.length > 0 ? "- Increased monitoring of high-significance areas\n- Cross-reference with seismic and GNSS data\n- Prepare for potential escalation" :
  "- Continue routine InSAR monitoring\n- Maintain baseline deformation measurements"}

**Note:** InSAR measurements represent line-of-sight deformation. Ground-truth validation recommended for critical findings.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error detecting rapid deformation: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Generate Interferogram
server.registerTool(
  "generate-interferogram",
  {
    title: "Generate InSAR Interferogram",
    description: "Create interferogram from two SAR acquisitions to measure ground deformation",
    inputSchema: {
      primaryDate: z.string().describe("Primary SAR acquisition date (YYYY-MM-DD)"),
      secondaryDate: z.string().describe("Secondary SAR acquisition date (YYYY-MM-DD)"),
      region: z.string().describe("Region name (e.g., 'california', 'japan', 'chile')"),
      mission: z.string().default("Sentinel-1A").describe("SAR mission name")
    }
  },
  async ({ primaryDate, secondaryDate, region, mission }) => {
    try {
      // Generate realistic product IDs based on mission naming conventions
      const primaryProductId = `${mission.replace("-", "")}_${primaryDate}_001`;
      const secondaryProductId = `${mission.replace("-", "")}_${secondaryDate}_002`;
      
      const interferogram = await insarProvider.generateInterferogram(
        primaryProductId,
        secondaryProductId
      );

      return {
        content: [{
          type: "text",
          text: `## InSAR Interferogram Analysis

**Interferogram ID:** ${interferogram.interferogramId}
**Date Pair:** ${interferogram.primaryDate} → ${interferogram.secondaryDate}
**Temporal Baseline:** ${interferogram.temporalBaseline} days
**Perpendicular Baseline:** ${interferogram.perpendicularBaseline} meters

### Interferometric Quality
- **Coherence:** ${(interferogram.coherence * 100).toFixed(1)}% 
- **Unwrapping Quality:** ${interferogram.unwrappingQuality}
- **Coverage:** ${interferogram.coverage.coveragePercentage}% (${interferogram.coverage.validPixels.toLocaleString()} pixels)

### Deformation Measurements
- **Maximum Deformation:** ${interferogram.deformationData.maxDeformation.toFixed(1)} mm
- **Minimum Deformation:** ${interferogram.deformationData.minDeformation.toFixed(1)} mm
- **Average Deformation:** ${interferogram.deformationData.averageDeformation.toFixed(1)} mm
- **Standard Deviation:** ${interferogram.deformationData.standardDeviation.toFixed(1)} mm

### Processing Details
- **Method:** ${interferogram.processing.method}
- **Processor:** ${interferogram.processing.processor} v${interferogram.processing.version}
- **Reference Point:** ${interferogram.processing.referencePoint.latitude.toFixed(4)}°N, ${interferogram.processing.referencePoint.longitude.toFixed(4)}°E

### Quality Assessment
${interferogram.coherence > 0.8 ? "✅ Excellent interferometric quality - highly reliable measurements" :
  interferogram.coherence > 0.6 ? "✅ Good interferometric quality - reliable for most applications" :
  interferogram.coherence > 0.4 ? "⚠️ Fair interferometric quality - use with caution" :
  "❌ Poor interferometric quality - results may be unreliable"}

### Deformation Analysis
${Math.abs(interferogram.deformationData.maxDeformation) > 50 ? "🚨 Significant deformation detected (>50mm) - possible seismic or volcanic activity" :
  Math.abs(interferogram.deformationData.maxDeformation) > 20 ? "⚠️ Moderate deformation observed (20-50mm) - worth investigating" :
  Math.abs(interferogram.deformationData.maxDeformation) > 5 ? "📊 Minor deformation detected (5-20mm) - within normal range" :
  "✅ Minimal deformation - stable ground conditions"}

### Recommendations
${interferogram.coherence < 0.5 ? "- Consider alternative date pairs with shorter temporal baselines\n- Check for atmospheric conditions during acquisitions" :
  Math.abs(interferogram.deformationData.maxDeformation) > 20 ? "- Validate results with ground-truth measurements\n- Check for correlation with seismic events\n- Consider time series analysis" :
  "- Results suitable for baseline monitoring\n- Consider for time series analysis"}

**Note:** Measurements represent line-of-sight displacement. Decomposition into vertical and horizontal components requires additional processing.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating interferogram: ${(error as Error).message}`
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
      const significantEvents = earthquakes.features.filter(eq => eq.properties.mag >= 5.0);
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
      minLatitude: z.number().min(-90).max(90).optional().describe("Minimum latitude"),
      maxLatitude: z.number().min(-90).max(90).optional().describe("Maximum latitude"),
      minLongitude: z.number().min(-180).max(180).optional().describe("Minimum longitude"),
      maxLongitude: z.number().min(-180).max(180).optional().describe("Maximum longitude"),
      latitude: z.number().min(-90).max(90).optional().describe("Center latitude for radius search"),
      longitude: z.number().min(-180).max(180).optional().describe("Center longitude for radius search"),
      maxRadiusKm: z.number().min(1).max(20000).optional().describe("Maximum radius in kilometers"),
      minMagnitude: z.number().min(0).max(10).optional().describe("Minimum magnitude"),
      maxMagnitude: z.number().min(0).max(10).optional().describe("Maximum magnitude"),
      limit: z.number().min(1).max(20000).default(100).describe("Maximum number of results")
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
      latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
      longitude: z.number().min(-180).max(180).describe("Longitude of the location")
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
