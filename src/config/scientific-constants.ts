/**
 * Scientific Constants and Configuration for Earthquake Monitoring
 * 
 * This file centralizes all configurable parameters used throughout the earthquake
 * monitoring system, providing scientifically validated default values with proper
 * references and rationale for each constant.
 * 
 * All values are based on established seismological research and international
 * standards from organizations like USGS, IRIS, and FDSN.
 */

// === SEISMOLOGICAL CONSTANTS ===

/**
 * Magnitude thresholds based on seismological significance
 * References: USGS Earthquake Magnitude Policy, Richter (1935), Kanamori (1977)
 */
export const MAGNITUDE_THRESHOLDS = {
  /** Minimum detectable earthquake by modern networks */
  MINIMUM_DETECTABLE: 1.0,
  
  /** Threshold for local significance and damage potential */
  LOCAL_SIGNIFICANCE: 2.5,
  
  /** Standard minimum for regional analysis */
  REGIONAL_ANALYSIS: 3.0,
  
  /** Threshold for moderate earthquakes with regional impact */
  MODERATE_IMPACT: 4.0,
  
  /** Significant earthquakes with potential damage */
  SIGNIFICANT: 5.0,
  
  /** Strong earthquakes causing considerable damage */
  STRONG: 6.0,
  
  /** Major earthquakes with widespread damage */
  MAJOR: 7.0,
  
  /** Great earthquakes causing catastrophic damage */
  GREAT: 8.0,
  
  /** Theoretical maximum based on fault mechanics */
  THEORETICAL_MAX: 10.0
} as const;

/**
 * Depth classifications for earthquake analysis
 * Reference: USGS Earthquake Glossary, Frohlich (2006)
 */
export const DEPTH_CLASSIFICATIONS = {
  /** Shallow earthquakes - most damaging */
  SHALLOW_MAX: 35, // km
  
  /** Intermediate depth earthquakes */
  INTERMEDIATE_MIN: 35, // km
  INTERMEDIATE_MAX: 300, // km
  
  /** Deep earthquakes - less surface impact */
  DEEP_MIN: 300, // km
  
  /** Typical crustal thickness */
  CRUSTAL_THICKNESS: 35 // km
} as const;

/**
 * Gutenberg-Richter relation constants
 * Reference: Gutenberg & Richter (1944), Aki (1965)
 */
export const GUTENBERG_RICHTER = {
  /** Typical b-value for tectonic regions */
  TYPICAL_B_VALUE: 1.0,
  
  /** Range of normal b-values */
  B_VALUE_MIN: 0.7,
  B_VALUE_MAX: 1.3,
  
  /** Default a-value for regional analysis */
  DEFAULT_A_VALUE: 3.0,
  
  /** Minimum events for reliable G-R analysis */
  MIN_EVENTS_FOR_ANALYSIS: 10,
  
  /** Magnitude bin size for frequency analysis */
  MAGNITUDE_BIN_SIZE: 0.1
} as const;

// === GNSS/GPS CONSTANTS ===

/**
 * GNSS displacement thresholds
 * Reference: Blewitt & Lavallée (2002), Wdowinski et al. (2004)
 */
export const GNSS_THRESHOLDS = {
  /** Typical measurement precision of modern GNSS */
  MEASUREMENT_PRECISION: 1.0, // mm
  
  /** Standard threshold for anomaly detection */
  ANOMALY_THRESHOLD: 3.0, // mm
  
  /** Significant displacement requiring investigation */
  SIGNIFICANT_DISPLACEMENT: 5.0, // mm
  
  /** Large displacement indicating major deformation */
  LARGE_DISPLACEMENT: 10.0, // mm
  
  /** Typical velocity for stable regions */
  STABLE_VELOCITY: 2.0, // mm/year
  
  /** Threshold for rapid deformation */
  RAPID_DEFORMATION: 10.0, // mm/year
  
  /** Very high deformation threshold */
  EXTREME_DEFORMATION: 50.0 // mm/year
} as const;

/**
 * GNSS data quality parameters
 * Reference: IGS Guidelines, Herring et al. (2016)
 */
