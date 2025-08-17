import axios, { AxiosResponse } from "axios";

/**
 * IRIS Data Provider
 * 
 * Interfaces with IRIS (Incorporated Research Institutions for Seismology)
 * web services to fetch earthquake catalogs, waveform data, and station information.
 * 
 * IRIS Web Services: https://service.iris.edu/
 */

export interface EarthquakeEvent {
  eventId: string;
  time: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  magnitudeType: string;
  location: string;
  source: string;
  status: string;
}

export interface SeismicStation {
  network: string;
  station: string;
  location: string;
  channel: string;
  latitude: number;
  longitude: number;
  elevation: number;
  depth: number;
  azimuth: number;
  dip: number;
  instrument: string;
  startTime: string;
  endTime?: string;
}

export interface WaveformData {
  eventId: string;
  network: string;
  station: string;
  channel: string;
  startTime: string;
  endTime: string;
  sampleRate: number;
  samples: number[];
  duration: number;
  peakAmplitude: number;
  rmsAmplitude: number;
  quality: string;
}

export interface CatalogOptions {
  region?: string;
  startTime: string;
  endTime: string;
  minMagnitude: number;
  maxMagnitude?: number;
  minDepth?: number;
  maxDepth?: number;
  latitude?: number;
  longitude?: number;
  maxRadius?: number;
  limit?: number;
}

export interface RealtimeOptions {
  minMagnitude: number;
  timeWindow: number; // hours
  format?: "text" | "xml";
}

export interface WaveformOptions {
  eventId: string;
  network: string;
  station: string;
  channel: string;
  startTime: string;
  endTime: string;
  quality?: "B" | "M" | "Q" | "R"; // Best, Medium, Quality controlled, Raw
}

export class IrisDataProvider {
  private readonly baseUrl = "https://service.iris.edu";
  private readonly fdsnEvent = `${this.baseUrl}/fdsnws/event/1`;
  private readonly fdsnStation = `${this.baseUrl}/fdsnws/station/1`;
  private readonly fdsnDataSelect = `${this.baseUrl}/fdsnws/dataselect/1`;
  private readonly irisWs = `${this.baseUrl}/irisws`;

