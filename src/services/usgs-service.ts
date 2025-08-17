import axios from "axios";

export interface EarthquakeData {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  coordinates: [number, number];
  depth: number;
  url: string;
  significance: number;
  type: string;
}

export interface EarthquakeQuery {
  magnitudeMin?: number;
  limit?: number;
  days?: number;
  location?: string;
}

export interface SignificantEarthquakeQuery {
  daysBack?: number;
  includeAftershocks?: boolean;
}

/**
 * Service for interacting with USGS Earthquake API
 */
export class USGSEarthquakeService {
  private readonly baseUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0";
  private readonly detailUrl = "https://earthquake.usgs.gov/fdsnws/event/1";

  /**
   * Get recent earthquakes from USGS
   */
  async getRecentEarthquakes(query: EarthquakeQuery = {}): Promise<EarthquakeData[]> {
    const {
      magnitudeMin = 2.5,
      limit = 100,
      days = 7,
      location
    } = query;

    try {
      // Use USGS GeoJSON feed for recent earthquakes
      let feedUrl = `${this.baseUrl}/summary/all_day.geojson`;
      
      if (days === 7) {
        feedUrl = `${this.baseUrl}/summary/all_week.geojson`;
      } else if (days === 30) {
        feedUrl = `${this.baseUrl}/summary/all_month.geojson`;
      }

      const response = await axios.get(feedUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'USGS-Earthquake-MCP-Server/1.0'
        }
      });

      const features = response.data.features || [];
      
      let earthquakes: EarthquakeData[] = features
        .filter((feature: any) => {
          const mag = feature.properties.mag;
          return mag && mag >= magnitudeMin;
        })
        .map((feature: any) => ({
          id: feature.id,
          magnitude: feature.properties.mag,
          place: feature.properties.place,
          time: new Date(feature.properties.time).toISOString(),
          coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]], // lat, lon
          depth: feature.geometry.coordinates[2],
          url: feature.properties.url,
          significance: feature.properties.sig || 0,
          type: feature.properties.type || 'earthquake'
        }))
        .sort((a: EarthquakeData, b: EarthquakeData) => 
          new Date(b.time).getTime() - new Date(a.time).getTime()
        );

      // Filter by location if specified
      if (location) {
        const locationLower = location.toLowerCase();
        earthquakes = earthquakes.filter(eq => 
          eq.place.toLowerCase().includes(locationLower)
        );
      }

      return earthquakes.slice(0, limit);

    } catch (error) {
      console.error('Error fetching earthquakes from USGS:', error);
      throw new Error(`Failed to fetch earthquake data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get significant earthquakes (M4.5+)
   */
  async getSignificantEarthquakes(query: SignificantEarthquakeQuery = {}): Promise<EarthquakeData[]> {
    const { daysBack = 30, includeAftershocks = true } = query;

    try {
      // Use detailed query API for significant earthquakes
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      const queryParams = new URLSearchParams({
        format: 'geojson',
        starttime: startTime.toISOString().split('T')[0],
        endtime: endTime.toISOString().split('T')[0],
        minmagnitude: '4.5',
        orderby: 'time-asc',
        limit: '1000'
      });

      const response = await axios.get(`${this.detailUrl}/query?${queryParams}`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'USGS-Earthquake-MCP-Server/1.0'
        }
      });

      const features = response.data.features || [];
      
      let earthquakes: EarthquakeData[] = features.map((feature: any) => ({
        id: feature.id,
        magnitude: feature.properties.mag,
        place: feature.properties.place,
        time: new Date(feature.properties.time).toISOString(),
        coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
        depth: feature.geometry.coordinates[2],
        url: feature.properties.url,
        significance: feature.properties.sig || 0,
        type: feature.properties.type || 'earthquake'
      }));

      // Filter out aftershocks if requested
      if (!includeAftershocks) {
        earthquakes = this.filterMainshocks(earthquakes);
      }

      return earthquakes.sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );

    } catch (error) {
      console.error('Error fetching significant earthquakes:', error);
      throw new Error(`Failed to fetch significant earthquake data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Filter out likely aftershocks based on time and location proximity
   */
  private filterMainshocks(earthquakes: EarthquakeData[]): EarthquakeData[] {
    const mainshocks: EarthquakeData[] = [];
    const sortedByMag = [...earthquakes].sort((a, b) => b.magnitude - a.magnitude);

    for (const eq of sortedByMag) {
      const isMainshock = !mainshocks.some(mainshock => {
        const timeDiff = Math.abs(new Date(eq.time).getTime() - new Date(mainshock.time).getTime());
        const distance = this.calculateDistance(eq.coordinates, mainshock.coordinates);
        
        // Consider it an aftershock if it's within 100km and 30 days of a larger earthquake
        return distance < 100 && timeDiff < (30 * 24 * 60 * 60 * 1000) && eq.magnitude < mainshock.magnitude;
      });

      if (isMainshock) {
        mainshocks.push(eq);
      }
    }

    return mainshocks;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get detailed information for a specific earthquake
   */
  async getEarthquakeDetails(id: string): Promise<EarthquakeData | null> {
    try {
      const response = await axios.get(`${this.detailUrl}/query`, {
        params: {
          eventid: id,
          format: 'geojson'
        },
        timeout: 10000
      });

      const feature = response.data.features?.[0];
      if (!feature) return null;

      return {
        id: feature.id,
        magnitude: feature.properties.mag,
        place: feature.properties.place,
        time: new Date(feature.properties.time).toISOString(),
        coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
        depth: feature.geometry.coordinates[2],
        url: feature.properties.url,
        significance: feature.properties.sig || 0,
        type: feature.properties.type || 'earthquake'
      };

    } catch (error) {
      console.error(`Error fetching earthquake details for ${id}:`, error);
      return null;
    }
  }
}
