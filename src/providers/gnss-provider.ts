import axios, { AxiosResponse } from "axios";

/**
 * GNSS Data Provider
 * 
 * Interfaces with GNSS/GPS networks to fetch station information and
 * crustal displacement data for earthquake monitoring and analysis.
 * 
 * Data sources include:
 * - UNAVCO (now part of EarthScope)
 * - Nevada Geodetic Laboratory
 * - JPL GIPSY time series
 * - IGS (International GNSS Service)
 */

export interface GnssStation {
  stationId: string;
  name: string;
  network: string;
  latitude: number;
  longitude: number;
  elevation: number;
  country: string;
  region: string;
  operator: string;
  receiver: string;
  antenna: string;
  installDate: string;
  status: "active" | "inactive" | "maintenance";
  dataLatency: number; // hours
}

export interface DisplacementMeasurement {
  stationId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  displacement: number; // millimeters
  direction: string; // "north", "east", "up", "horizontal", "3d"
  velocity: number; // mm/year
  accuracy: number; // millimeters
  trending: "stable" | "increasing" | "decreasing";
  anomaly: boolean;
  quality: "excellent" | "good" | "fair" | "poor";
}

export interface GnssTimeSeries {
  stationId: string;
  component: "north" | "east" | "up";
  startDate: string;
  endDate: string;
  sampleRate: string; // "daily", "hourly", "5min"
  unit: "mm" | "m";
  data: Array<{
    timestamp: string;
    value: number;
    error: number;
    quality: string;
  }>;
  trend: {
    velocity: number; // mm/year
    acceleration: number; // mm/year²
    confidence: number; // 0-1
  };
}

export interface MonitoringOptions {
  region: string;
  threshold: number; // millimeters
  timeWindow: number; // days
  networks?: string[];
  stationIds?: string[];
}

export class GnssDataProvider {
  private readonly unavcoUrl = "https://www.unavco.org/data/gps-gnss";
  private readonly nglUrl = "http://geodesy.unr.edu/gps_timeseries";
  private readonly jplUrl = "https://sideshow.jpl.nasa.gov/post/series";
  
  // Regional GNSS networks
  private readonly regionalNetworks = {
    california: ["PBO", "CGPS", "SCIGN"],
    japan: ["GEONET"],
    chile: ["CAP"],
    newzealand: ["GEONET_NZ"],
    italy: ["RING"],
    turkey: ["TUSAGA"],
    alaska: ["PBO_AK"],
    caribbean: ["COCONet"]
  };

  /**
   * Get GNSS stations for a specific network, region, or global area
   */
  async getStations(network?: string, region?: string, bounds?: {north: number, south: number, east: number, west: number}): Promise<GnssStation[]> {
    try {
      // In a real implementation, this would query actual GNSS databases
      // For demonstration, we'll return mock data based on known networks or coordinates
      
      let targetNetworks: string[] = [];
      let stationCount = 15;
      
      if (network) {
        targetNetworks = [network];
      } else if (region && this.regionalNetworks[region.toLowerCase() as keyof typeof this.regionalNetworks]) {
        targetNetworks = this.regionalNetworks[region.toLowerCase() as keyof typeof this.regionalNetworks];
      } else if (bounds) {
        // Global coordinate-based query
        targetNetworks = ["IGS", "GLOBAL", "REGIONAL"];
        stationCount = Math.floor(Math.random() * 20) + 10; // 10-30 stations
      } else {
        // Default to major networks
        targetNetworks = ["PBO", "IGS", "GEONET"];
      }

      const stations: GnssStation[] = [];
      
      for (let i = 0; i < stationCount; i++) {
        const networkName = targetNetworks[Math.floor(Math.random() * targetNetworks.length)];
        let coordinates: [number, number, number];
        let stationId: string;
        
        if (bounds) {
          // Generate stations within specified bounds
          const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
          const lon = bounds.west + Math.random() * (bounds.east - bounds.west);
          const elevation = Math.random() * 3000; // 0-3000m elevation
          coordinates = [lat, lon, elevation];
          stationId = `${networkName}${(i + 1).toString().padStart(3, '0')}`;
        } else if (region) {
          const coords = this.getRegionalCoordinates(region, networkName);
          coordinates = [coords.lat, coords.lon, Math.random() * 2000];
          const regionPrefix = region.toUpperCase().substring(0, 3);
          stationId = `${regionPrefix}${(i + 1).toString().padStart(2, '0')}`;
        } else {
          // Global random coordinates for demonstration
          const coords = this.getRegionalCoordinates('global', networkName);
          coordinates = [coords.lat, coords.lon, Math.random() * 2000];
          stationId = `${networkName}${(i + 1).toString().padStart(2, '0')}`;
        }

        stations.push({
          stationId,
          network: networkName,
          name: `${stationId} Station`,
          latitude: coordinates[0],
          longitude: coordinates[1],
          elevation: coordinates[2],
          country: this.getCountryFromCoordinates(coordinates[0], coordinates[1]),
          region: region || 'global',
          operator: `${networkName} Network`,
          receiver: "TRIMBLE NETR9",
          antenna: "TRM59800.00",
          status: Math.random() > 0.1 ? "active" : "inactive",
          installDate: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
          dataLatency: Math.floor(Math.random() * 24) + 1
        });
      }

      return stations;
    } catch (error) {
      console.error("Error fetching GNSS stations:", error);
      throw new Error(`Failed to fetch GNSS stations: ${(error as Error).message}`);
    }
  }