  /**
   * Fetch earthquake catalog from IRIS FDSN Event service
   */
  async getEarthquakeCatalog(options: CatalogOptions): Promise<EarthquakeEvent[]> {
    try {
      const params = new URLSearchParams({
        format: "text",
        starttime: options.startTime,
        endtime: options.endTime,
        minmagnitude: options.minMagnitude.toString(),
        ...(options.maxMagnitude && { maxmagnitude: options.maxMagnitude.toString() }),
        ...(options.minDepth && { mindepth: options.minDepth.toString() }),
        ...(options.maxDepth && { maxdepth: options.maxDepth.toString() }),
        ...(options.latitude && { latitude: options.latitude.toString() }),
        ...(options.longitude && { longitude: options.longitude.toString() }),
        ...(options.maxRadius && { maxradius: options.maxRadius.toString() }),
        ...(options.limit && { limit: options.limit.toString() }),
        orderby: "time-asc"
      });

      const response: AxiosResponse = await axios.get(`${this.fdsnEvent}/query`, { params });
      
      if (!response.data || typeof response.data !== 'string') {
        return [];
      }

      // Parse IRIS text format response
      // Format: EventID|Time|Latitude|Longitude|Depth/km|Author|Catalog|Contributor|ContributorID|MagType|Magnitude|MagAuthor|EventLocationName
      const lines = response.data.trim().split('\n').filter((line: string) => !line.startsWith('#'));
      
      const events: EarthquakeEvent[] = [];
      
      for (const line of lines) {
        const fields = line.split('|');
        if (fields.length >= 11) {
          events.push({
            eventId: fields[0] || '',
            time: fields[1] || '',
            latitude: parseFloat(fields[2]) || 0,
            longitude: parseFloat(fields[3]) || 0,
            depth: parseFloat(fields[4]) || 0,
            magnitude: parseFloat(fields[10]) || 0,
            magnitudeType: fields[9] || 'unknown',
            location: fields[12] || 'Unknown location',
            source: fields[7] || 'IRIS',
            status: 'reviewed'
          });
        }
      }
      
      return events;
    } catch (error) {
      console.error("Error fetching IRIS earthquake catalog:", error);
      throw new Error(`Failed to fetch earthquake catalog: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch real-time earthquake feed
   */
  async getRealtimeEarthquakes(options: RealtimeOptions): Promise<EarthquakeEvent[]> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (options.timeWindow * 60 * 60 * 1000));

      const catalogOptions: CatalogOptions = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        minMagnitude: options.minMagnitude,
        limit: 1000
      };

      return await this.getEarthquakeCatalog(catalogOptions);
    } catch (error) {
      console.error("Error fetching real-time earthquakes:", error);
      throw new Error(`Failed to fetch real-time earthquakes: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch seismic station information
   */
  async getStations(options: {
    network?: string;
    station?: string;
    latitude?: number;
    longitude?: number;
    maxRadius?: number;
    startTime?: string;
    endTime?: string;
    channel?: string;
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  }): Promise<SeismicStation[]> {
    try {
      const params = new URLSearchParams({
        format: "text",
        level: "channel",
        ...(options.network && { network: options.network }),
        ...(options.station && { station: options.station }),
        ...(options.latitude && { latitude: options.latitude.toString() }),
        ...(options.longitude && { longitude: options.longitude.toString() }),
        ...(options.maxRadius && { maxradius: options.maxRadius.toString() }),
        ...(options.startTime && { starttime: options.startTime }),
        ...(options.endTime && { endtime: options.endTime }),
        ...(options.channel && { channel: options.channel }),
        ...(options.minLatitude && { minlatitude: options.minLatitude.toString() }),
        ...(options.maxLatitude && { maxlatitude: options.maxLatitude.toString() }),
        ...(options.minLongitude && { minlongitude: options.minLongitude.toString() }),
        ...(options.maxLongitude && { maxlongitude: options.maxLongitude.toString() })
      });

      const response: AxiosResponse = await axios.get(`${this.fdsnStation}/query`, { params });
      
      const lines = response.data.split('\n').filter((line: string) => line && !line.startsWith('#'));
      
      return lines.map((line: string): SeismicStation => {
        const fields = line.split('|');
        return {
          network: fields[0],
          station: fields[1],
          location: fields[2],
          channel: fields[3],
          latitude: parseFloat(fields[4]),
          longitude: parseFloat(fields[5]),
          elevation: parseFloat(fields[6]),
          depth: parseFloat(fields[7]),
          azimuth: parseFloat(fields[8]),
          dip: parseFloat(fields[9]),
          instrument: fields[10],
          startTime: fields[15],
          endTime: fields[16] || undefined
        };
      });
    } catch (error) {
      console.error("Error fetching IRIS stations:", error);
      throw new Error(`Failed to fetch station information: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch real waveform data using miniSEED parser
   */
  async getWaveformData(options: WaveformOptions): Promise<WaveformData> {
    try {
      // Use Python miniSEED parser to fetch real waveform data from IRIS FDSN
      const { spawn } = await import('child_process');
      const path = await import('path');
      const fs = await import('fs');
      const { fileURLToPath } = await import('url');
      
      // Get the current module directory (ES module equivalent of __dirname)
      const thisDir = path.dirname(fileURLToPath(import.meta.url));
      
      // Determine location code - use '00' as default if not specified
      const location = options.channel.includes('.') ? 
        options.channel.split('.')[0] : '00';
      const channelCode = options.channel.includes('.') ? 
        options.channel.split('.')[1] : options.channel;
      
      // Find the miniSEED parser script - try multiple locations
      let pythonScript: string;
      
      // Try 1: Current working directory (when running tests)
      const cwdScript = path.join(process.cwd(), 'miniseed_parser.py');
      
      // Try 2: Module directory (when running as built MCP server)
      const moduleDir = path.dirname(path.dirname(thisDir)); // Go up from dist/providers to project root
      const moduleScript = path.join(moduleDir, 'miniseed_parser.py');
      
      // Try 3: Same directory as this file
      const localScript = path.join(thisDir, '..', '..', 'miniseed_parser.py');
      
      if (fs.existsSync(cwdScript)) {
        pythonScript = cwdScript;
      } else if (fs.existsSync(moduleScript)) {
        pythonScript = moduleScript;
      } else if (fs.existsSync(localScript)) {
        pythonScript = localScript;
      } else {
        throw new Error(`miniSEED parser script not found. Tried:\n  ${cwdScript}\n  ${moduleScript}\n  ${localScript}`);
      }
      
      const args = [
        pythonScript,
        '--network', options.network,
        '--station', options.station,
        '--location', location,
        '--channel', channelCode,
        '--start', options.startTime,
        '--end', options.endTime,
        '--quality', 'B'  // Best quality data
      ];
      
      // Execute Python miniSEED parser
      const result = await new Promise<string>((resolve, reject) => {
        const python = spawn('python', args, { 
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: process.cwd()
        });
        
        let stdout = '';
        let stderr = '';
        
        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        python.on('close', (code) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`Python parser failed with code ${code}: ${stderr}`));
          }
        });
        
        python.on('error', (error) => {
          reject(new Error(`Failed to spawn Python process: ${error.message}`));
        });
        
        // Timeout after 2 minutes
        setTimeout(() => {
          python.kill();
          reject(new Error('Python parser timed out'));
        }, 120000);
      });
      
      // Parse JSON result from Python
      const parsedResult = JSON.parse(result);
      
      if (!parsedResult.success) {
        // Handle specific error cases
        if (parsedResult.error === 'no-data-available' || parsedResult.error === 'http-404') {
          return {
            eventId: options.eventId,
            network: options.network,
            station: options.station,
            channel: options.channel,
            startTime: options.startTime,
            endTime: options.endTime,
            sampleRate: 0,
            samples: [],
            duration: (new Date(options.endTime).getTime() - new Date(options.startTime).getTime()) / 1000,
            peakAmplitude: 0,
            rmsAmplitude: 0,
            quality: "no-data-available"
          };
        } else {
          throw new Error(`miniSEED parsing failed: ${parsedResult.message || parsedResult.error}`);
        }
      }
      
      // Return real waveform data parsed from miniSEED
      return {
        eventId: options.eventId,
        network: parsedResult.network,
        station: parsedResult.station,
        channel: parsedResult.channel,
        startTime: parsedResult.starttime,
        endTime: parsedResult.endtime,
        sampleRate: parsedResult.sampling_rate,
        samples: parsedResult.samples, // Real seismic data samples!
        duration: parsedResult.duration,
        peakAmplitude: parsedResult.peak_amplitude,
        rmsAmplitude: parsedResult.rms_amplitude,
        quality: parsedResult.format // "real-miniseed"
      };
      
    } catch (error) {
      console.error("Error fetching IRIS waveform data:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error(`Invalid waveform parameters: Check network=${options.network}, station=${options.station}, channel=${options.channel}, time range=${options.startTime} to ${options.endTime}`);
        } else if (error.response?.status === 404) {
          throw new Error(`No waveform data available for ${options.network}.${options.station}.${options.channel} during specified time period`);
        } else if (error.response?.status === 204) {
          throw new Error(`No data returned for ${options.network}.${options.station}.${options.channel} - station may be offline or no data exists for time period`);
        }
      }
      throw new Error(`Failed to fetch waveform data: ${(error as Error).message}`);
    }
  }

  /**
   * Get event details by event ID
   */
  async getEventDetails(eventId: string): Promise<EarthquakeEvent | null> {
    try {
      const params = new URLSearchParams({
        format: "text",
        eventid: eventId
      });

      const response: AxiosResponse = await axios.get(`${this.fdsnEvent}/query`, { params });
      
      if (!response.data || typeof response.data !== 'string') {
        return null;
      }

      const lines = response.data.trim().split('\n').filter((line: string) => !line.startsWith('#'));
      if (lines.length === 0) {
        return null;
      }

      const fields = lines[0].split('|');
      if (fields.length < 11) {
        return null;
      }
      return {
        eventId: fields[0] || '',
        time: fields[1] || '',
        latitude: parseFloat(fields[2]) || 0,
        longitude: parseFloat(fields[3]) || 0,
        depth: parseFloat(fields[4]) || 0,
        magnitude: parseFloat(fields[10]) || 0,
        magnitudeType: fields[9] || 'unknown',
        location: fields[12] || 'Unknown location',
        source: fields[7] || 'IRIS',
        status: 'reviewed'
      };
    } catch (error) {
      console.error("Error fetching event details:", error);
      throw new Error(`Failed to fetch event details: ${(error as Error).message}`);
    }
  }

  /**
   * Search for events near a specific location
   */
  async getEventsNearLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number, 
    options: {
      startTime: string;
      endTime: string;
      minMagnitude?: number;
      maxMagnitude?: number;
      limit?: number;
    }
  ): Promise<EarthquakeEvent[]> {
    const catalogOptions: CatalogOptions = {
      ...options,
      latitude,
      longitude,
      maxRadius: radiusKm,
      minMagnitude: options.minMagnitude || 2.0
    };

    return await this.getEarthquakeCatalog(catalogOptions);
  }
}
