import axios from 'axios';

/**
 * USGS Earthquake Data Provider
 * Integrates with USGS Earthquake Hazards Program APIs
 * Provides real-time earthquake data, ShakeMaps, and hazard information
 */

// USGS API interfaces
export interface USGSEarthquake {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz?: number;
    url: string;
    detail: string;
    felt?: number;
    cdi?: number;
    mmi?: number;
    alert?: string;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst?: number;
    dmin?: number;
    rms?: number;
    gap?: number;
    magType: string;
    type: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
}

export interface USGSFeatureCollection {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSEarthquake[];
}

export interface ShakeMapData {
  eventId: string;
  version: number;
  eventTime: string;
  magnitude: number;
  location: string;
  latitude: number;
  longitude: number;
  depth: number;
  maxIntensity: number;
  shakemapUrl: string;
  contourData?: {
    intensity: number;
    coordinates: Array<[number, number]>;
  }[];
  stationData?: {
    stationId: string;
    name: string;
    latitude: number;
    longitude: number;
    intensity: number;
    peakGroundAcceleration: number;
    peakGroundVelocity: number;
  }[];
}

export interface USGSHazardData {
  location: {
    latitude: number;
    longitude: number;
  };
  hazardValues: {
    pga: number; // Peak Ground Acceleration (g)
    sa0p2: number; // Spectral Acceleration at 0.2 seconds
    sa1p0: number; // Spectral Acceleration at 1.0 seconds
    returnPeriod: number; // years (e.g., 475, 2475)
    probability: number; // probability of exceedance
  }[];
  vs30: number; // Site class (m/s)
  metadata: {
    model: string;
    edition: string;
    region: string;
  };
}

export interface USGSSearchParams {
  startTime?: string; // ISO8601 Date/Time (mapped to starttime)
  endTime?: string; // ISO8601 Date/Time (mapped to endtime)
  minLatitude?: number; // Mapped to minlatitude
  maxLatitude?: number; // Mapped to maxlatitude
  minLongitude?: number; // Mapped to minlongitude
  maxLongitude?: number; // Mapped to maxlongitude
  latitude?: number; // Specify the latitude for the search
  longitude?: number; // Specify the longitude for the search
  maxRadiusKm?: number; // Limits to events within the specified maximum number of kilometers (mapped to maxradiuskm)
  minMagnitude?: number; // Mapped to minmagnitude
  maxMagnitude?: number; // Mapped to maxmagnitude
  mindepth?: number;
  maxdepth?: number;
  orderby?: 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc';
  limit?: number; // Limit the results
  offset?: number; // Return results starting at the event count specified
}

export class USGSDataProvider {
  private readonly apiUrl = "https://earthquake.usgs.gov/fdsnws/event/1";
  private readonly shakemapUrl = "https://earthquake.usgs.gov/earthquakes/eventpage";
  private readonly hazardUrl = "https://earthquake.usgs.gov/ws/designmaps";

