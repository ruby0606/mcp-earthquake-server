import { IrisDataProvider, EarthquakeEvent } from "../providers/iris-provider.js";
import { GnssDataProvider, DisplacementMeasurement } from "../providers/gnss-provider.js";
import { 
  MAGNITUDE_THRESHOLDS,
  GNSS_THRESHOLDS,
  ANALYSIS_DEFAULTS 
} from "../config/scientific-constants.js";

/**
 * Earthquake Analysis Engine
 * 
 * Provides comprehensive analysis of seismic activity combining:
 * - IRIS earthquake catalog data
 * - GNSS crustal deformation measurements
 * - Statistical analysis and pattern recognition
 * - Risk assessment and forecasting
 */

export interface AnalysisRegion {
  center: { lat: number; lon: number };
  radius: number; // km
  timeWindow: number; // days
  minMagnitude: number;
}

export interface SeismicAnalysis {
  region: AnalysisRegion;
  totalEvents: number;
  averageMagnitude: number;
  largestMagnitude: number;
  smallestMagnitude: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  
  // Statistical measures
  magnitudeDistribution: { [magnitude: string]: number };
  depthStats: string;
  temporalPattern: string;
  spatialClustering: string;
  
  // Gutenberg-Richter analysis
  bValue: number;
  aValue: number;
  completeness: number;
  
  // Hazard assessment
  dailyRate: number;
  probabilityM5Plus: number;
  probabilityM6Plus: number;
  probabilityM7Plus: number;
  
  // GNSS correlation
  gnssAnomalies: number;
  crustalDeformation: string;
  
  // Recommendations
  recommendations: string[];
  confidence: number;
  
  // Raw data references
  events: EarthquakeEvent[];
  gnssStations: DisplacementMeasurement[];
}

export interface ForecastResult {
  region: AnalysisRegion;
  timeframe: number; // days
  probabilities: {
    magnitude4: number;
    magnitude5: number;
    magnitude6: number;
    magnitude7: number;
  };
  expectedEvents: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  confidence: number;
  methodology: string;
  limitations: string[];
  recommendations: string[];
}

export class EarthquakeAnalyzer {
  private irisProvider: IrisDataProvider;
  private gnssProvider: GnssDataProvider;

  constructor() {
    this.irisProvider = new IrisDataProvider();
    this.gnssProvider = new GnssDataProvider();
  }

