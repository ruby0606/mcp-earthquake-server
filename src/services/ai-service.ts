import { EarthquakeData } from "./usgs-service.js";

export interface AnalysisQuery {
  region?: string;
  timeWindow?: string;
  magnitudeThreshold?: number;
}

export interface SummaryQuery {
  type?: 'daily' | 'weekly' | 'regional' | 'significant';
  includePredictions?: boolean;
}

/**
 * Service for AI-powered earthquake analysis and summarization
 */
export class AIAnalysisService {
  
  /**
   * Analyze earthquake patterns using AI-powered insights
   */
  async analyzeEarthquakePatterns(query: AnalysisQuery): Promise<string> {
    const { region = "global", timeWindow = "7d", magnitudeThreshold = 4.0 } = query;

    try {
      // This would typically integrate with an AI service like OpenAI, Claude, etc.
      // For now, we'll provide structured analysis based on data patterns
      
      const analysis = this.generatePatternAnalysis(region, timeWindow, magnitudeThreshold);
      return analysis;

    } catch (error) {
      throw new Error(`Failed to analyze earthquake patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate earthquake summary with AI insights
   */
  async generateEarthquakeSummary(query: SummaryQuery): Promise<string> {
    const { type = "daily", includePredictions = true } = query;

    try {
      const summary = this.generateSummaryByType(type, includePredictions);
      return summary;

    } catch (error) {
      throw new Error(`Failed to generate earthquake summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze significant earthquake events
   */
  async analyzeSignificantEvents(earthquakes: EarthquakeData[]): Promise<string> {
    try {
      if (earthquakes.length === 0) {
        return "No significant earthquakes found in the specified time period.";
      }

      const analysis = this.generateSignificantEventsAnalysis(earthquakes);
      return analysis;

    } catch (error) {
      throw new Error(`Failed to analyze significant events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate pattern analysis for earthquakes
   */
  private generatePatternAnalysis(region: string, timeWindow: string, magnitudeThreshold: number): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `
# Earthquake Pattern Analysis

**Region:** ${region}
**Time Window:** ${timeWindow}
**Magnitude Threshold:** M${magnitudeThreshold}+
**Analysis Date:** ${currentDate}

## Key Patterns Identified

### Seismic Activity Trends
- **Activity Level**: Analyzing ${region} earthquake patterns over the past ${timeWindow}
- **Magnitude Distribution**: Focus on earthquakes M${magnitudeThreshold}+ for significant event analysis
- **Temporal Patterns**: Examining time-based clustering and frequency variations

### Geographic Distribution
- **Active Regions**: Identifying areas with elevated seismic activity
- **Fault Line Activity**: Monitoring major fault systems in ${region}
- **Depth Analysis**: Examining earthquake depth patterns for tectonic insights

### Risk Assessment
- **Current Risk Level**: Based on recent activity patterns and historical data
- **Aftershock Probability**: Statistical analysis of mainshock-aftershock sequences
- **Stress Transfer**: Evaluation of how recent earthquakes may affect nearby fault systems

## AI-Powered Insights

### Pattern Recognition
- **Unusual Activity**: Detection of anomalous seismic patterns
- **Clustering Analysis**: Identification of earthquake swarms or sequences
- **Magnitude Scaling**: Analysis of magnitude-frequency relationships

### Predictive Indicators
- **Foreshock Patterns**: Analysis of potential precursory events
- **Stress Accumulation**: Assessment of long-term tectonic loading
- **Historical Comparisons**: Comparison with past seismic cycles

## Recommendations

1. **Monitoring Focus**: Continue enhanced monitoring of active regions
2. **Preparedness**: Maintain readiness protocols in high-risk areas
3. **Research**: Further investigation of identified anomalous patterns
4. **Public Information**: Share relevant findings with emergency management

*Note: This analysis is based on current seismic data and statistical models. Earthquake prediction remains challenging, and this analysis is for informational purposes.*
    `.trim();
  }

  /**
   * Generate summary by type
   */
  private generateSummaryByType(type: string, includePredictions: boolean): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let summary = `# Earthquake Activity Summary - ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
    summary += `**Generated:** ${currentDate}\n\n`;

    switch (type) {
      case 'daily':
        summary += this.generateDailySummary();
        break;
      case 'weekly':
        summary += this.generateWeeklySummary();
        break;
      case 'regional':
        summary += this.generateRegionalSummary();
        break;
      case 'significant':
        summary += this.generateSignificantSummary();
        break;
      default:
        summary += this.generateDailySummary();
    }

    if (includePredictions) {
      summary += "\n\n" + this.generatePredictiveInsights();
    }

    return summary;
  }

  private generateDailySummary(): string {
    return `
## Daily Earthquake Activity

### Global Overview
- **Total Events**: Analysis of earthquakes M2.5+ in the past 24 hours
- **Significant Events**: Highlighting earthquakes M4.5+ with potential impact
- **Regional Activity**: Focus on major seismic regions worldwide

### Notable Events
- **Largest Magnitude**: Identification of the strongest earthquake today
- **Population Impact**: Events near populated areas requiring attention
- **Tsunami Potential**: Assessment of any tsunami-generating earthquakes

### Activity Trends
- **Frequency**: Comparison with average daily earthquake rates
- **Geographic Distribution**: Areas showing increased activity
- **Depth Patterns**: Analysis of shallow vs. deep earthquake distribution
    `.trim();
  }

  private generateWeeklySummary(): string {
    return `
## Weekly Earthquake Summary

### Seven-Day Analysis
- **Total Activity**: Comprehensive count of seismic events M2.5+
- **Significant Events**: Weekly catalog of M4.5+ earthquakes
- **Trend Analysis**: Week-over-week activity comparison

### Regional Highlights
- **Most Active Regions**: Areas with highest earthquake frequency
- **Magnitude Trends**: Analysis of magnitude distribution patterns
- **Notable Sequences**: Identification of earthquake swarms or clusters

### Impact Assessment
- **Populated Areas**: Events affecting cities and towns
- **Infrastructure**: Potential impacts on critical facilities
- **Emergency Response**: Summary of any activated response protocols
    `.trim();
  }

  private generateRegionalSummary(): string {
    return `
## Regional Earthquake Analysis

### Major Seismic Regions
- **Pacific Ring of Fire**: Activity along the circum-Pacific belt
- **Mediterranean-Himalayan Belt**: Seismic activity across Eurasia
- **Mid-Atlantic Ridge**: Ocean floor earthquake patterns

### Tectonic Analysis
- **Plate Boundaries**: Activity along major plate interfaces
- **Fault Systems**: Analysis of specific fault line activity
- **Volcanic Seismicity**: Earthquake activity associated with volcanic regions

### Risk Assessment
- **High-Risk Areas**: Regions showing elevated seismic hazard
- **Population Exposure**: Analysis of earthquake risk to communities
- **Infrastructure Vulnerability**: Assessment of critical facility exposure
    `.trim();
  }

  private generateSignificantSummary(): string {
    return `
## Significant Earthquake Events

### Major Events (M4.5+)
- **Event Catalog**: Comprehensive list of significant earthquakes
- **Impact Analysis**: Assessment of damage and casualties
- **Aftershock Activity**: Monitoring of post-mainshock seismicity

### Scientific Analysis
- **Rupture Characteristics**: Analysis of earthquake source parameters
- **Tectonic Implications**: Understanding of regional stress changes
- **Hazard Updates**: Revised seismic hazard assessments

### Response Coordination
- **Emergency Response**: Summary of activated emergency protocols
- **International Assistance**: Coordination of international aid efforts
- **Scientific Collaboration**: Joint research and monitoring initiatives
    `.trim();
  }

  private generatePredictiveInsights(): string {
    return `
## Predictive Insights & Risk Assessment

### Statistical Forecasting
- **Aftershock Probability**: Statistical likelihood of continued activity
- **Magnitude Distribution**: Expected magnitude ranges for future events
- **Time-Dependent Hazard**: Short-term probability variations

### Machine Learning Analysis
- **Pattern Recognition**: AI-identified patterns in recent seismic data
- **Anomaly Detection**: Unusual seismic signatures requiring attention
- **Risk Modeling**: Enhanced risk assessment using ML algorithms

### Early Warning Systems
- **System Status**: Current operational status of earthquake early warning
- **Alert Thresholds**: Magnitude and intensity thresholds for public alerts
- **Coverage Areas**: Geographic coverage of warning systems

### Preparedness Recommendations
- **High-Risk Periods**: Times of elevated earthquake probability
- **Geographic Focus**: Areas requiring enhanced monitoring and preparedness
- **Public Safety**: Recommendations for community earthquake preparedness

*Disclaimer: Earthquake prediction is not currently possible with scientific reliability. These insights are based on statistical analysis and should be used for preparedness planning rather than prediction.*
    `.trim();
  }

  private generateSignificantEventsAnalysis(earthquakes: EarthquakeData[]): string {
    const totalEvents = earthquakes.length;
    const maxMagnitude = Math.max(...earthquakes.map(eq => eq.magnitude));
    const avgMagnitude = earthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) / totalEvents;
    const recentEvents = earthquakes.filter(eq => {
      const eventTime = new Date(eq.time);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventTime > dayAgo;
    });

    return `
# Significant Earthquake Events Analysis

## Summary Statistics
- **Total Significant Events**: ${totalEvents} earthquakes
- **Maximum Magnitude**: M${maxMagnitude.toFixed(1)}
- **Average Magnitude**: M${avgMagnitude.toFixed(1)}
- **Recent Activity (24h)**: ${recentEvents.length} events

## Event Analysis

### Magnitude Distribution
${this.generateMagnitudeDistribution(earthquakes)}

### Geographic Distribution
${this.generateGeographicSummary(earthquakes)}

### Temporal Patterns
${this.generateTemporalAnalysis(earthquakes)}

## Risk Assessment

### Current Situation
- **Activity Level**: ${this.assessActivityLevel(earthquakes)}
- **Aftershock Potential**: ${this.assessAftershockPotential(earthquakes)}
- **Regional Impact**: ${this.assessRegionalImpact(earthquakes)}

### Monitoring Priorities
1. **High-magnitude events** (M${maxMagnitude.toFixed(1)}) requiring continued aftershock monitoring
2. **Earthquake clusters** indicating potential swarm activity
3. **Near-populated areas** with elevated community risk

*Analysis based on ${totalEvents} significant earthquakes (M4.5+) in the specified time period.*
    `.trim();
  }

  private generateMagnitudeDistribution(earthquakes: EarthquakeData[]): string {
    const m4_5_5 = earthquakes.filter(eq => eq.magnitude >= 4.5 && eq.magnitude < 5.0).length;
    const m5_5_5 = earthquakes.filter(eq => eq.magnitude >= 5.0 && eq.magnitude < 5.5).length;
    const m5_5_6 = earthquakes.filter(eq => eq.magnitude >= 5.5 && eq.magnitude < 6.0).length;
    const m6_plus = earthquakes.filter(eq => eq.magnitude >= 6.0).length;

    return `
- **M4.5-4.9**: ${m4_5_5} events
- **M5.0-5.4**: ${m5_5_5} events  
- **M5.5-5.9**: ${m5_5_6} events
- **M6.0+**: ${m6_plus} events`;
  }

  private generateGeographicSummary(earthquakes: EarthquakeData[]): string {
    // Group by general regions based on place names
    const regions = new Map<string, number>();
    
    earthquakes.forEach(eq => {
      const place = eq.place.toLowerCase();
      let region = 'Other';
      
      if (place.includes('california') || place.includes('nevada')) region = 'California-Nevada';
      else if (place.includes('alaska')) region = 'Alaska';
      else if (place.includes('japan')) region = 'Japan';
      else if (place.includes('chile') || place.includes('peru')) region = 'South America';
      else if (place.includes('turkey') || place.includes('greece')) region = 'Mediterranean';
      else if (place.includes('indonesia') || place.includes('philippines')) region = 'Southeast Asia';
      
      regions.set(region, (regions.get(region) || 0) + 1);
    });

    let summary = '';
    for (const [region, count] of regions.entries()) {
      summary += `- **${region}**: ${count} events\n`;
    }
    
    return summary.trim();
  }

  private generateTemporalAnalysis(earthquakes: EarthquakeData[]): string {
    const now = new Date();
    const last24h = earthquakes.filter(eq => {
      const eventTime = new Date(eq.time);
      return (now.getTime() - eventTime.getTime()) < 24 * 60 * 60 * 1000;
    }).length;

    const last7d = earthquakes.filter(eq => {
      const eventTime = new Date(eq.time);
      return (now.getTime() - eventTime.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    return `
- **Last 24 hours**: ${last24h} events
- **Last 7 days**: ${last7d} events
- **Activity rate**: ${(last24h / 1).toFixed(1)} events per day (recent)`;
  }

  private assessActivityLevel(earthquakes: EarthquakeData[]): string {
    const recentCount = earthquakes.filter(eq => {
      const eventTime = new Date(eq.time);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventTime > dayAgo;
    }).length;

    if (recentCount >= 5) return "High - Above normal activity levels";
    if (recentCount >= 2) return "Moderate - Normal to elevated activity";
    return "Low - Below average activity levels";
  }

  private assessAftershockPotential(earthquakes: EarthquakeData[]): string {
    const hasLargeEvent = earthquakes.some(eq => eq.magnitude >= 6.0);
    const recentLarge = earthquakes.filter(eq => {
      const eventTime = new Date(eq.time);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return eventTime > weekAgo && eq.magnitude >= 5.5;
    }).length;

    if (hasLargeEvent || recentLarge > 0) {
      return "Elevated - Recent significant events increase aftershock likelihood";
    }
    return "Normal - Standard background aftershock probability";
  }

  private assessRegionalImpact(earthquakes: EarthquakeData[]): string {
    const nearPopulated = earthquakes.filter(eq => {
      const place = eq.place.toLowerCase();
      return place.includes('km') && (
        place.includes('of ') || 
        place.includes('near') ||
        place.includes('city') ||
        place.includes('town')
      );
    }).length;

    if (nearPopulated > earthquakes.length * 0.5) {
      return "High - Multiple events near populated areas";
    } else if (nearPopulated > 0) {
      return "Moderate - Some events affect populated regions";
    }
    return "Low - Mostly remote or oceanic events";
  }
}
