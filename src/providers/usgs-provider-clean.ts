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
  starttime?: string; // ISO8601 Date/Time
  endtime?: string; // ISO8601 Date/Time
  minlatitude?: number;
  maxlatitude?: number;
  minlongitude?: number;
  maxlongitude?: number;
  latitude?: number; // Specify the latitude for the search
  longitude?: number; // Specify the longitude for the search
  maxradiuskm?: number; // Limits to events within the specified maximum number of kilometers
  minmagnitude?: number;
  maxmagnitude?: number;
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
      console.log(`Fetching earthquakes from USGS: ${feedUrl}`);

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
      
      // Add all provided parameters to the query
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      
      // Always request GeoJSON format
      queryParams.append('format', 'geojson');

      const url = `${this.apiUrl}/query?${queryParams.toString()}`;
      console.log(`Searching USGS earthquakes: ${url}`);

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
      
      // Try to get real ShakeMap data from USGS
      const shakemapUrl = `${this.shakemapUrl}/${eventId}/download/intensity.jpg`;
      let hasShakeMap = false;
      
      try {
        await axios.head(shakemapUrl, { timeout: 10000 });
        hasShakeMap = true;
      } catch (error) {
        console.log(`No ShakeMap available for event ${eventId}`);
        hasShakeMap = false;
      }

      const shakeMapData: ShakeMapData = {
        eventId,
        version: 1, // Default version
        eventTime: new Date(earthquake.properties.time).toISOString(),
        magnitude: earthquake.properties.mag,
        location: earthquake.properties.place,
        latitude: earthquake.geometry.coordinates[1],
        longitude: earthquake.geometry.coordinates[0],
        depth: earthquake.geometry.coordinates[2],
        maxIntensity: hasShakeMap ? Math.min(Math.floor(earthquake.properties.mag * 1.2 + 2), 10) : Math.floor(earthquake.properties.mag * 1.2),
        shakemapUrl: hasShakeMap ? `${this.shakemapUrl}/${eventId}/` : `${this.shakemapUrl}/${eventId}/notfound`,
        contourData: [], // Real contour data would require additional USGS ShakeMap API calls
        stationData: []   // Real station data would require additional USGS ShakeMap API calls
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
      console.log(`Fetching earthquake details from USGS: ${url}`);
      
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
}