  private getCountryFromCoordinates(lat: number, lon: number): string {
    // Simple geographic region mapping
    if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) return "USA";
    if (lat >= -56 && lat <= -17 && lon >= -81 && lon <= -34) return "South America";
    if (lat >= 20 && lat <= 46 && lon >= 123 && lon <= 146) return "Japan";
    if (lat >= -47 && lat <= -34 && lon >= 166 && lon <= 179) return "New Zealand";
    if (lat >= 36 && lat <= 42 && lon >= 26 && lon <= 45) return "Turkey";
    if (lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141) return "Southeast Asia";
    if (lat >= 25 && lat <= 40 && lon >= 44 && lon <= 63) return "Iran";
    if (lat >= 35 && lat <= 71 && lon >= -12 && lon <= 40) return "Europe";
    if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) return "Africa";
    if (lat >= -50 && lat <= -10 && lon >= 110 && lon <= 155) return "Australia";
    if (lat >= 45 && lat <= 80 && lon >= -170 && lon <= -50) return "Canada";
    if (lat >= 15 && lat <= 35 && lon >= -120 && lon <= -85) return "Mexico";
    return "Global";
  }

  /**
   * Monitor GNSS displacements for anomalous movements
   */
  async monitorDisplacements(options: MonitoringOptions): Promise<DisplacementMeasurement[]> {
    try {
      const stations = await this.getStations(undefined, options.region);
      const measurements: DisplacementMeasurement[] = [];

      for (const station of stations) {
        // Simulate recent displacement measurements
        const displacement = this.simulateDisplacement(station, options.timeWindow);
        if (displacement) {
          measurements.push(displacement);
        }
      }

      // Sort by displacement magnitude (largest first)
      return measurements.sort((a, b) => b.displacement - a.displacement);
    } catch (error) {
      console.error("Error monitoring GNSS displacements:", error);
      throw new Error(`Failed to monitor displacements: ${(error as Error).message}`);
    }
  }

  /**
   * Get time series data for a specific station
   */
  async getTimeSeries(
    stationId: string, 
    component: "north" | "east" | "up", 
    startDate: string, 
    endDate: string
  ): Promise<GnssTimeSeries> {
    try {
      // In a real implementation, this would fetch from NGL or other providers
      const station = await this.getStationInfo(stationId);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Generate synthetic time series for demonstration
      const data = [];
      const baseVelocity = this.getComponentVelocity(component, station?.region || "global");
      
      for (let i = 0; i <= days; i++) {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const daysSinceStart = i;
        
        // Simulate realistic GNSS motion with noise
        const trend = (baseVelocity * daysSinceStart) / 365.25; // mm
        const seasonal = Math.sin(2 * Math.PI * daysSinceStart / 365.25) * 2; // mm seasonal
        const noise = (Math.random() - 0.5) * 3; // mm random noise
        const earthquakeSignal = this.simulateEarthquakeEffect(date, station?.latitude || 0, station?.longitude || 0);
        
        const value = trend + seasonal + noise + earthquakeSignal;
        
        data.push({
          timestamp: date.toISOString().split('T')[0],
          value: parseFloat(value.toFixed(3)),
          error: 0.5 + Math.random() * 0.5, // 0.5-1.0 mm error
          quality: Math.random() > 0.1 ? "good" : "fair"
        });
      }

      return {
        stationId,
        component,
        startDate,
        endDate,
        sampleRate: "daily",
        unit: "mm",
        data,
        trend: {
          velocity: baseVelocity,
          acceleration: (Math.random() - 0.5) * 0.1, // Small acceleration/deceleration
          confidence: 0.85 + Math.random() * 0.1
        }
      };
    } catch (error) {
      console.error("Error fetching GNSS time series:", error);
      throw new Error(`Failed to fetch time series: ${(error as Error).message}`);
    }
  }

  /**
   * Detect anomalous movements that might indicate seismic activity
   */
  async detectAnomalies(
    region: string, 
    sensitivityThreshold: number = 3.0
  ): Promise<Array<{
    stationId: string;
    anomalyType: "displacement" | "velocity" | "acceleration";
    magnitude: number;
    confidence: number;
    timestamp: string;
    description: string;
  }>> {
    try {
      const stations = await this.getStations(undefined, region);
      const anomalies = [];

      for (const station of stations) {
        // Check recent measurements for anomalies
        const recent = await this.getRecentMeasurements(station.stationId, 7);
        
        for (const measurement of recent) {
          if (measurement.anomaly && measurement.displacement > sensitivityThreshold) {
            anomalies.push({
              stationId: station.stationId,
              anomalyType: "displacement" as const,
              magnitude: measurement.displacement,
              confidence: measurement.quality === "excellent" ? 0.95 : 
                         measurement.quality === "good" ? 0.85 : 0.70,
              timestamp: measurement.timestamp,
              description: `Anomalous ${measurement.direction} displacement of ${measurement.displacement.toFixed(1)}mm detected`
            });
          }
        }
      }

      return anomalies.sort((a, b) => b.magnitude - a.magnitude);
    } catch (error) {
      console.error("Error detecting GNSS anomalies:", error);
      throw new Error(`Failed to detect anomalies: ${(error as Error).message}`);
    }
  }

  /**
   * Get correlation between GNSS movements and seismic events
   */
  async getSeismicCorrelation(
    stationId: string, 
    earthquakeTime: string, 
    windowHours: number = 48
  ): Promise<{
    preEventMovement: number;
    coSeismicDisplacement: number;
    postEventRelaxation: number;
    confidence: number;
    analysis: string;
  }> {
    try {
      const eventDate = new Date(earthquakeTime);
      const preStart = new Date(eventDate.getTime() - windowHours * 60 * 60 * 1000);
      const postEnd = new Date(eventDate.getTime() + windowHours * 60 * 60 * 1000);

      // Get time series around the earthquake
      const northSeries = await this.getTimeSeries(stationId, "north", 
        preStart.toISOString().split('T')[0], postEnd.toISOString().split('T')[0]);
      const eastSeries = await this.getTimeSeries(stationId, "east", 
        preStart.toISOString().split('T')[0], postEnd.toISOString().split('T')[0]);
      const upSeries = await this.getTimeSeries(stationId, "up", 
        preStart.toISOString().split('T')[0], postEnd.toISOString().split('T')[0]);

      // Analyze displacement patterns
      const eventIndex = Math.floor(northSeries.data.length / 2);
      
      const preEventMovement = Math.sqrt(
        Math.pow(this.calculateTrend(northSeries.data.slice(0, eventIndex)), 2) +
        Math.pow(this.calculateTrend(eastSeries.data.slice(0, eventIndex)), 2) +
        Math.pow(this.calculateTrend(upSeries.data.slice(0, eventIndex)), 2)
      );

      const coSeismicDisplacement = Math.sqrt(
        Math.pow(northSeries.data[eventIndex + 1]?.value - northSeries.data[eventIndex - 1]?.value || 0, 2) +
        Math.pow(eastSeries.data[eventIndex + 1]?.value - eastSeries.data[eventIndex - 1]?.value || 0, 2) +
        Math.pow(upSeries.data[eventIndex + 1]?.value - upSeries.data[eventIndex - 1]?.value || 0, 2)
      );

      const postEventRelaxation = Math.sqrt(
        Math.pow(this.calculateTrend(northSeries.data.slice(eventIndex + 1)), 2) +
        Math.pow(this.calculateTrend(eastSeries.data.slice(eventIndex + 1)), 2) +
        Math.pow(this.calculateTrend(upSeries.data.slice(eventIndex + 1)), 2)
      );

      const confidence = Math.min(northSeries.trend.confidence, eastSeries.trend.confidence, upSeries.trend.confidence);

      let analysis = "GNSS correlation analysis:\n";
      if (coSeismicDisplacement > 5.0) {
        analysis += "- Significant co-seismic displacement detected\n";
      }
      if (preEventMovement > 2.0) {
        analysis += "- Pre-event movement observed (possible precursor)\n";
      }
      if (postEventRelaxation > 1.0) {
        analysis += "- Post-event relaxation/afterslip detected\n";
      }

      return {
        preEventMovement,
        coSeismicDisplacement,
        postEventRelaxation,
        confidence,
        analysis
      };
    } catch (error) {
      console.error("Error analyzing seismic correlation:", error);
      throw new Error(`Failed to analyze seismic correlation: ${(error as Error).message}`);
    }
  }

  // === Private Helper Methods ===

  private generateMockStations(network: string, region?: string): GnssStation[] {
    const stations: GnssStation[] = [];
    const count = Math.floor(Math.random() * 10) + 5; // 5-14 stations per network

    for (let i = 0; i < count; i++) {
      const coords = this.getRegionalCoordinates(region || "global", network);
      
      stations.push({
        stationId: `${network}${String(i + 1).padStart(2, '0')}`,
        name: `${network} Station ${i + 1}`,
        network,
        latitude: coords.lat + (Math.random() - 0.5) * 2,
        longitude: coords.lon + (Math.random() - 0.5) * 4,
        elevation: Math.random() * 2000 + 10,
        country: this.getCountryForRegion(region || "global"),
        region: region || "global",
        operator: network,
        receiver: ["Trimble NetR9", "Leica GR50", "Septentrio PolaRx5"][Math.floor(Math.random() * 3)],
        antenna: ["TRM59800.00", "LEIAT504GG", "SEPCHOKE_B3E6"][Math.floor(Math.random() * 3)],
        installDate: new Date(2010 + Math.random() * 13, Math.floor(Math.random() * 12), 1).toISOString().split('T')[0],
        status: Math.random() > 0.1 ? "active" : "maintenance",
        dataLatency: Math.floor(Math.random() * 24) + 1
      });
    }

    return stations;
  }

  private simulateDisplacement(station: GnssStation, timeWindow: number): DisplacementMeasurement | null {
    // Only return displacement for active stations
    if (station.status !== "active") return null;

    const now = new Date();
    const displacement = Math.random() * 15; // 0-15mm
    const isAnomalous = displacement > 8; // Threshold for anomaly
    
    const directions = ["north", "east", "up", "horizontal", "3d"];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    return {
      stationId: station.stationId,
      timestamp: now.toISOString(),
      latitude: station.latitude,
      longitude: station.longitude,
      displacement,
      direction,
      velocity: (Math.random() - 0.5) * 20, // -10 to +10 mm/year
      accuracy: 0.5 + Math.random() * 1.0, // 0.5-1.5 mm
      trending: displacement > 10 ? "increasing" : displacement < 2 ? "stable" : "decreasing",
      anomaly: isAnomalous,
      quality: Math.random() > 0.3 ? "good" : Math.random() > 0.1 ? "fair" : "poor"
    };
  }

  private async getStationInfo(stationId: string): Promise<GnssStation | null> {
    // Mock implementation - would query actual database
    return {
      stationId,
      name: `Station ${stationId}`,
      network: stationId.substring(0, 3),
      latitude: 37.7749 + (Math.random() - 0.5) * 10,
      longitude: -122.4194 + (Math.random() - 0.5) * 20,
      elevation: Math.random() * 1000,
      country: "USA",
      region: "california",
      operator: "PBO",
      receiver: "Trimble NetR9",
      antenna: "TRM59800.00",
      installDate: "2010-01-01",
      status: "active",
      dataLatency: 2
    };
  }

  private getComponentVelocity(component: "north" | "east" | "up", region: string): number {
    // Typical GNSS velocities by component and region (mm/year)
    const velocities = {
      california: { north: 35, east: -20, up: -1 }, // Pacific Plate motion
      japan: { north: -5, east: 25, up: 0 }, // Philippine Sea Plate
      chile: { north: 20, east: -15, up: 2 }, // Nazca Plate subduction
      global: { north: 0, east: 0, up: -0.5 } // Average
    };

    return velocities[region as keyof typeof velocities]?.[component] || 
           velocities.global[component];
  }

  private simulateEarthquakeEffect(date: Date, lat: number, lon: number): number {
    // Simulate occasional earthquake displacement
    if (Math.random() > 0.99) { // 1% chance per day
      return (Math.random() - 0.5) * 50; // ±25mm earthquake effect
    }
    return 0;
  }

  private async getRecentMeasurements(stationId: string, days: number): Promise<DisplacementMeasurement[]> {
    // Mock recent measurements
    const measurements = [];
    for (let i = 0; i < days; i++) {
      const station = await this.getStationInfo(stationId);
      if (station) {
        const measurement = this.simulateDisplacement(station, 1);
        if (measurement) {
          measurement.timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString();
          measurements.push(measurement);
        }
      }
    }
    return measurements;
  }

  private calculateTrend(data: Array<{ value: number }>): number {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private getRegionalCoordinates(region: string, network: string): { lat: number; lon: number } {
    const regions = {
      california: { lat: 37.0, lon: -120.0 },
      japan: { lat: 36.0, lon: 138.0 },
      chile: { lat: -33.0, lon: -71.0 },
      newzealand: { lat: -41.0, lon: 174.0 },
      alaska: { lat: 64.0, lon: -153.0 },
      global: { lat: 0.0, lon: 0.0 }
    };

    return regions[region as keyof typeof regions] || regions.global;
  }

  private getCountryForRegion(region: string): string {
    const countries = {
      california: "USA",
      japan: "Japan",
      chile: "Chile",
      newzealand: "New Zealand",
      alaska: "USA",
      global: "International"
    };

    return countries[region as keyof typeof countries] || "Unknown";
  }
}
