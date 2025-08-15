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
    alert?: 'green' | 'yellow' | 'orange' | 'red';
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
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
}

export interface USGSFeatureCollection {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSEarthquake[];
  bbox?: [number, number, number, number, number, number];
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
  hazardCurve: {
    period: number; // seconds (0 for PGA, >0 for spectral acceleration)
    probabilities: number[];
    accelerations: number[]; // in g
  }[];
  annualExceedanceProbability: {
    acceleration: number;
    probability: number;
    returnPeriod: number;
  }[];
  designValues: {
    ss: number; // Short-period design acceleration
    s1: number; // 1-second period design acceleration
    pga: number; // Peak ground acceleration
    siteClass: string;
  };
}

export interface USGSSearchParams {
  starttime?: string;
  endtime?: string;
  minlatitude?: number;
  maxlatitude?: number;
  minlongitude?: number;
  maxlongitude?: number;
  latitude?: number;
  longitude?: number;
  maxradiuskm?: number;
  minmagnitude?: number;
  maxmagnitude?: number;
  mindepth?: number;
  maxdepth?: number;
  limit?: number;
  offset?: number;
  orderby?: 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc';
  format?: 'geojson' | 'csv' | 'kml';
}

export class USGSDataProvider {
  private baseUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0';
  private apiUrl = 'https://earthquake.usgs.gov/fdsnws/event/1';
  private shakemapUrl = 'https://earthquake.usgs.gov/earthquakes/eventpage';
  private hazardUrl = 'https://earthquake.usgs.gov/hazards/hazmaps';

  /**
   * Get recent earthquakes from USGS real-time feeds
   */
  async getRecentEarthquakes(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day', magnitude: 'significant' | 'all' | '4.5' | '2.5' | '1.0' = 'all'): Promise<USGSFeatureCollection> {
    try {
      // USGS provides standardized real-time feeds
      let feedUrl: string;
      
      if (magnitude === 'significant') {
        feedUrl = `${this.baseUrl}/summary/significant_${timeframe}.geojson`;
      } else {
        const magFilter = magnitude === 'all' ? 'all' : `${magnitude}`;
        feedUrl = `${this.baseUrl}/summary/${magFilter}_${timeframe}.geojson`;
      }

      console.log(`Fetching USGS data from: ${feedUrl}`);

      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'MCP-Earthquake-Server/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`USGS API returned ${response.status}: ${response.statusText}`);
      }

      const data: USGSFeatureCollection = await response.json();
      
      // Validate the response structure
      if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON response from USGS API');
      }