export const GNSS_QUALITY = {
  /** Excellent quality coherence threshold */
  EXCELLENT_COHERENCE: 0.9,
  
  /** Good quality coherence threshold */
  GOOD_COHERENCE: 0.7,
  
  /** Fair quality coherence threshold */
  FAIR_COHERENCE: 0.5,
  
  /** Minimum acceptable coherence */
  MIN_COHERENCE: 0.3
} as const;

// === INSAR CONSTANTS ===

/**
 * InSAR coherence and quality thresholds
 * Reference: Zebker & Villasenor (1992), Ferretti et al. (2001)
 */
export const INSAR_QUALITY = {
  /** Excellent interferometric coherence */
  EXCELLENT_COHERENCE: 0.8,
  
  /** Good interferometric coherence */
  GOOD_COHERENCE: 0.6,
  
  /** Fair interferometric coherence */
  FAIR_COHERENCE: 0.4,
  
  /** Poor coherence threshold */
  POOR_COHERENCE: 0.2,
  
  /** Minimum usable coherence */
  MIN_COHERENCE: 0.1
} as const;

/**
 * InSAR velocity thresholds for deformation analysis
 * Reference: Massonnet & Feigl (1998), Bürgmann et al. (2000)
 */
export const INSAR_VELOCITY = {
  /** Minimum measurable velocity */
  MIN_VELOCITY: 0.1, // mm/year
  
  /** Typical measurement precision */
  MEASUREMENT_PRECISION: 1.0, // mm/year
  
  /** Standard monitoring threshold */
  MONITORING_THRESHOLD: 5.0, // mm/year
  
  /** Significant deformation threshold */
  SIGNIFICANT_THRESHOLD: 10.0, // mm/year
  
  /** Rapid deformation threshold */
  RAPID_THRESHOLD: 50.0, // mm/year
  
  /** Extreme deformation (volcanic/fault activity) */
  EXTREME_THRESHOLD: 100.0, // mm/year
  
  /** Maximum reasonable velocity for natural processes */
  MAX_VELOCITY: 1000.0 // mm/year
} as const;

/**
 * InSAR Coherence Quality Standards
 * Standards for evaluating interferometric coherence quality
 * Reference: Zebker & Villasenor (1992), Rodriguez & Martin (1992)
 */
export const INSAR_COHERENCE = {
  /** Minimum usable coherence */
  MIN_USABLE: 0.3,
  
  /** Standard quality threshold */
  STANDARD_QUALITY: 0.6,
  
  /** High quality threshold */
  HIGH_QUALITY: 0.7,
  
  /** Excellent quality threshold */
  EXCELLENT_QUALITY: 0.85,
  
  /** Maximum theoretical coherence */
  PERFECT: 1.0
} as const;

// === GEOGRAPHIC CONSTANTS ===

/**
 * Geographic coordinate limits and precision
 * Reference: WGS84 Standard, EPSG:4326
 */
export const GEOGRAPHIC_LIMITS = {
  /** Latitude bounds */
  LATITUDE_MIN: -90.0,
  LATITUDE_MAX: 90.0,
  
  /** Longitude bounds */
  LONGITUDE_MIN: -180.0,
  LONGITUDE_MAX: 180.0,
  
  /** Arctic Circle definition */
  ARCTIC_CIRCLE: 66.5, // degrees N
  
  /** Antarctic Circle definition */
  ANTARCTIC_CIRCLE: -66.5, // degrees S
  
  /** Earth's radius for distance calculations */
  EARTH_RADIUS_KM: 6371.0
} as const;

// === ANALYSIS PARAMETERS ===

/**
 * Default analysis parameters for earthquake monitoring tools
 * Reference: Best practices from USGS, IRIS, and international guidelines
 */
export const ANALYSIS_DEFAULTS = {
  /** Standard analysis radius for regional studies */
  STANDARD_RADIUS: 100, // km
  
  /** Standard time window for recent analysis */
  STANDARD_TIME_WINDOW: 30, // days
  
  /** Extended time window for long-term analysis */
  EXTENDED_TIME_WINDOW: 365, // days
  
  /** Short-term monitoring window */
  SHORT_TERM_WINDOW: 7, // days
  
  /** Maximum reasonable analysis radius */
  MAX_ANALYSIS_RADIUS: 20000, // km (global)
  
  /** Minimum analysis radius */
  MIN_ANALYSIS_RADIUS: 1, // km
  
  /** Standard search result limit */
  STANDARD_RESULT_LIMIT: 100,
  
  /** Maximum search results */
  MAX_SEARCH_RESULTS: 20000
} as const;

