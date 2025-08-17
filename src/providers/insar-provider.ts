import axios, { AxiosResponse } from "axios";

/**
 * InSAR Data Provider
 * 
 * Interfaces with InSAR (Interferometric Synthetic Aperture Radar) data sources
 * to fetch ground deformation measurements for earthquake monitoring and analysis.
 * 
 * Data sources include:
 * - ESA Copernicus Sentinel-1
 * - JPL Advanced Rapid Imaging and Analysis (ARIA)
 * - NASA NISAR (future)
 * - ASF DAAC (Alaska Satellite Facility)
 * - COMET-LiCS (University of Leeds)
 */

export interface InSARProduct {
  productId: string;
  mission: "Sentinel-1A" | "Sentinel-1B" | "ALOS-2" | "TerraSAR-X" | "COSMO-SkyMed";
  acquisitionDate: string;
  processingDate: string;
  track: number;
  frame: number;
  pass: "ascending" | "descending";
  polarization: "VV" | "VH" | "HH" | "HV";
  swath: string;
  boundingBox: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  status: "available" | "processing" | "archived";
  downloadUrl?: string;
}

export interface InSARInterferogram {
  interferogramId: string;
  primaryDate: string;
  secondaryDate: string;
  temporalBaseline: number; // days
  perpendicularBaseline: number; // meters
  coherence: number; // 0-1
  unwrappingQuality: "excellent" | "good" | "fair" | "poor";
  deformationData: {
    maxDeformation: number; // mm
    minDeformation: number; // mm
    averageDeformation: number; // mm
    standardDeviation: number; // mm
  };
  coverage: {
    validPixels: number;
    totalPixels: number;
    coveragePercentage: number;
  };
  processing: {
    processor: string;
    version: string;
    method: "SBAS" | "PSI" | "StaMPS" | "ISCE";
    referencePoint: { latitude: number; longitude: number };
  };
}

export interface DeformationTimeSeries {
  location: { latitude: number; longitude: number };
  timeRange: { start: string; end: string };
  measurements: Array<{
    date: string;
    displacement: number; // mm (line-of-sight)
    velocity: number; // mm/year
    error: number; // mm
    coherence: number;
    atmosphericCorrection: boolean;
  }>;
  trend: {
    linearVelocity: number; // mm/year
    acceleration: number; // mm/year²
    seasonalAmplitude: number; // mm
    confidence: number; // 0-1
  };
  quality: {
    temporalCoherence: number;
    spatialConsistency: number;
    atmosphericArtifacts: "low" | "medium" | "high";
    overallQuality: "excellent" | "good" | "fair" | "poor";
  };
}

export interface CoSeismicDeformation {
  eventId: string;
  earthquakeDate: string;
  magnitude: number;
  faultGeometry: {
    strike: number;
    dip: number;
    rake: number;
    length: number; // km
    width: number; // km
    depth: number; // km
  };
  deformationField: {
    maxUplift: number; // mm
    maxSubsidence: number; // mm
    maxHorizontal: number; // mm
    affectedArea: number; // km²
    deformationPattern: "thrust" | "normal" | "strike-slip" | "oblique";
  };
  modelFit: {
    rms: number; // mm
    correlation: number; // 0-1
    residuals: "low" | "medium" | "high";
  };
}

export interface InSARSearchOptions {
  region?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
  mission?: string;
  track?: number;
  pass?: "ascending" | "descending";
  processingLevel?: "L1" | "L2" | "L3";
}

export interface DeformationAnalysisOptions {
  location: { latitude: number; longitude: number };
  radius: number; // km
  timeWindow: number; // days
  velocityThreshold: number; // mm/year
  coherenceThreshold: number; // 0-1
  method: "SBAS" | "PSI" | "StaMPS";
}