  /**
   * Get earthquakes from USGS real-time feeds
   */
  async getEarthquakes(magnitude: string = "all", timeframe: string = "day"): Promise<USGSFeatureCollection> {
    try {
      const feedUrl = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${magnitude}_${timeframe}.geojson`;

      const response = await axios.get(feedUrl, {
        headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching USGS earthquakes:", error);
      throw new Error(`Failed to fetch USGS earthquakes: ${(error as Error).message}`);
    }
  }

  /**
   * Search for earthquakes with custom parameters
   */
  async searchEarthquakes(params: USGSSearchParams): Promise<USGSFeatureCollection> {
    try {
      const queryParams = new URLSearchParams();
      
      // Map MCP schema parameters to USGS API parameters
      const paramMapping: Record<string, string> = {
        'startTime': 'starttime',
        'endTime': 'endtime',
        'minLatitude': 'minlatitude',
        'maxLatitude': 'maxlatitude',
        'minLongitude': 'minlongitude',
        'maxLongitude': 'maxlongitude',
        'maxRadiusKm': 'maxradiuskm',
        'minMagnitude': 'minmagnitude',
        'maxMagnitude': 'maxmagnitude'
      };

      // Add all provided parameters to the query with correct API names
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          const apiKey = paramMapping[key] || key;
          queryParams.append(apiKey, value.toString());
        }
      });
      
      // Always request GeoJSON format
      queryParams.append('format', 'geojson');

      const url = `${this.apiUrl}/query?${queryParams.toString()}`;

      const response = await axios.get(url, {
        headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error("Error searching USGS earthquakes:", error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new Error(`Invalid search parameters: ${(error as Error).message}`);
      }
      throw new Error(`Failed to search USGS earthquakes: ${(error as Error).message}`);
    }
  }

  /**
   * Get earthquake count statistics
   */
  async getCount(magnitude: string = "all", timeframe: string = "day"): Promise<number> {
    try {
      const data = await this.getEarthquakes(magnitude, timeframe);
      return data.metadata.count;
    } catch (error) {
      console.error("Error getting earthquake count:", error);
      throw new Error(`Failed to get earthquake count: ${(error as Error).message}`);
    }
  }

  /**
   * Get ShakeMap data for a specific earthquake
   */
  async getShakeMap(eventId: string): Promise<ShakeMapData> {
    try {
      // First get the earthquake details using real API
      const detailsUrl = `${this.apiUrl}/query?eventid=${eventId}&format=geojson`;
      const detailsResponse = await axios.get(detailsUrl, {
        headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
        timeout: 30000
      });

      if (!detailsResponse.data.features || detailsResponse.data.features.length === 0) {
        throw new Error(`Event ${eventId} not found`);
      }

      const earthquake = detailsResponse.data.features[0];

      // Base ShakeMap download URL
      const downloadBase = `${this.shakemapUrl}/${eventId}/download`;

      let version = 1;
      const contourData: { intensity: number; coordinates: Array<[number, number]> }[] = [];
      const stationData: {
        stationId: string;
        name: string;
        latitude: number;
        longitude: number;
        intensity: number;
        peakGroundAcceleration: number;
        peakGroundVelocity: number;
      }[] = [];

      // Try to get ShakeMap metadata
      try {
        const metaResp = await axios.get(`${downloadBase}/shakemap.json`, {
          headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
          timeout: 30000
        });
        const meta = metaResp.data || {};
        version = parseInt(
          meta?.shakemap_version ||
            meta?.map_version ||
            meta?.mapVersion ||
            meta?.map_information?.shake_map_version ||
            "1",
          10
        );
      } catch (err) {
        // Metadata not available; keep default version
      }

      // Parse intensity contours
      try {
        const contourResp = await axios.get(`${downloadBase}/contour.json`, {
          headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
          timeout: 30000
        });
        const features = contourResp.data?.features || [];
        for (const feature of features) {
          const intensity = parseFloat(
            feature?.properties?.value ??
              feature?.properties?.intensity ??
              feature?.properties?.mmi ??
              0
          );
          const coords =
            feature?.geometry?.coordinates?.[0]?.map((c: [number, number]) => [
              c[1],
              c[0]
            ]) || [];
          contourData.push({ intensity, coordinates: coords });
        }
      } catch (err) {
        // Contour data may not be available
      }

      // Parse station list
      try {
        const stationResp = await axios.get(`${downloadBase}/stationlist.json`, {
          headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
          timeout: 30000
        });
        const stations = stationResp.data?.features || [];
        for (const station of stations) {
          const props = station.properties || {};
          const intensity = parseFloat(
            props?.intensity ?? props?.mmi ?? props?.value ?? 0
          );
          const pga = parseFloat(
            props?.pga?.value ?? props?.pga ?? 0
          );
          const pgv = parseFloat(
            props?.pgv?.value ?? props?.pgv ?? 0
          );
          stationData.push({
            stationId: props?.code || props?.id || props?.station_id || "",
            name: props?.name || props?.station_name || "",
            latitude: station?.geometry?.coordinates?.[1] ?? 0,
            longitude: station?.geometry?.coordinates?.[0] ?? 0,
            intensity,
            peakGroundAcceleration: pga,
            peakGroundVelocity: pgv
          });
        }
      } catch (err) {
        // Station data may not be available
      }

      // Calculate max intensity from parsed data
      const maxIntensity = Math.max(
        ...contourData.map((c) => c.intensity),
        ...stationData.map((s) => s.intensity),
        0
      );

      const shakeMapData: ShakeMapData = {
        eventId,
        version,
        eventTime: new Date(earthquake.properties.time).toISOString(),
        magnitude: earthquake.properties.mag,
        location: earthquake.properties.place,
        latitude: earthquake.geometry.coordinates[1],
        longitude: earthquake.geometry.coordinates[0],
        depth: earthquake.geometry.coordinates[2],
        maxIntensity,
        shakemapUrl: `${this.shakemapUrl}/${eventId}/`,
        contourData,
        stationData
      };

      return shakeMapData;
    } catch (error) {
      console.error("Error getting ShakeMap data:", error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`ShakeMap data not found for event ${eventId}`);
      }
      throw new Error(`Failed to get ShakeMap data: ${(error as Error).message}`);
    }
  }

  /**
   * Get earthquake details by event ID
   */
  async getEarthquakeDetails(eventId: string): Promise<USGSEarthquake> {
    try {
      const url = `${this.apiUrl}/query?eventid=${eventId}&format=geojson`;
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
        timeout: 30000
      });

      if (!response.data.features || response.data.features.length === 0) {
        throw new Error(`Earthquake ${eventId} not found`);
      }

      const earthquake = response.data.features[0];
      
      return earthquake;
    } catch (error) {
      console.error("Error getting earthquake details:", error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Earthquake ${eventId} not found in USGS database`);
      }
      throw new Error(`Failed to get earthquake details: ${(error as Error).message}`);
    }
  }

  /**
   * Get seismic hazard assessment for a location
   * Note: This is a placeholder implementation - USGS Design Maps API requires specific implementation
   */
  async getSeismicHazard(latitude: number, longitude: number): Promise<USGSHazardData> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        riskCategory: "II",
        siteClass: "D",
        edition: "ASCE7-16",
        format: "json"
      });

      const url = `${this.hazardUrl}/asce7-16.json?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { "User-Agent": "MCP-Earthquake-Server/1.0" },
        timeout: 30000
      });

      const data = response.data?.response?.data || {};
      return {
        location: { latitude, longitude },
        hazardValues: [
          {
            pga: parseFloat(data.pga) || 0,
            sa0p2: parseFloat(data.sds ?? data.ss) || 0,
            sa1p0: parseFloat(data.sd1 ?? data.s1) || 0,
            returnPeriod: 475,
            probability: 0.1
          }
        ],
        vs30: parseFloat(data.vs30) || 760,
        metadata: {
          model: response.data?.response?.metadata?.model || "USGS Design Maps",
          edition: response.data?.response?.edition || "ASCE7-16",
          region: response.data?.response?.region || "US"
        }
      };
    } catch (error) {
      console.error("Error fetching USGS seismic hazard:", error);
      throw new Error(`Failed to fetch seismic hazard data: ${(error as Error).message}`);
    }
  }
}