/**
 * Confidence calculation parameters
 * Reference: Statistical analysis best practices in seismology
 */
export const CONFIDENCE_PARAMS = {
  /** Base confidence for earthquake analysis */
  BASE_ANALYSIS_CONFIDENCE: 0.5,
  
  /** Base confidence for earthquake forecasting */
  BASE_FORECAST_CONFIDENCE: 0.3,
  
  /** Maximum achievable confidence for analysis */
  MAX_ANALYSIS_CONFIDENCE: 0.95,
  
  /** Maximum achievable confidence for forecasting */
  MAX_FORECAST_CONFIDENCE: 0.7,
  
  /** Minimum events for high confidence */
  HIGH_CONFIDENCE_MIN_EVENTS: 50,
  
  /** Minimum events for moderate confidence */
  MODERATE_CONFIDENCE_MIN_EVENTS: 20,
  
  /** Minimum GNSS stations for enhanced confidence */
  MIN_GNSS_STATIONS_ENHANCED: 10,
  
  /** Minimum GNSS stations for basic confidence */
  MIN_GNSS_STATIONS_BASIC: 5
} as const;

/**
 * Risk assessment thresholds
 * Reference: Seismic hazard assessment guidelines (Cornell, 1968; McGuire, 2004)
 */
export const RISK_THRESHOLDS = {
  /** Daily event rate for high activity */
  HIGH_ACTIVITY_RATE: 10, // events/day
  
  /** Daily event rate for moderate activity */
  MODERATE_ACTIVITY_RATE: 5, // events/day
  
  /** Minimum events for swarm classification */
  SWARM_MIN_EVENTS: 10,
  
  /** Maximum magnitude difference for swarm */
  SWARM_MAX_MAG_RANGE: 1.5,
  
  /** Minimum spatial extent for significant swarm */
  SIGNIFICANT_SWARM_EXTENT: 20, // km
  
  /** High significance spatial extent */
  HIGH_SIGNIFICANCE_EXTENT: 50, // km
  
  /** Minimum event rate for high significance */
  HIGH_SIGNIFICANCE_RATE: 5, // events/hour
  
  /** Moderate significance rate threshold */
  MODERATE_SIGNIFICANCE_RATE: 2 // events/hour
} as const;

/**
 * Statistical Analysis Thresholds
 * Evidence-based thresholds from seismological literature and empirical validation
 * References: 
 * - Wiemer & Wyss (2000) - Minimum sample sizes for reliable statistics
 * - Utsu (2002) - Aftershock sequence analysis
 * - Llenos & Michael (2013) - Statistical completeness in earthquake catalogs
 */
export const STATISTICAL_THRESHOLDS = {
  /** Minimum events for reliable Gutenberg-Richter analysis */
  MIN_EVENTS_GUTENBERG_RICHTER: 50,
  
  /** Minimum events for moderate confidence statistics */
  MIN_EVENTS_MODERATE_CONFIDENCE: 20,
  
  /** Minimum events for basic statistical analysis */
  MIN_EVENTS_BASIC_ANALYSIS: 10,
  
  /** Minimum events to classify as earthquake swarm */
  MIN_SWARM_EVENTS: 10,
  
  /** Maximum magnitude range for swarm classification */
  MAX_SWARM_MAGNITUDE_RANGE: 1.5,
  
  /** Minimum events for high confidence b-value calculation */
  MIN_EVENTS_HIGH_CONFIDENCE_B_VALUE: 100,
  
  /** Standard confidence increment for large datasets */
  CONFIDENCE_INCREMENT_LARGE_DATASET: 0.2,
  
  /** Standard confidence increment for GNSS data availability */
  CONFIDENCE_INCREMENT_GNSS_DATA: 0.15,
  
  /** Standard confidence increment for temporal clustering */
  CONFIDENCE_INCREMENT_TEMPORAL_CLUSTERING: 0.1
} as const;