export class InSARDataProvider {
  private readonly asf_daac_url = "https://api.daac.asf.alaska.edu";
  private readonly asf_search_url = "https://api.daac.asf.alaska.edu/services/search/param";
  private readonly comet_lics_url = "https://comet.nerc.ac.uk/COMET-LiCS-portal";
  private readonly aria_url = "https://aria.jpl.nasa.gov/products";
  private readonly esa_scihub_url = "https://apihub.copernicus.eu/apihub";
  
  // Regional processing centers
  private readonly regionalCenters = {
    europe: "ESA Copernicus",
    northAmerica: "ASF DAAC",
    asia: "JAXA ALOS",
    global: "COMET-LiCS"
  };

  /**
   * Search for InSAR products using ASF DAAC Sentinel-1 data (no API key required)
   */
  async searchProducts(options: InSARSearchOptions): Promise<InSARProduct[]> {
    try {
      const params = new URLSearchParams();
      
      // Set platform to Sentinel-1 (free access via ASF DAAC)
      params.append('platform', 'Sentinel-1A,Sentinel-1B');
      params.append('processingLevel', options.processingLevel || 'SLC');
      params.append('output', 'jsonlite');
      
      // Date range
      if (options.dateRange.start) {
        params.append('start', options.dateRange.start);
      }
      if (options.dateRange.end) {
        params.append('end', options.dateRange.end);
      }
      
      // Geographic bounds
      if (options.region) {
        const bbox = `${options.region.west},${options.region.south},${options.region.east},${options.region.north}`;
        params.append('bbox', bbox);
      }
      
      // Track/pass filters
      if (options.track) {
        params.append('relativeOrbit', options.track.toString());
      }
      if (options.pass) {
        params.append('flightDirection', options.pass.toUpperCase());
      }
      
      console.log(`Searching ASF DAAC for Sentinel-1 products: ${this.asf_search_url}?${params.toString()}`);
      
      const response: AxiosResponse = await axios.get(this.asf_search_url, {
        params: params,
        headers: {
          'User-Agent': 'MCP-Earthquake-Server/1.0'
        },
        timeout: 30000
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('ASF DAAC returned no results or invalid format');
        return [];
      }
      
      // Parse ASF DAAC results into InSARProduct format
      const products: InSARProduct[] = response.data.map((item: any) => {
        const coords = item.coordinates || item.bbox;
        let boundingBox = { north: 90, south: -90, east: 180, west: -180 };
        
        if (coords) {
          // Parse coordinates - ASF DAAC provides different formats
          if (Array.isArray(coords) && coords.length >= 4) {
            boundingBox = {
              west: Math.min(...coords.filter((_, i) => i % 2 === 0)),
              east: Math.max(...coords.filter((_, i) => i % 2 === 0)),
              south: Math.min(...coords.filter((_, i) => i % 2 === 1)),
              north: Math.max(...coords.filter((_, i) => i % 2 === 1))
            };
          }
        }
        
        return {
          productId: item.granuleName || item.sceneName || item.fileName || 'unknown',
          mission: (item.platform || 'Sentinel-1A') as "Sentinel-1A" | "Sentinel-1B",
          acquisitionDate: item.startTime || item.acquisitionDate || item.sensingDate || new Date().toISOString(),
          processingDate: item.processingDate || item.ingestionDate || new Date().toISOString(),
          track: parseInt(item.relativeOrbit || item.track || '0'),
          frame: parseInt(item.frame || item.frameNumber || '0'),
          pass: (item.flightDirection || 'ascending').toLowerCase() as "ascending" | "descending",
          polarization: (item.polarization || 'VV') as "VV" | "VH" | "HH" | "HV",
          swath: item.swath || item.beam || 'IW',
          boundingBox,
          status: "available" as const,
          downloadUrl: item.downloadUrl || item.url || `https://search.asf.alaska.edu/#/?granule=${item.granuleName || item.sceneName}`
        };
      });
      
      console.log(`Found ${products.length} Sentinel-1 products from ASF DAAC`);
      return products.slice(0, 100); // Limit results to prevent overwhelming responses
      
    } catch (error) {
      console.error("Error searching ASF DAAC for InSAR products:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error(`Invalid search parameters for ASF DAAC: ${error.response.data}`);
        } else if (error.response?.status === 503) {
          throw new Error('ASF DAAC service temporarily unavailable');
        }
      }
      throw new Error(`Failed to search ASF DAAC for Sentinel-1 products: ${(error as Error).message}`);
    }
  }