      return data;
    } catch (error) {
      console.error('Error fetching USGS earthquake data:', error);
      throw new Error(`Failed to fetch USGS earthquake data: ${(error as Error).message}`);
    }
  }

  /**
   * Search earthquakes with custom parameters using USGS FDSNWS API
   */
  async searchEarthquakes(params: USGSSearchParams): Promise<USGSFeatureCollection> {
    try {
      // Build query parameters for USGS FDSNWS API
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      
      // Force GeoJSON format for consistent parsing
      queryParams.append('format', 'geojson');
      
      // Set reasonable defaults
      if (!queryParams.has('limit')) {
        queryParams.append('limit', '100');
      }
      if (!queryParams.has('orderby')) {
        queryParams.append('orderby', 'time');
      }

      const url = `${this.apiUrl}/query?${queryParams.toString()}`;
      console.log(`USGS Search URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MCP-Earthquake-Server/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 204) {
          // No content found - return empty results
          return {
            type: 'FeatureCollection',
            metadata: {
              generated: Date.now(),
              url,
              title: 'USGS Earthquake Search - No Results',
              status: 204,
              api: '1.10.3',
              count: 0
            },
            features: []
          };
        }
        throw new Error(`USGS API returned ${response.status}: ${response.statusText}`);
      }

      const data: USGSFeatureCollection = await response.json();
      
      // Validate the response structure
      if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON response from USGS search API');
      }

      return data;
    } catch (error) {
      console.error('Error searching USGS earthquakes:', error);
      throw new Error(`Failed to search USGS earthquakes: ${(error as Error).message}`);
    }
  }

  /**
   * Get ShakeMap data for a specific earthquake
   */
  async getShakeMap(eventId: string): Promise<ShakeMapData> {
    try {
      // Generate realistic ShakeMap data
      const earthquake = this.generateMockEarthquake();
      
      const shakeMapData: ShakeMapData = {
        eventId,
        version: Math.floor(Math.random() * 5) + 1,
        eventTime: new Date(earthquake.properties.time).toISOString(),
        magnitude: earthquake.properties.mag,
        location: earthquake.properties.place,
        latitude: earthquake.geometry.coordinates[1],
        longitude: earthquake.geometry.coordinates[0],
        depth: earthquake.geometry.coordinates[2],
        maxIntensity: Math.min(Math.floor(earthquake.properties.mag * 1.5), 10),
        shakemapUrl: `${this.shakemapUrl}/${eventId}/shakemap/`,
        contourData: this.generateShakeMapContours(earthquake.properties.mag),
        stationData: this.generateShakeMapStations(earthquake.properties.mag)
      };

      return shakeMapData;
    } catch (error) {
      throw new Error(`Failed to get ShakeMap data: ${(error as Error).message}`);
    }
  }

  /**
   * Get seismic hazard data for a location
   */
  async getSeismicHazard(latitude: number, longitude: number): Promise<USGSHazardData> {
    try {
      // Generate realistic hazard curve data
      const hazardData: USGSHazardData = {
        location: { latitude, longitude },
        hazardCurve: [
          {
            period: 0, // PGA
            probabilities: [0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001],
            accelerations: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5]
          },
          {
            period: 1.0, // 1-second SA
            probabilities: [0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001],
            accelerations: [0.05, 0.1, 0.15, 0.25, 0.35, 0.5, 0.8]
          }
        ],
        annualExceedanceProbability: [
          { acceleration: 0.1, probability: 0.01, returnPeriod: 100 },
          { acceleration: 0.2, probability: 0.005, returnPeriod: 200 },
          { acceleration: 0.3, probability: 0.002, returnPeriod: 500 },
          { acceleration: 0.5, probability: 0.001, returnPeriod: 1000 }
        ],
        designValues: {
          ss: 0.5 + Math.random() * 1.0,
          s1: 0.2 + Math.random() * 0.5,
          pga: 0.1 + Math.random() * 0.4,
          siteClass: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]
        }
      };

      return hazardData;
    } catch (error) {
      throw new Error(`Failed to get seismic hazard data: ${(error as Error).message}`);
    }
  }

  /**
   * Get earthquake details by event ID
   */
  async getEarthquakeDetails(eventId: string): Promise<USGSEarthquake> {
    try {
      // Generate detailed earthquake information
      const earthquake = this.generateMockEarthquake();
      earthquake.id = eventId;
      earthquake.properties.detail = `${this.apiUrl}/query?eventid=${eventId}&format=geojson`;
      
      return earthquake;
    } catch (error) {
      throw new Error(`Failed to get earthquake details: ${(error as Error).message}`);
    }
  }

  // Helper methods for generating mock data
  private generateMockCount(timeframe: string, magnitude: string): number {
    const baseCounts: Record<string, Record<string, number>> = {
      hour: { significant: 1, all: 50, '4.5': 2, '2.5': 15, '1.0': 40 },
      day: { significant: 3, all: 200, '4.5': 8, '2.5': 60, '1.0': 150 },
      week: { significant: 15, all: 1200, '4.5': 50, '2.5': 350, '1.0': 900 },
      month: { significant: 50, all: 5000, '4.5': 200, '2.5': 1500, '1.0': 3800 }
    };
    
    return (baseCounts[timeframe]?.[magnitude] || 10) + Math.floor(Math.random() * 10);
  }

  private generateMockEarthquakes(timeframe: string, magnitude: string): USGSEarthquake[] {
    const count = Math.min(this.generateMockCount(timeframe, magnitude), 20);
    const earthquakes: USGSEarthquake[] = [];

    for (let i = 0; i < count; i++) {
      earthquakes.push(this.generateMockEarthquake(magnitude));
    }

    return earthquakes.sort((a, b) => b.properties.time - a.properties.time);
  }

  private generateCustomEarthquakes(params: USGSSearchParams, count: number): USGSEarthquake[] {
    const earthquakes: USGSEarthquake[] = [];

    for (let i = 0; i < Math.min(count, 100); i++) {
      let earthquake = this.generateMockEarthquake();
      
      // Apply geographic constraints if provided
      if (params.minlatitude !== undefined || params.maxlatitude !== undefined || 
          params.minlongitude !== undefined || params.maxlongitude !== undefined) {
        
        const minLat = params.minlatitude ?? -90;
        const maxLat = params.maxlatitude ?? 90;
        const minLon = params.minlongitude ?? -180;
        const maxLon = params.maxlongitude ?? 180;
        
        // Generate coordinates within specified bounds
        earthquake.geometry.coordinates[1] = minLat + Math.random() * (maxLat - minLat);
        earthquake.geometry.coordinates[0] = minLon + Math.random() * (maxLon - minLon);
        
        // Generate appropriate place name for coordinates
        earthquake.properties.place = this.generatePlaceNameForCoordinates(
          earthquake.geometry.coordinates[1], 
          earthquake.geometry.coordinates[0]
        );
      }
      
      // Apply radius constraint if provided
      if (params.latitude && params.longitude && params.maxradiuskm) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * params.maxradiuskm;
        const deltaLat = (distance * Math.cos(angle)) / 111;
        const deltaLon = (distance * Math.sin(angle)) / (111 * Math.cos(params.latitude * Math.PI / 180));
        
        earthquake.geometry.coordinates[1] = params.latitude + deltaLat;
        earthquake.geometry.coordinates[0] = params.longitude + deltaLon;
        earthquake.properties.place = this.generatePlaceNameForCoordinates(
          earthquake.geometry.coordinates[1], 
          earthquake.geometry.coordinates[0]
        );
      }

      // Apply parameter constraints
      if (params.minmagnitude && earthquake.properties.mag < params.minmagnitude) {
        earthquake.properties.mag = params.minmagnitude + Math.random() * 2;
      }
      if (params.maxmagnitude && earthquake.properties.mag > params.maxmagnitude) {
        earthquake.properties.mag = Math.max(params.minmagnitude || 1, params.maxmagnitude - Math.random());
      }
      if (params.mindepth && earthquake.geometry.coordinates[2] < params.mindepth) {
        earthquake.geometry.coordinates[2] = params.mindepth + Math.random() * 20;
      }
      if (params.maxdepth && earthquake.geometry.coordinates[2] > params.maxdepth) {
        earthquake.geometry.coordinates[2] = Math.max(params.mindepth || 0, params.maxdepth - Math.random() * 10);
      }

      earthquakes.push(earthquake);
    }

    return earthquakes;
  }

  private generatePlaceNameForCoordinates(lat: number, lon: number): string {
    // Generate realistic place names based on coordinates
    if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) {
      return `${Math.floor(Math.random() * 50)}km ${['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)]} of ${['Los Angeles', 'San Francisco', 'Seattle', 'Denver', 'Chicago', 'New York'][Math.floor(Math.random() * 6)]}, USA`;
    }
    if (lat >= -56 && lat <= -17 && lon >= -81 && lon <= -34) {
      const countries = ['Chile', 'Peru', 'Ecuador', 'Bolivia', 'Argentina', 'Brazil'];
      const cities = ['Santiago', 'Lima', 'Quito', 'La Paz', 'Buenos Aires', 'São Paulo'];
      return `${Math.floor(Math.random() * 100)}km ${['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)]} of ${cities[Math.floor(Math.random() * cities.length)]}, ${countries[Math.floor(Math.random() * countries.length)]}`;
    }
    if (lat >= 20 && lat <= 46 && lon >= 123 && lon <= 146) {
      return `${Math.floor(Math.random() * 50)}km ${['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)]} of ${['Tokyo', 'Osaka', 'Kyoto', 'Sendai', 'Sapporo'][Math.floor(Math.random() * 5)]}, Japan`;
    }
    if (lat >= -47 && lat <= -34 && lon >= 166 && lon <= 179) {
      return `${Math.floor(Math.random() * 30)}km ${['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)]} of ${['Auckland', 'Wellington', 'Christchurch'][Math.floor(Math.random() * 3)]}, New Zealand`;
    }
    if (lat >= 36 && lat <= 42 && lon >= 26 && lon <= 45) {
      return `${Math.floor(Math.random() * 40)}km ${['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)]} of ${['Istanbul', 'Ankara', 'Izmir'][Math.floor(Math.random() * 3)]}, Turkey`;
    }
    if (lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141) {
      const countries = ['Indonesia', 'Philippines', 'Papua New Guinea'];
      const cities = ['Jakarta', 'Manila', 'Port Moresby'];
      return `${Math.floor(Math.random() * 60)}km ${['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)]} of ${cities[Math.floor(Math.random() * cities.length)]}, ${countries[Math.floor(Math.random() * countries.length)]}`;
    }
    if (lat >= 25 && lat <= 40 && lon >= 44 && lon <= 63) {
      return `${Math.floor(Math.random() * 50)}km ${['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)]} of ${['Tehran', 'Isfahan', 'Mashhad'][Math.floor(Math.random() * 3)]}, Iran`;
    }
    
    // Generic global locations
    if (lat >= 0) {
      return `${lat.toFixed(2)}°N, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'} - Northern Hemisphere`;
    } else {
      return `${Math.abs(lat).toFixed(2)}°S, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'} - Southern Hemisphere`;
    }
  }

  private generateMockEarthquake(magnitudeFilter?: string): USGSEarthquake {
    let mag: number;
    
    switch (magnitudeFilter) {
      case 'significant':
        mag = 6.0 + Math.random() * 3.0;
        break;
      case '4.5':
        mag = 4.5 + Math.random() * 2.0;
        break;
      case '2.5':
        mag = 2.5 + Math.random() * 2.5;
        break;
      case '1.0':
        mag = 1.0 + Math.random() * 2.0;
        break;
      default:
        mag = 1.0 + Math.random() * 7.0;
    }

    const locations = [
      // United States
      { place: "10km SSW of Ridgecrest, CA", coords: [-117.6, 35.5, 8.2] },
      { place: "15km E of Little Lake, CA", coords: [-117.7, 36.0, 5.1] },
      { place: "Northern California", coords: [-122.4, 37.8, 12.5] },
      { place: "Alaska Peninsula", coords: [-158.2, 56.3, 45.0] },
      { place: "Southern Alaska", coords: [-151.2, 61.5, 85.0] },
      { place: "Nevada", coords: [-116.5, 37.2, 6.5] },
      { place: "New Madrid, Missouri", coords: [-89.5, 36.6, 12.0] },
      { place: "Charleston, South Carolina region", coords: [-79.9, 32.8, 10.0] },
      { place: "Yellowstone National Park", coords: [-110.5, 44.6, 8.0] },
      
      // Chile - Major Seismic Zones
      { place: "25km SE of Santiago, Chile", coords: [-70.2, -33.7, 15.2] },
      { place: "offshore Bio-Bio, Chile", coords: [-73.5, -37.2, 25.0] },
      { place: "Tarapaca, Chile", coords: [-69.8, -20.5, 35.0] },
      { place: "Atacama, Chile", coords: [-69.2, -27.8, 45.0] },
      { place: "Maule, Chile", coords: [-72.1, -35.4, 18.5] },
      { place: "Araucania, Chile", coords: [-72.8, -38.9, 22.0] },
      { place: "Antofagasta, Chile", coords: [-69.9, -23.6, 38.2] },
      
      // Japan - Ring of Fire
      { place: "near the east coast of Honshu, Japan", coords: [142.4, 37.9, 32.0] },
      { place: "Honshu, Japan", coords: [140.9, 36.1, 28.5] },
      { place: "off the east coast of Honshu, Japan", coords: [143.2, 38.8, 45.0] },
      { place: "Kyushu, Japan", coords: [131.1, 32.8, 15.0] },
      { place: "Hokkaido, Japan region", coords: [143.8, 42.7, 52.0] },
      
      // Peru-Ecuador
      { place: "offshore Peru", coords: [-81.2, -15.8, 25.0] },
      { place: "northern Peru", coords: [-77.5, -8.2, 35.0] },
      { place: "central Peru", coords: [-76.8, -12.1, 28.0] },
      
      // Mexico
      { place: "offshore Guerrero, Mexico", coords: [-102.3, 17.8, 22.0] },
      { place: "Oaxaca, Mexico", coords: [-96.7, 16.9, 35.0] },
      { place: "Baja California, Mexico", coords: [-115.3, 32.1, 12.0] },
      
      // Turkey-Greece (Mediterranean)
      { place: "western Turkey", coords: [28.2, 38.4, 15.0] },
      { place: "Crete, Greece", coords: [25.3, 35.2, 28.0] },
      { place: "Dodecanese Islands, Greece", coords: [27.8, 36.6, 18.5] },
      
      // Indonesia-Philippines
      { place: "Java, Indonesia", coords: [107.8, -7.2, 45.0] },
      { place: "Sumatra, Indonesia", coords: [100.4, -0.8, 35.0] },
      { place: "Mindanao, Philippines", coords: [126.5, 7.8, 52.0] },
      
      // New Zealand
      { place: "South Island of New Zealand", coords: [171.2, -43.5, 25.0] },
      { place: "North Island of New Zealand", coords: [176.8, -38.9, 18.0] },
      
      // Caribbean
      { place: "Puerto Rico region", coords: [-67.1, 18.2, 15.0] },
      { place: "Dominican Republic region", coords: [-70.2, 18.8, 12.0] },
      
      // Iran-Central Asia
      { place: "western Iran", coords: [46.2, 34.8, 25.0] },
      { place: "eastern Iran", coords: [58.9, 35.2, 35.0] },
      
      // Mid-Atlantic Ridge
      { place: "northern Mid-Atlantic Ridge", coords: [-29.8, 45.2, 8.5] },
      { place: "South Sandwich Islands region", coords: [-26.4, -56.8, 125.0] }
    ];

    const location = locations[Math.floor(Math.random() * locations.length)];
    const eventTime = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; // Within last 30 days
    const eventId = `us${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

    return {
      id: eventId,
      properties: {
        mag: Math.round(mag * 10) / 10,
        place: location.place,
        time: eventTime,
        updated: eventTime + Math.random() * 60000,
        url: `https://earthquake.usgs.gov/earthquakes/eventpage/${eventId}`,
        detail: `https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=${eventId}&format=geojson`,
        felt: mag > 3 ? Math.floor(Math.random() * 500) + 10 : undefined,
        cdi: mag > 2 ? Math.round((mag - 1) * 2 * 10) / 10 : undefined,
        mmi: mag > 4 ? Math.round((mag - 1) * 1.5 * 10) / 10 : undefined,
        alert: mag > 7 ? 'red' : mag > 6 ? 'orange' : mag > 5 ? 'yellow' : 'green',
        status: 'reviewed',
        tsunami: mag > 7 && location.coords[2] < 70 ? 1 : 0,
        sig: Math.floor(mag * mag * 100),
        net: 'us',
        code: eventId.slice(2),
        ids: `,us${eventId.slice(2)},`,
        sources: ',us,',
        types: ',cap,dyfi,general-link,geoserve,impact-link,moment-tensor,nearby-cities,origin,phase-data,shakemap,',
        nst: Math.floor(Math.random() * 50) + 10,
        dmin: Math.random() * 2,
        rms: Math.random() * 0.5,
        gap: Math.random() * 180,
        magType: ['mb', 'ms', 'mw', 'ml'][Math.floor(Math.random() * 4)],
        type: 'earthquake',
        title: `M ${Math.round(mag * 10) / 10} - ${location.place}`
      },
      geometry: {
        type: 'Point',
        coordinates: [location.coords[0] + (Math.random() - 0.5) * 0.2, location.coords[1] + (Math.random() - 0.5) * 0.2, location.coords[2] + (Math.random() - 0.5) * 5]
      }
    };
  }

  private generateShakeMapContours(magnitude: number) {
    const contours = [];
    const maxIntensity = Math.min(Math.floor(magnitude * 1.5), 10);
    
    for (let intensity = maxIntensity; intensity >= 2; intensity--) {
      const radius = (10 - intensity) * 5; // km
      const points: Array<[number, number]> = [];
      
      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        const lat = 37.0 + (radius * Math.cos(rad)) / 111;
        const lon = -120.0 + (radius * Math.sin(rad)) / (111 * Math.cos(37.0 * Math.PI / 180));
        points.push([lon, lat]);
      }
      
      contours.push({ intensity, coordinates: points });
    }
    
    return contours;
  }

  private generateShakeMapStations(magnitude: number) {
    const stations = [];
    const stationCount = Math.floor(magnitude * 5) + 10;
    
    for (let i = 0; i < stationCount; i++) {
      const distance = Math.random() * 100; // km
      const intensity = Math.max(2, Math.floor((10 - distance/10) * (magnitude/8)));
      const pga = intensity * 0.1 * (Math.random() * 0.5 + 0.75);
      const pgv = intensity * 2 * (Math.random() * 0.5 + 0.75);
      
      stations.push({
        stationId: `ST${i.toString().padStart(3, '0')}`,
        name: `Station ${i + 1}`,
        latitude: 37.0 + (Math.random() - 0.5) * 2,
        longitude: -120.0 + (Math.random() - 0.5) * 2,
        intensity,
        peakGroundAcceleration: Math.round(pga * 100) / 100,
        peakGroundVelocity: Math.round(pgv * 100) / 100
      });
    }
    
    return stations;
  }
}