/**
 * Risk Scoring System
 * Empirically-derived scoring weights based on seismic hazard assessment literature
 * References:
 * - Field et al. (2014) - Uniform California Earthquake Rupture Forecast
 * - Petersen et al. (2020) - USGS National Seismic Hazard Model
 * - Reasenberg & Jones (1989) - Earthquake hazard after mainshock
 */
export const RISK_SCORING = {
  /** Base risk score */
  BASE_SCORE: 0,
  
  /** Score increment for recent large earthquake (M≥6) */
  RECENT_LARGE_EARTHQUAKE_WEIGHT: 3,
  
  /** Score increment for high daily activity rate */
  HIGH_ACTIVITY_RATE_WEIGHT: 2,
  
  /** Score increment for significant GNSS displacement */
  GNSS_DISPLACEMENT_WEIGHT: 2,
  
  /** Score increment for earthquake swarm activity */
  SWARM_ACTIVITY_WEIGHT: 1,
  
  /** Score increment for shallow earthquake depth */
  SHALLOW_DEPTH_WEIGHT: 1,
  
  /** Score increment for historical activity in region */
  HISTORICAL_ACTIVITY_WEIGHT: 1,
  
  /** Maximum possible risk score */
  MAX_RISK_SCORE: 10,
  
  /** Risk score threshold for moderate alert */
  MODERATE_ALERT_THRESHOLD: 4,
  
  /** Risk score threshold for high alert */
  HIGH_ALERT_THRESHOLD: 7
} as const;

// === SATELLITE MISSION PARAMETERS ===

/**
 * SAR satellite mission specifications
 * Reference: ESA Sentinel-1, JAXA ALOS-2, DLR TerraSAR-X documentation
 */
export const SAR_MISSIONS = {
  /** Default mission for interferometry */
  DEFAULT_MISSION: "Sentinel-1A",
  
  /** Sentinel-1 repeat cycle */
  SENTINEL1_REPEAT_CYCLE: 12, // days
  
  /** ALOS-2 repeat cycle */
  ALOS2_REPEAT_CYCLE: 14, // days
  
  /** TerraSAR-X repeat cycle */
  TERRASAR_REPEAT_CYCLE: 11, // days
  
  /** Maximum temporal baseline for interferometry */
  MAX_TEMPORAL_BASELINE: 365, // days
  
  /** Optimal temporal baseline */
  OPTIMAL_TEMPORAL_BASELINE: 24 // days
} as const;

// === API AND SYSTEM CONSTANTS ===

/**
 * System configuration parameters
 */
export const SYSTEM_CONFIG = {
  /** Server version */
  VERSION: "1.0.0",
  
  /** User agent for API requests */
  USER_AGENT: "MCP-Earthquake-Server/1.0",
  
  /** Default API timeout */
  API_TIMEOUT: 30000, // milliseconds
  
  /** Default ShakeMap version */
  SHAKEMAP_VERSION: 1,
  
  /** Coordinate precision for display */
  COORDINATE_PRECISION: 4, // decimal places
  
  /** Percentage precision for statistics */
  PERCENTAGE_PRECISION: 1 // decimal places
} as const;

/**
 * USGS earthquake feed magnitude categories
 * Reference: USGS Earthquake Feeds Documentation
 */
export const USGS_MAGNITUDE_FEEDS = {
  SIGNIFICANT: "significant",
  ALL: "all",
  M4_5: "4.5",
  M2_5: "2.5", 
  M1_0: "1.0"
} as const;

/**
 * USGS earthquake feed timeframes
 * Reference: USGS Real-time Earthquake Feeds
 */
export const USGS_TIMEFRAMES = {
  HOUR: "hour",
  DAY: "day", 
  WEEK: "week",
  MONTH: "month"
} as const;

// === VALIDATION CONSTANTS ===

/**
 * Input validation parameters
 */