  /**
   * Get default region for mission
   */
  private getDefaultRegionForMission(mission: string): { north: number; south: number; east: number; west: number } {
    // Return global coverage as default
    return {
      north: 85,
      south: -85,
      east: 180,
      west: -180
    };
  }

  /**
   * Get real download URL for mission data
   */
  private getRealDownloadUrl(mission: string, track: number): string {
    if (mission.includes("Sentinel")) {
      return `https://apihub.copernicus.eu/apihub/search?q=platformname:Sentinel-1 AND relativeorbitnumber:${track}`;
    } else if (mission === "ALOS-2") {
      return `https://www.eorc.jaxa.jp/ALOS/en/dataset/alos_dataset_e.htm`;
    } else {
      return `${this.asf_daac_url}/search?platform=${mission}&track=${track}`;
    }
  }

  /**
   * Generate interferogram information from two Sentinel-1 products via ASF DAAC
   * Returns metadata for interferogram that can be processed via ASF HyP3 or similar services
   */
  async generateInterferogram(
    primaryProductId: string, 
    secondaryProductId: string
  ): Promise<InSARInterferogram> {
    try {
      // Get metadata for both products from ASF DAAC
      const primaryMetadata = await this.getProductMetadata(primaryProductId);
      const secondaryMetadata = await this.getProductMetadata(secondaryProductId);
      
      if (!primaryMetadata || !secondaryMetadata) {
        throw new Error(`Cannot find metadata for products: ${primaryProductId}, ${secondaryProductId}`);
      }
      
      // Calculate temporal and perpendicular baselines
      const primaryDate = new Date(primaryMetadata.acquisitionDate);
      const secondaryDate = new Date(secondaryMetadata.acquisitionDate);
      const temporalBaseline = Math.abs((primaryDate.getTime() - secondaryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Estimate perpendicular baseline (simplified calculation)
      const perpendicularBaseline = Math.abs(primaryMetadata.track - secondaryMetadata.track) * 7.8; // Approximate for Sentinel-1
      
      // Estimate coherence based on temporal baseline and season
      let estimatedCoherence = 0.9;
      if (temporalBaseline > 12) estimatedCoherence = 0.7;
      if (temporalBaseline > 24) estimatedCoherence = 0.5;
      if (temporalBaseline > 48) estimatedCoherence = 0.3;
      
      // Create interferogram metadata
      const interferogram: InSARInterferogram = {
        interferogramId: `${primaryProductId}_${secondaryProductId}_IFG`,
        primaryDate: primaryMetadata.acquisitionDate,
        secondaryDate: secondaryMetadata.acquisitionDate,
        temporalBaseline: Math.round(temporalBaseline),
        perpendicularBaseline: Math.round(perpendicularBaseline),
        coherence: estimatedCoherence,
        unwrappingQuality: temporalBaseline < 12 ? "excellent" : temporalBaseline < 24 ? "good" : temporalBaseline < 48 ? "fair" : "poor",
        deformationData: {
          maxDeformation: 0, // Requires actual processing
          minDeformation: 0,
          averageDeformation: 0,
          standardDeviation: 0
        },
        coverage: {
          validPixels: 0,
          totalPixels: 0,
          coveragePercentage: estimatedCoherence * 100
        },
        processing: {
          processor: "ASF HyP3 (recommended)",
          version: "latest",
          method: "SBAS",
          referencePoint: {
            latitude: (primaryMetadata.boundingBox.north + primaryMetadata.boundingBox.south) / 2,
            longitude: (primaryMetadata.boundingBox.east + primaryMetadata.boundingBox.west) / 2
          }
        }
      };
      
      console.log(`Generated interferogram metadata for ${primaryProductId} -> ${secondaryProductId}`);
      console.log(`Temporal baseline: ${temporalBaseline} days, Estimated coherence: ${estimatedCoherence}`);
      console.log(`Processing recommendation: Use ASF HyP3 On-Demand service for actual interferogram generation`);
      
      return interferogram;
      
    } catch (error) {
      console.error("Error generating interferogram metadata:", error);
      throw new Error(`Failed to generate interferogram metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Get product metadata from ASF DAAC
   */
  private async getProductMetadata(productId: string): Promise<InSARProduct | null> {
    try {
      const params = new URLSearchParams({
        granule_list: productId,
        output: 'jsonlite'
      });
      
      const response = await axios.get(this.asf_search_url, {
        params,
        headers: { 'User-Agent': 'MCP-Earthquake-Server/1.0' },
        timeout: 15000
      });
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        return null;
      }
      
      const item = response.data[0];
      const coords = item.coordinates || item.bbox || [];
      
      let boundingBox = { north: 90, south: -90, east: 180, west: -180 };
      if (coords.length >= 4) {
        boundingBox = {
          west: Math.min(...coords.filter((_: any, i: number) => i % 2 === 0)),
          east: Math.max(...coords.filter((_: any, i: number) => i % 2 === 0)),
          south: Math.min(...coords.filter((_: any, i: number) => i % 2 === 1)),
          north: Math.max(...coords.filter((_: any, i: number) => i % 2 === 1))
        };
      }
      
      return {
        productId: item.granuleName || productId,
        mission: (item.platform || 'Sentinel-1A') as "Sentinel-1A" | "Sentinel-1B",
        acquisitionDate: item.startTime || new Date().toISOString(),
        processingDate: item.processingDate || new Date().toISOString(),
        track: parseInt(item.relativeOrbit || '0'),
        frame: parseInt(item.frame || '0'),
        pass: (item.flightDirection || 'ascending').toLowerCase() as "ascending" | "descending",
        polarization: (item.polarization || 'VV') as "VV",
        swath: item.swath || 'IW',
        boundingBox,
        status: "available",
        downloadUrl: item.downloadUrl || `https://search.asf.alaska.edu/#/?granule=${productId}`
      };
      
    } catch (error) {
      console.error(`Error fetching metadata for ${productId}:`, error);
      return null;
    }
  }

  /**
   * Get deformation time series guidance for a specific location using available data sources
   * Provides information on accessing real InSAR time series from COMET-LiCS or similar services
   */
  async getDeformationTimeSeries(options: DeformationAnalysisOptions): Promise<DeformationTimeSeries> {
    try {
      // Search for available Sentinel-1 products in the area
      const products = await this.searchProducts({
        region: {
          north: options.location.latitude + (options.radius / 111.0), // Convert km to degrees
          south: options.location.latitude - (options.radius / 111.0),
          east: options.location.longitude + (options.radius / (111.0 * Math.cos(options.location.latitude * Math.PI / 180))),
          west: options.location.longitude - (options.radius / (111.0 * Math.cos(options.location.latitude * Math.PI / 180)))
        },
        dateRange: {
          start: new Date(Date.now() - options.timeWindow * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      });
      
      console.log(`Found ${products.length} Sentinel-1 products for time series analysis`);
      
      // Create a realistic but informative time series response
      const timeRange = {
        start: new Date(Date.now() - options.timeWindow * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };
      
      // Generate measurement structure based on available products
      const measurements: Array<{
        date: string;
        displacement: number;
        velocity: number;
        error: number;
        coherence: number;
        atmosphericCorrection: boolean;
      }> = [];
      
      // Create entries for available acquisition dates
      for (const product of products.slice(0, 20)) { // Limit to 20 most recent
        measurements.push({
          date: product.acquisitionDate,
          displacement: 0, // Requires processing
          velocity: 0, // Requires processing
          error: 2.5, // Typical InSAR measurement error
          coherence: 0.7, // Estimated coherence
          atmosphericCorrection: false // Would require dedicated processing
        });
      }
      
      const timeSeries: DeformationTimeSeries = {
        location: options.location,
        timeRange,
        measurements,
        trend: {
          linearVelocity: 0, // Requires processing
          acceleration: 0,
          seasonalAmplitude: 0,
          confidence: products.length > 10 ? 0.8 : 0.5
        },
        quality: {
          temporalCoherence: products.length > 15 ? 0.8 : 0.6,
          spatialConsistency: 0.7,
          atmosphericArtifacts: "medium" as const,
          overallQuality: products.length > 15 ? "good" : "fair"
        }
      };
      
      console.log(`Time series structure created with ${measurements.length} potential measurements`);
      console.log(`Recommendation: Use COMET-LiCS portal or ASF HyP3 for processed time series data`);
      console.log(`Data sources: https://comet.nerc.ac.uk/COMET-LiCS-portal/ or https://hyp3-docs.asf.alaska.edu/`);
      
      return timeSeries;
      
    } catch (error) {
      console.error("Error getting deformation time series:", error);
      throw new Error(`Failed to analyze deformation time series potential: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze co-seismic deformation potential using ASF DAAC Sentinel-1 data
   * Identifies pre/post earthquake image pairs suitable for deformation analysis
   */
  async analyzeCoSeismicDeformation(
    eventId: string,
    earthquakeDate: string,
    magnitude: number,
    epicenter: { latitude: number; longitude: number }
  ): Promise<CoSeismicDeformation> {
    try {
      const eqDate = new Date(earthquakeDate);
      const searchRadius = Math.min(Math.max(magnitude * 20, 50), 200); // Scale search radius with magnitude
      
      // Search for pre-earthquake images (up to 30 days before)
      const preImages = await this.searchProducts({
        region: {
          north: epicenter.latitude + (searchRadius / 111.0),
          south: epicenter.latitude - (searchRadius / 111.0),
          east: epicenter.longitude + (searchRadius / (111.0 * Math.cos(epicenter.latitude * Math.PI / 180))),
          west: epicenter.longitude - (searchRadius / (111.0 * Math.cos(epicenter.latitude * Math.PI / 180)))
        },
        dateRange: {
          start: new Date(eqDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date(eqDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });
      
      // Search for post-earthquake images (up to 30 days after)
      const postImages = await this.searchProducts({
        region: {
          north: epicenter.latitude + (searchRadius / 111.0),
          south: epicenter.latitude - (searchRadius / 111.0),
          east: epicenter.longitude + (searchRadius / (111.0 * Math.cos(epicenter.latitude * Math.PI / 180))),
          west: epicenter.longitude - (searchRadius / (111.0 * Math.cos(epicenter.latitude * Math.PI / 180)))
        },
        dateRange: {
          start: new Date(eqDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date(eqDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });
      
      console.log(`Found ${preImages.length} pre-earthquake and ${postImages.length} post-earthquake Sentinel-1 images`);
      
      // Estimate deformation characteristics based on earthquake parameters
      const expectedMaxDeformation = this.estimateDeformationFromMagnitude(magnitude);
      
      // Determine likely fault geometry from magnitude and location
      const faultGeometry = this.estimateFaultGeometry(magnitude, epicenter);
      
      // Assess data availability for co-seismic analysis
      const hasGoodCoverage = preImages.length > 0 && postImages.length > 0;
      const dataQuality = hasGoodCoverage ? "good" : "limited";
      
      const coSeismicAnalysis: CoSeismicDeformation = {
        eventId,
        earthquakeDate,
        magnitude,
        faultGeometry,
        deformationField: {
          maxUplift: expectedMaxDeformation.uplift,
          maxSubsidence: expectedMaxDeformation.subsidence,
          maxHorizontal: expectedMaxDeformation.horizontal,
          affectedArea: Math.PI * Math.pow(searchRadius, 2),
          deformationPattern: this.getDeformationPattern(magnitude, faultGeometry)
        },
        modelFit: {
          rms: 0, // Requires processing
          correlation: hasGoodCoverage ? 0.7 : 0.3,
          residuals: hasGoodCoverage ? "medium" : "high"
        }
      };
      
      console.log(`Co-seismic deformation analysis prepared for M${magnitude} earthquake`);
      console.log(`Data coverage: ${dataQuality} (${preImages.length} pre, ${postImages.length} post)`);
      console.log(`Expected max deformation: ${expectedMaxDeformation.horizontal}mm horizontal`);
      
      if (hasGoodCoverage) {
        console.log(`Suitable image pairs available for interferometric analysis`);
        console.log(`Recommendation: Process via ASF HyP3 or COMET-LiCS for actual deformation maps`);
      } else {
        console.log(`Limited data coverage - consider longer time windows or alternative tracks`);
      }
      
      return coSeismicAnalysis;
      
    } catch (error) {
      console.error("Error analyzing co-seismic deformation:", error);
      throw new Error(`Failed to analyze co-seismic deformation potential: ${(error as Error).message}`);
    }
  }

  /**
   * Estimate deformation magnitude from earthquake magnitude
   */
  private estimateDeformationFromMagnitude(magnitude: number): {
    horizontal: number;
    uplift: number;
    subsidence: number;
  } {
    // Empirical relationships for surface deformation
    const baseFactor = Math.pow(10, (magnitude - 5) * 0.5);
    
    return {
      horizontal: Math.round(baseFactor * 100), // mm
      uplift: Math.round(baseFactor * 50), // mm  
      subsidence: Math.round(baseFactor * 30) // mm
    };
  }

  /**
   * Estimate fault geometry from earthquake parameters
   */
  private estimateFaultGeometry(magnitude: number, epicenter: { latitude: number; longitude: number }): {
    strike: number;
    dip: number;
    rake: number;
    length: number;
    width: number;
    depth: number;
  } {
    // Scaling relationships for fault dimensions
    const length = Math.pow(10, (magnitude - 5) * 0.5) * 10; // km
    const width = length * 0.6; // Typical aspect ratio
    
    return {
      strike: 0, // Requires detailed analysis
      dip: 90, // Assume vertical for simplicity
      rake: 0, // Assume strike-slip for simplicity
      length: Math.round(length),
      width: Math.round(width),
      depth: magnitude > 6 ? 10 : 5 // Typical depths
    };
  }

  /**
   * Determine deformation pattern from fault characteristics
   */
  private getDeformationPattern(
    magnitude: number, 
    faultGeometry: { dip: number; rake: number }
  ): "thrust" | "normal" | "strike-slip" | "oblique" {
    // Simplified classification based on rake angle
    if (Math.abs(faultGeometry.rake) < 30) return "strike-slip";
    if (faultGeometry.rake > 60) return "thrust";
    if (faultGeometry.rake < -60) return "normal";
    return "oblique";
  }

  /**
   * Detect rapid deformation potential using ASF DAAC Sentinel-1 data availability
   * Provides guidance on areas with sufficient data coverage for deformation monitoring
   */
  async detectRapidDeformation(
    region: { north: number; south: number; east: number; west: number },
    thresholdVelocity: number = 10 // mm/year
  ): Promise<Array<{
    location: { latitude: number; longitude: number };
    velocity: number;
    direction: "uplift" | "subsidence" | "horizontal";
    confidence: number;
    lastUpdate: string;
    anomalyType: "acceleration" | "new_signal" | "coherence_loss";
    significance: "low" | "medium" | "high" | "critical";
  }>> {
    try {
      // Search for recent Sentinel-1 products in the region
      const recentProducts = await this.searchProducts({
        region,
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 90 days
          end: new Date().toISOString().split('T')[0]
        }
      });
      
      console.log(`Found ${recentProducts.length} recent Sentinel-1 products for deformation analysis`);
      
      // Group products by track to identify areas with good temporal coverage
      const trackGroups: { [track: number]: InSARProduct[] } = {};
      recentProducts.forEach(product => {
        if (!trackGroups[product.track]) {
          trackGroups[product.track] = [];
        }
        trackGroups[product.track].push(product);
      });
      
      const deformationAreas: Array<{
        location: { latitude: number; longitude: number };
        velocity: number;
        direction: "uplift" | "subsidence" | "horizontal";
        confidence: number;
        lastUpdate: string;
        anomalyType: "acceleration" | "new_signal" | "coherence_loss";
        significance: "low" | "medium" | "high" | "critical";
      }> = [];
      
      // Analyze each track for deformation monitoring potential
      Object.entries(trackGroups).forEach(([track, products]) => {
        if (products.length >= 3) { // Need minimum 3 acquisitions for trend analysis
          const centerLat = (region.north + region.south) / 2;
          const centerLon = (region.east + region.west) / 2;
          const lastUpdate = Math.max(...products.map(p => new Date(p.acquisitionDate).getTime()));
          
          // Assess data coverage quality
          let confidence = 0.5;
          if (products.length >= 6) confidence = 0.7;
          if (products.length >= 10) confidence = 0.9;
          
          // Determine significance based on data coverage and recency
          let significance: "low" | "medium" | "high" | "critical" = "low";
          if (products.length >= 6 && (Date.now() - lastUpdate) < 14 * 24 * 60 * 60 * 1000) {
            significance = "medium";
          }
          if (products.length >= 10 && (Date.now() - lastUpdate) < 7 * 24 * 60 * 60 * 1000) {
            significance = "high";
          }
          
          deformationAreas.push({
            location: { latitude: centerLat, longitude: centerLon },
            velocity: 0, // Requires processing - placeholder
            direction: "horizontal" as const, // Most common for tectonic areas
            confidence,
            lastUpdate: new Date(lastUpdate).toISOString(),
            anomalyType: "new_signal" as const,
            significance
          });
        }
      });
      
      console.log(`Identified ${deformationAreas.length} areas with sufficient data for deformation monitoring`);
      console.log(`Recommendation: Use COMET-LiCS or ASF HyP3 for actual velocity analysis`);
      
      // Provide guidance on accessing processed velocity products
      if (deformationAreas.length > 0) {
        console.log(`Data processing options:`);
        console.log(`- COMET-LiCS: https://comet.nerc.ac.uk/COMET-LiCS-portal/`);
        console.log(`- ASF HyP3: https://hyp3-docs.asf.alaska.edu/`);
        console.log(`- ESA Geohazards: https://geohazards-tep.eu/`);
        console.log(`- NASA ARIA: https://aria.jpl.nasa.gov/`);
      }
      
      return deformationAreas;
      
    } catch (error) {
      console.error("Error detecting rapid deformation potential:", error);
      throw new Error(`Failed to assess deformation monitoring potential: ${(error as Error).message}`);
    }
  }

  // === Private Helper Methods ===

  private extractDateFromProductId(productId: string): string {
    // Extract date from product ID format
    const dateMatch = productId.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
  }



  private assessOverallQuality(measurements: Array<{ coherence: number; error: number }>): "excellent" | "good" | "fair" | "poor" {
    const avgCoherence = measurements.reduce((sum, m) => sum + m.coherence, 0) / measurements.length;
    const avgError = measurements.reduce((sum, m) => sum + m.error, 0) / measurements.length;
    
    if (avgCoherence > 0.8 && avgError < 3) return "excellent";
    if (avgCoherence > 0.6 && avgError < 5) return "good";
    if (avgCoherence > 0.4 && avgError < 8) return "fair";
    return "poor";
  }

  private getRegionalCenter(region: string): string {
    return this.regionalCenters[region as keyof typeof this.regionalCenters] || this.regionalCenters.global;
  }
}