  /**
   * Comprehensive seismic analysis for a region
   */
  async analyzeRegion(region: AnalysisRegion): Promise<SeismicAnalysis> {
    try {
      // Fetch earthquake data
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (region.timeWindow * 24 * 60 * 60 * 1000));

      const events = await this.irisProvider.getEventsNearLocation(
        region.center.lat,
        region.center.lon,
        region.radius,
        {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          minMagnitude: region.minMagnitude,
          limit: ANALYSIS_DEFAULTS.STANDARD_RESULT_LIMIT * 10
        }
      );

      // Fetch GNSS data for correlation
      const regionName = this.getRegionName(region.center.lat, region.center.lon);
      const gnssStations = await this.gnssProvider.monitorDisplacements({
        region: regionName,
        threshold: GNSS_THRESHOLDS.ANOMALY_THRESHOLD, // Anomaly threshold
        timeWindow: region.timeWindow
      });

      // Perform statistical analysis
      const stats = this.calculateStatistics(events);
      const gutenbergRichter = this.calculateGutenbergRichter(events);
      const hazardAssessment = this.assessHazard(events, region.timeWindow);
      const riskLevel = this.determineRiskLevel(events, gnssStations, region);
      const recommendations = this.generateRecommendations(events, gnssStations, riskLevel);

      return {
        region,
        totalEvents: events.length,
        averageMagnitude: stats.averageMagnitude,
        largestMagnitude: stats.largestMagnitude,
        smallestMagnitude: stats.smallestMagnitude,
        riskLevel,
        
        magnitudeDistribution: stats.magnitudeDistribution,
        depthStats: this.analyzeDepthDistribution(events),
        temporalPattern: this.analyzeTemporalPattern(events),
        spatialClustering: this.analyzeSpatialClustering(events, region),
        
        bValue: gutenbergRichter.bValue,
        aValue: gutenbergRichter.aValue,
        completeness: gutenbergRichter.completeness,
        
        dailyRate: hazardAssessment.dailyRate,
        probabilityM5Plus: hazardAssessment.probabilityM5Plus,
        probabilityM6Plus: hazardAssessment.probabilityM6Plus,
        probabilityM7Plus: hazardAssessment.probabilityM7Plus,
        
        gnssAnomalies: gnssStations.filter(s => s.anomaly).length,
        crustalDeformation: this.analyzeCrustalDeformation(gnssStations),
        
        recommendations,
        confidence: this.calculateConfidence(events, gnssStations),
        
        events,
        gnssStations
      };
    } catch (error) {
      console.error("Error analyzing seismic region:", error);
      throw new Error(`Failed to analyze seismic region: ${(error as Error).message}`);
    }
  }

  /**
   * Generate earthquake forecast for a region
   */
  async forecastEarthquakes(region: AnalysisRegion, forecastDays: number): Promise<ForecastResult> {
    try {
      const analysis = await this.analyzeRegion(region);
      
      // Calculate probabilities using Gutenberg-Richter relation and Poisson statistics
      const lambda = analysis.dailyRate; // events per day
      const bValue = analysis.bValue;
      
      const probabilities = {
        magnitude4: this.calculateMagnitudeProbability(MAGNITUDE_THRESHOLDS.MODERATE_IMPACT, bValue, lambda, forecastDays),
        magnitude5: this.calculateMagnitudeProbability(MAGNITUDE_THRESHOLDS.SIGNIFICANT, bValue, lambda, forecastDays),
        magnitude6: this.calculateMagnitudeProbability(MAGNITUDE_THRESHOLDS.STRONG, bValue, lambda, forecastDays),
        magnitude7: this.calculateMagnitudeProbability(MAGNITUDE_THRESHOLDS.MAJOR, bValue, lambda, forecastDays)
      };

      const expectedEvents = lambda * forecastDays;
      const riskLevel = this.forecastRiskLevel(probabilities, analysis);
      
      return {
        region,
        timeframe: forecastDays,
        probabilities,
        expectedEvents,
        riskLevel,
        confidence: this.calculateForecastConfidence(analysis),
        methodology: "Gutenberg-Richter relation with Poisson temporal distribution",
        limitations: [
          "Based on historical patterns which may not predict future behavior",
          "Does not account for specific fault mechanics or stress loading",
          "Earthquake prediction remains scientifically uncertain",
          "Probabilities are statistical estimates, not deterministic predictions"
        ],
        recommendations: this.generateForecastRecommendations(probabilities, riskLevel)
      };
    } catch (error) {
      console.error("Error forecasting earthquakes:", error);
      throw new Error(`Failed to forecast earthquakes: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze earthquake swarm activity
   */
  async analyzeSwarm(events: EarthquakeEvent[]): Promise<{
    isSwarm: boolean;
    swarmStart: string;
    swarmDuration: number; // hours
    mainshock: EarthquakeEvent | null;
    foreshocks: EarthquakeEvent[];
    aftershocks: EarthquakeEvent[];
    productivity: number;
    spatialExtent: number; // km
    temporalEvolution: string;
    significance: "low" | "moderate" | "high";
  }> {
    if (events.length < 3) { // Minimum events for statistical analysis
      return {
        isSwarm: false,
        swarmStart: "",
        swarmDuration: 0,
        mainshock: null,
        foreshocks: [],
        aftershocks: [],
        productivity: 0,
        spatialExtent: 0,
        temporalEvolution: "Insufficient data",
        significance: "low"
      };
    }

    // Sort events by time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime());

    // Identify potential mainshock (largest magnitude)
    const mainshock = events.reduce((max, event) => 
      event.magnitude > max.magnitude ? event : max);

    const mainshockTime = new Date(mainshock.time).getTime();
    
    // Classify events
    const foreshocks = sortedEvents.filter(e => 
      new Date(e.time).getTime() < mainshockTime);
    const aftershocks = sortedEvents.filter(e => 
      new Date(e.time).getTime() > mainshockTime);

    // Calculate spatial extent
    const latitudes = events.map(e => e.latitude);
    const longitudes = events.map(e => e.longitude);
    const spatialExtent = this.calculateDistance(
      Math.min(...latitudes), Math.min(...longitudes),
      Math.max(...latitudes), Math.max(...longitudes)
    );

    // Calculate temporal properties
    const startTime = new Date(sortedEvents[0].time);
    const endTime = new Date(sortedEvents[sortedEvents.length - 1].time);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours

    // Determine if it's a swarm (vs mainshock-aftershock sequence)
    const magnitudeRange = Math.max(...events.map(e => e.magnitude)) - 
                          Math.min(...events.map(e => e.magnitude));
    const isSwarm = magnitudeRange < 1.5 && events.length > 10; // Swarm criteria: narrow magnitude range + many events

    const productivity = aftershocks.length / Math.pow(10, mainshock.magnitude - 3);
    const significance = this.assessSwarmSignificance(events, spatialExtent, duration);

    return {
      isSwarm,
      swarmStart: startTime.toISOString(),
      swarmDuration: duration,
      mainshock: isSwarm ? null : mainshock,
      foreshocks,
      aftershocks,
      productivity,
      spatialExtent,
      temporalEvolution: this.analyzeTemporalEvolution(sortedEvents),
      significance
    };
  }

  // === Private Helper Methods ===

  private calculateStatistics(events: EarthquakeEvent[]) {
    if (events.length === 0) {
      return {
        averageMagnitude: 0,
        largestMagnitude: 0,
        smallestMagnitude: 0,
        magnitudeDistribution: {}
      };
    }

    const magnitudes = events.map(e => e.magnitude);
    const averageMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    const largestMagnitude = Math.max(...magnitudes);
    const smallestMagnitude = Math.min(...magnitudes);

    // Create magnitude distribution
    const distribution: { [magnitude: string]: number } = {};
    for (const mag of magnitudes) {
      const bin = Math.floor(mag * 2) / 2; // 0.5 magnitude bins
      const key = bin.toString();
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return {
      averageMagnitude,
      largestMagnitude,
      smallestMagnitude,
      magnitudeDistribution: distribution
    };
  }

  private calculateGutenbergRichter(events: EarthquakeEvent[]): {
    bValue: number;
    aValue: number;
    completeness: number;
  } {
    if (events.length < 10) {
      return { bValue: 1.0, aValue: 3.0, completeness: 2.5 }; // Default values
    }

    // Find magnitude of completeness (Mc)
    const magnitudes = events.map(e => e.magnitude).sort((a, b) => a - b);
    const completeness = this.findCompletenessThreshold(magnitudes);

    // Filter events above completeness threshold
    const completeEvents = events.filter(e => e.magnitude >= completeness);
    
    if (completeEvents.length < 5) {
      return { bValue: 1.0, aValue: 3.0, completeness };
    }

    // Calculate b-value using maximum likelihood method
    const magValues = completeEvents.map(e => e.magnitude);
    const meanMag = magValues.reduce((sum, mag) => sum + mag, 0) / magValues.length;
    const bValue = Math.log10(Math.E) / (meanMag - (completeness - 0.05));

    // Calculate a-value
    const N = completeEvents.length;
    const aValue = Math.log10(N) + bValue * completeness;

    return { bValue, aValue, completeness };
  }

  private findCompletenessThreshold(sortedMagnitudes: number[]): number {
    // Simple method: find magnitude where frequency stops increasing
    const bins: { [mag: string]: number } = {};
    
    for (const mag of sortedMagnitudes) {
      const bin = Math.floor(mag * 10) / 10; // 0.1 magnitude bins
      bins[bin.toString()] = (bins[bin.toString()] || 0) + 1;
    }

    const binEntries = Object.entries(bins).sort(([a], [b]) => parseFloat(a) - parseFloat(b));
    
    // Find the magnitude where frequency starts consistently decreasing
    for (let i = 1; i < binEntries.length - 1; i++) {
      const current = binEntries[i][1];
      const next = binEntries[i + 1][1];
      
      if (current > next && current > 5) { // Minimum 5 events
        return parseFloat(binEntries[i][0]);
      }
    }

    return Math.min(...sortedMagnitudes) + 0.5; // Conservative estimate
  }

  private assessHazard(events: EarthquakeEvent[], timeWindow: number) {
    const dailyRate = events.length / timeWindow;
    
    // Calculate probabilities for different magnitudes
    const m5Plus = events.filter(e => e.magnitude >= 5.0).length / timeWindow;
    const m6Plus = events.filter(e => e.magnitude >= 6.0).length / timeWindow;
    const m7Plus = events.filter(e => e.magnitude >= 7.0).length / timeWindow;

    return {
      dailyRate,
      probabilityM5Plus: 1 - Math.exp(-m5Plus), // Poisson probability
      probabilityM6Plus: 1 - Math.exp(-m6Plus),
      probabilityM7Plus: 1 - Math.exp(-m7Plus)
    };
  }

  private determineRiskLevel(
    events: EarthquakeEvent[], 
    gnssStations: DisplacementMeasurement[], 
    region: AnalysisRegion
  ): "low" | "moderate" | "high" | "critical" {
    const recentLarge = events.filter(e => e.magnitude >= 6.0).length;
    const totalEvents = events.length;
    const gnssAnomalies = gnssStations.filter(s => s.anomaly).length;
    const dailyRate = totalEvents / region.timeWindow;

    let score = 0;
    
    // Magnitude-based scoring
    if (recentLarge > 0) score += 3;
    if (events.some(e => e.magnitude >= 7.0)) score += 2;
    
    // Activity rate scoring
    if (dailyRate > 10) score += 2;
    else if (dailyRate > 5) score += 1;
    
    // GNSS anomaly scoring
    if (gnssAnomalies > 3) score += 2;
    else if (gnssAnomalies > 0) score += 1;
    
    // Depth consideration (shallow events more dangerous)
    const shallowEvents = events.filter(e => e.depth < 30).length;
    if (shallowEvents / totalEvents > 0.7) score += 1;

    if (score >= 6) return "critical";
    if (score >= 4) return "high";
    if (score >= 2) return "moderate";
    return "low";
  }

  private generateRecommendations(
    events: EarthquakeEvent[], 
    gnssStations: DisplacementMeasurement[], 
    riskLevel: string
  ): string[] {
    const recommendations = [];

    if (riskLevel === "critical" || riskLevel === "high") {
      recommendations.push("Enhanced monitoring of seismic networks recommended");
      recommendations.push("Review emergency response plans and procedures");
      recommendations.push("Consider public awareness campaigns about earthquake preparedness");
    }

    if (gnssStations.filter(s => s.anomaly).length > 0) {
      recommendations.push("Investigate GNSS anomalies for potential precursory signals");
      recommendations.push("Increase GNSS measurement frequency in affected areas");
    }

    const recentLarge = events.filter(e => e.magnitude >= 6.0);
    if (recentLarge.length > 0) {
      recommendations.push("Monitor for aftershock sequences following recent large events");
      recommendations.push("Assess infrastructure vulnerability in high-activity zones");
    }

    if (events.length > 50) {
      recommendations.push("Investigate potential swarm activity or induced seismicity");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue routine monitoring and data collection");
      recommendations.push("Maintain preparedness for earthquake emergencies");
    }

    return recommendations;
  }

  private analyzeDepthDistribution(events: EarthquakeEvent[]): string {
    if (events.length === 0) return "No depth data available";

    const depths = events.map(e => e.depth);
    const avgDepth = depths.reduce((sum, d) => sum + d, 0) / depths.length;
    const shallow = events.filter(e => e.depth <= 35).length;
    const intermediate = events.filter(e => e.depth > 35 && e.depth <= 300).length;
    const deep = events.filter(e => e.depth > 300).length;

    return `Average: ${avgDepth.toFixed(1)}km | Shallow (≤35km): ${shallow} | Intermediate (35-300km): ${intermediate} | Deep (>300km): ${deep}`;
  }

  private analyzeTemporalPattern(events: EarthquakeEvent[]): string {
    if (events.length < 5) return "Insufficient data for temporal analysis";

    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime());

    // Calculate time intervals
    const intervals = [];
    for (let i = 1; i < sortedEvents.length; i++) {
      const interval = new Date(sortedEvents[i].time).getTime() - 
                      new Date(sortedEvents[i-1].time).getTime();
      intervals.push(interval / (1000 * 60 * 60)); // hours
    }

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const recentActivity = intervals.slice(-5).reduce((sum, i) => sum + i, 0) / Math.min(5, intervals.length);

    if (recentActivity < avgInterval * 0.5) {
      return "Accelerating activity pattern detected";
    } else if (recentActivity > avgInterval * 1.5) {
      return "Decreasing activity pattern";
    } else {
      return "Steady activity pattern";
    }
  }

  private analyzeSpatialClustering(events: EarthquakeEvent[], region: AnalysisRegion): string {
    if (events.length < 10) return "Insufficient data for clustering analysis";

    // Calculate distances from region center
    const distances = events.map(e => 
      this.calculateDistance(region.center.lat, region.center.lon, e.latitude, e.longitude));

    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    
    // Check for clustering vs dispersal
    const within25km = events.filter(e => 
      this.calculateDistance(region.center.lat, region.center.lon, e.latitude, e.longitude) <= 25).length;
    
    const clusteringRatio = within25km / events.length;

    if (clusteringRatio > 0.7) {
      return `Highly clustered (${(clusteringRatio * 100).toFixed(0)}% within 25km)`;
    } else if (clusteringRatio > 0.4) {
      return `Moderately clustered (${(clusteringRatio * 100).toFixed(0)}% within 25km)`;
    } else {
      return `Dispersed pattern (avg distance: ${avgDistance.toFixed(1)}km)`;
    }
  }

  private analyzeCrustalDeformation(gnssStations: DisplacementMeasurement[]): string {
    if (gnssStations.length === 0) return "No GNSS data available";

    const avgDisplacement = gnssStations.reduce((sum, s) => sum + s.displacement, 0) / gnssStations.length;
    const maxDisplacement = Math.max(...gnssStations.map(s => s.displacement));
    const anomalies = gnssStations.filter(s => s.anomaly).length;

    let description = `Average: ${avgDisplacement.toFixed(2)}mm, Maximum: ${maxDisplacement.toFixed(2)}mm`;
    
    if (anomalies > 0) {
      description += ` | ${anomalies} anomalous stations detected`;
    }
    
    if (maxDisplacement > 10) {
      description += " | Significant deformation observed";
    }

    return description;
  }

  private calculateConfidence(events: EarthquakeEvent[], gnssStations: DisplacementMeasurement[]): number {
    let confidence = 0.5; // Base confidence
    
    // More events = higher confidence
    if (events.length > 50) confidence += 0.2;
    else if (events.length > 20) confidence += 0.1;
    
    // GNSS data availability
    if (gnssStations.length > 10) confidence += 0.15;
    else if (gnssStations.length > 5) confidence += 0.1;
    
    // Data quality
    const highQualityGnss = gnssStations.filter(s => s.quality === "excellent" || s.quality === "good").length;
    confidence += (highQualityGnss / Math.max(gnssStations.length, 1)) * 0.15;
    
    return Math.min(0.95, confidence); // Cap at 95%
  }

  private calculateMagnitudeProbability(magnitude: number, bValue: number, lambda: number, days: number): number {
    // Using Gutenberg-Richter relation and Poisson statistics
    const rate = lambda * Math.pow(10, -bValue * (magnitude - 2.5)); // events per day for this magnitude
    return 1 - Math.exp(-rate * days);
  }

  private forecastRiskLevel(probabilities: any, analysis: SeismicAnalysis): "low" | "moderate" | "high" | "critical" {
    if (probabilities.magnitude7 > 0.1 || probabilities.magnitude6 > 0.3) return "critical";
    if (probabilities.magnitude6 > 0.1 || probabilities.magnitude5 > 0.5) return "high";
    if (probabilities.magnitude5 > 0.2 || probabilities.magnitude4 > 0.7) return "moderate";
    return "low";
  }

  private calculateForecastConfidence(analysis: SeismicAnalysis): number {
    let confidence = 0.3; // Base confidence for earthquake forecasting
    
    if (analysis.totalEvents > 100) confidence += 0.2;
    if (analysis.bValue > 0.7 && analysis.bValue < 1.3) confidence += 0.1; // Typical b-value range
    if (analysis.gnssStations.length > 5) confidence += 0.1;
    
    return Math.min(0.7, confidence); // Cap at 70% for earthquake forecasting
  }

  private generateForecastRecommendations(probabilities: any, riskLevel: string): string[] {
    const recommendations = [];
    
    if (riskLevel === "critical") {
      recommendations.push("Implement heightened earthquake preparedness measures");
      recommendations.push("Consider temporary restrictions in high-risk areas");
    } else if (riskLevel === "high") {
      recommendations.push("Increase monitoring and public awareness");
      recommendations.push("Review building codes and emergency procedures");
    } else {
      recommendations.push("Maintain standard earthquake preparedness");
      recommendations.push("Continue routine monitoring and data collection");
    }
    
    return recommendations;
  }

  private assessSwarmSignificance(events: EarthquakeEvent[], spatialExtent: number, duration: number): "low" | "moderate" | "high" {
    const maxMagnitude = Math.max(...events.map(e => e.magnitude));
    const eventRate = events.length / Math.max(duration, 1);
    
    if (maxMagnitude >= 5.0 || eventRate > 5 || spatialExtent > 50) return "high";
    if (maxMagnitude >= 4.0 || eventRate > 2 || spatialExtent > 20) return "moderate";
    return "low";
  }

  private analyzeTemporalEvolution(events: EarthquakeEvent[]): string {
    if (events.length < 5) return "Limited temporal data";
    
    // Analyze the rate of events over time
    const timeSpan = new Date(events[events.length - 1].time).getTime() - 
                    new Date(events[0].time).getTime();
    const hours = timeSpan / (1000 * 60 * 60);
    
    // Divide into three periods and compare rates
    const period1 = events.slice(0, Math.floor(events.length / 3));
    const period2 = events.slice(Math.floor(events.length / 3), Math.floor(2 * events.length / 3));
    const period3 = events.slice(Math.floor(2 * events.length / 3));
    
    const rate1 = period1.length / (hours / 3);
    const rate2 = period2.length / (hours / 3);
    const rate3 = period3.length / (hours / 3);
    
    if (rate3 > rate2 && rate2 > rate1) return "Accelerating sequence";
    if (rate3 < rate2 && rate2 < rate1) return "Decaying sequence";
    return "Variable rate sequence";
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private getRegionName(lat: number, lon: number): string {
    // Simple region mapping based on coordinates
    if (lat >= 32 && lat <= 42 && lon >= -125 && lon <= -114) return "california";
    if (lat >= 30 && lat <= 46 && lon >= 129 && lon <= 146) return "japan";
    if (lat >= -56 && lat <= -17 && lon >= -75 && lon <= -66) return "chile";
    if (lat >= -47 && lat <= -34 && lon >= 166 && lon <= 179) return "newzealand";
    if (lat >= 55 && lat <= 72 && lon >= -170 && lon <= -130) return "alaska";
    return "global";
  }
}