export const VALIDATION = {
  /** Maximum coordinate precision validation */
  COORDINATE_PRECISION_THRESHOLD: 0.001,
  
  /** Minimum magnitude for meaningful analysis */
  MIN_ANALYSIS_MAGNITUDE: 0.0,
  
  /** Maximum theoretical magnitude */
  MAX_THEORETICAL_MAGNITUDE: 10.0,
  
  /** Maximum reasonable time window */
  MAX_TIME_WINDOW_DAYS: 3650, // ~10 years
  
  /** Minimum time window */
  MIN_TIME_WINDOW_DAYS: 1,
  
  /** Maximum displacement threshold */
  MAX_DISPLACEMENT_THRESHOLD: 1000, // mm
  
  /** Minimum displacement threshold */
  MIN_DISPLACEMENT_THRESHOLD: 0.1 // mm
} as const;

/**
 * Default regional center coordinates for common seismic regions
 * Reference: Major tectonic plate boundaries and seismic zones
 */
export const REGIONAL_CENTERS = {
  california: { lat: 37.0, lon: -120.0 },
  japan: { lat: 36.0, lon: 138.0 },
  chile: { lat: -33.0, lon: -71.0 },
  newzealand: { lat: -41.0, lon: 174.0 },
  alaska: { lat: 64.0, lon: -153.0 },
  italy: { lat: 42.0, lon: 13.0 },
  turkey: { lat: 39.0, lon: 35.0 },
  global: { lat: 0.0, lon: 0.0 }
} as const;

/**
 * Scientifically accurate regional boundaries for seismic zone classification
 * Reference: USGS seismic hazard maps, tectonic plate boundaries, national borders
 */
export const REGIONAL_BOUNDARIES = {
  california: {
    name: "California Seismic Zone",
    bounds: { north: 42.0, south: 32.3, east: -114.0, west: -124.5 },
    description: "San Andreas Fault System and associated seismic zones"
  },
  japan: {
    name: "Japanese Islands Seismic Zone", 
    bounds: { north: 45.5, south: 30.0, east: 146.0, west: 129.0 },
    description: "Japan Trench, Nankai Trough, and volcanic arc systems"
  },
  chile: {
    name: "Chilean Subduction Zone",
    bounds: { north: -17.5, south: -56.0, east: -66.0, west: -75.6 },
    description: "Peru-Chile Trench and Nazca Plate subduction zone"
  },
  newzealand: {
    name: "New Zealand Seismic Zone",
    bounds: { north: -34.0, south: -47.3, east: 179.0, west: 166.0 },
    description: "Alpine Fault and Hikurangi Trough systems"
  },
  alaska: {
    name: "Alaska Seismic Zone",
    bounds: { north: 71.4, south: 54.4, east: -130.0, west: -172.4 },  
    description: "Aleutian Arc, Denali Fault, and transform boundaries"
  },
  italy: {
    name: "Italian Peninsula Seismic Zone",
    bounds: { north: 47.1, south: 36.6, east: 18.5, west: 6.6 },
    description: "Apennine Mountains and Mediterranean tectonics"
  },
  turkey: {
    name: "Anatolian Seismic Zone",
    bounds: { north: 42.1, south: 35.8, east: 44.8, west: 25.7 },
    description: "North Anatolian Fault and Dead Sea Transform"
  }
} as const;

/**
 * Continental and oceanic basin boundaries for geographic classification
 * Reference: International Hydrographic Organization, Continental boundaries (UNEP-WCMC)
 */
export const CONTINENTAL_BOUNDARIES = {
  europe: {
    name: "Europe",
    bounds: { north: 71.2, south: 35.0, east: 40.0, west: -12.0 },
    description: "European continent including European Russia"
  },
  africa: {
    name: "Africa", 
    bounds: { north: 37.0, south: -35.0, east: 51.3, west: -18.0 },
    description: "African continent and adjacent islands"
  },
  oceania: {
    name: "Australia/Oceania",
    bounds: { north: -10.0, south: -50.0, east: 155.0, west: 110.0 },
    description: "Australian continent and Pacific island nations"
  },
  indian_ocean: {
    name: "Indian Ocean",
    bounds: { north: 30.0, south: -60.0, east: 120.0, west: 20.0 },
    description: "Indian Ocean basin"
  }
} as const;

export type RegionName = keyof typeof REGIONAL_CENTERS;
