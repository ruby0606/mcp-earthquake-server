# 🌍 MCP Earthquake Monitoring Server for Researchers

A specialized tool for seismologists, geophysicists, and earthquake researchers providing comprehensive access to global seismic data through a unified interface.

## ⚠️ **RESEARCH DATA USAGE NOTICE**

**This tool provides access to authoritative earthquake data sources. When using this data in research publications, please:**

1. **Cite Data Sources**: Include proper acknowledgments for IRIS, USGS, GNSS networks, and satellite missions
2. **Follow Academic Standards**: Respect institutional data sharing policies
3. **Verify Critical Results**: Cross-reference important findings with multiple sources
4. **Non-Emergency Use**: This is not suitable for earthquake emergency response or public safety warnings

**See README.md "Data Attribution & Usage" section for complete citation requirements.**

## 🎯 For Seismologists and Researchers

### What This Tool Provides
- **Multi-source Integration**: IRIS + USGS + GNSS data in one interface
- **Global Coverage**: No geographic restrictions - monitor worldwide
- **Real-time Data**: Live earthquake feeds and rapid analysis capabilities
- **Research-grade Quality**: Validated algorithms and authoritative data sources
- **Automated Analysis**: Statistical analysis, pattern recognition, hazard assessment

### Quick Research Applications

#### 🔍 Regional Seismic Hazard Assessment
```javascript
// Analyze earthquake patterns around Istanbul, Turkey
const istanbulRisk = await client.callTool({
  name: "analyze-seismic-activity",
  arguments: {
    latitude: 41.0082,
    longitude: 28.9784,
    radius: 300,        // 300km around city
    timeWindow: 365,    // 1 year of data
    minMagnitude: 2.5
  }
});
```

#### 📡 Crustal Deformation Studies  
```javascript
// Monitor GNSS displacement across the San Andreas system
const saDeformation = await client.callTool({
  name: "monitor-gnss-displacement",
  arguments: {
    region: "california",
    threshold: 2.0,     // 2mm displacement threshold
    timeWindow: 30      // Monthly monitoring
  }
});
```


#### ⚡ Rapid Response Analysis
```javascript
// Get ShakeMap data for recent significant earthquake  
const shakeMap = await client.callTool({
  name: "get-usgs-shakemap",
  arguments: {
    eventId: "us6000m2xt"  // Recent earthquake ID
  }
});
```

### Research Capabilities

#### Statistical Analysis
- **Gutenberg-Richter Analysis**: Automatic b-value calculation
- **Completeness Assessment**: Magnitude completeness thresholds
- **Temporal Patterns**: Accelerating/decelerating seismicity detection
- **Spatial Clustering**: Earthquake swarm identification

#### Multi-parameter Correlation
- **Seismic + GNSS**: Correlate earthquakes with crustal deformation
- **Temporal Analysis**: Pre-seismic, co-seismic, post-seismic patterns
- **Cross-validation**: Multiple data source verification

#### Hazard Assessment
- **Probabilistic Analysis**: Earthquake probability calculations
- **Scenario Modeling**: "What-if" earthquake impact analysis
- **Building Code Applications**: Design parameter extraction
- **Risk Communication**: Clear, quantified risk summaries

### Data Quality and Validation

#### IRIS Integration
- **Global Catalog**: ISC, NEIC, regional network integration
- **Waveform Access**: Broad-band, strong-motion, infrasound
- **Station Metadata**: Complete instrument response information
- **Quality Flags**: Data quality assessment and filtering

#### USGS Real-time Feeds
- **Authoritative Source**: Official US earthquake information
- **Global Coverage**: Worldwide event detection and location
- **Rapid Updates**: 1-5 minute earthquake notification
- **Impact Assessment**: ShakeMap, PAGER, tsunami evaluation

#### GNSS Networks
- **Millimeter Precision**: High-accuracy displacement measurements  
- **Continuous Monitoring**: 24/7 crustal deformation tracking
- **Regional Networks**: PBO, GEONET, RING, COCONet integration
- **Anomaly Detection**: Automated unusual movement identification

## 📚 Research Use Cases

### 🌋 Volcanic Monitoring
- Volcanic earthquake swarm analysis
- Multi-parameter eruption forecasting
- Hazard zone definition and evacuation planning

### 🏗️ Induced Seismicity Research
- Injection-related earthquake monitoring
- Hydraulic fracturing seismic analysis
- Mining-induced seismicity assessment
- Geothermal field earthquake characterization

### 🌊 Tsunami Research
- Tsunami-generating earthquake identification
- Seafloor deformation estimation
- Coastal impact assessment preparation
- Multi-hazard risk evaluation

### 📊 Statistical Seismology
- Regional seismicity pattern analysis
- Earthquake clustering and triggering studies
- Stress transfer and Coulomb modeling validation
- Seismic cycle research and characterization

### 🔬 Earthquake Physics
- Fault zone behavior analysis
- Earthquake preparation process investigation
- Aftershock sequence statistical analysis
- Slow slip event detection and characterization

## 🎓 Educational Applications

### Graduate Research Projects
- Thesis/dissertation data collection and analysis
- Multi-parameter earthquake case studies
- Regional hazard assessment projects
- Seismic network optimization studies

### Classroom Integration
- Real-time earthquake demonstration
- Seismic hazard education tools
- Data analysis skill development
- Scientific method application

### Training Workshops
- Seismic data analysis training
- Multi-source data integration methods
- Modern seismological tool usage
- Research methodology development

## 🔬 Advanced Research Features

### Custom Analysis Workflows
```javascript
// Multi-stage analysis pipeline
const comprehensiveStudy = async (region) => {
  // 1. Get baseline seismicity
  const baseline = await client.callTool({
    name: "analyze-seismic-activity",
    arguments: { ...region, timeWindow: 365 }
  });
  
  // 2. Check for crustal deformation
  const gnss = await client.callTool({
    name: "monitor-gnss-displacement", 
    arguments: { region: region.name, timeWindow: 30 }
  });
  
  // 3. Cross-correlate results
  return { baseline, gnss, correlation: analyzeCorrelation(baseline, gnss) };
};
```

### Publication-Quality Output
- **Standardized Metrics**: Industry-standard calculations and parameters
- **Statistical Validation**: Confidence intervals and uncertainty estimates  
- **Reproducible Results**: Documented methods and data provenance
- **Citation Support**: Proper attribution to data sources and methods

### Collaborative Research
- **Shared Analysis**: Consistent methods across research groups
- **Data Standardization**: Common formats and coordinate systems
- **Multi-institutional**: Compatible with various research workflows
- **Open Science**: Transparent methods and accessible data sources

## 📖 Scientific Background

### Theoretical Foundation
This server implements established seismological methods:
- **Gutenberg-Richter Law**: log N = a - bM relationship
- **Omori's Law**: Aftershock decay rate analysis  
- **ETAS Models**: Epidemic-type aftershock sequence modeling
- **Coulomb Stress**: Static stress transfer calculations

### Data Processing Standards
- **FDSN Compliance**: International seismology data standards
- **ISO Coordinates**: Standard geographic coordinate systems
- **UTC Timing**: Coordinated Universal Time for all events
- **Magnitude Scales**: Ml, Mb, Ms, Mw scale conversions and preferences

### Quality Control
- **Automatic Validation**: Data quality checks and filtering
- **Uncertainty Quantification**: Error estimates and confidence levels
- **Cross-validation**: Multiple source verification when available
- **Outlier Detection**: Statistical anomaly identification and flagging

## 🏆 Benefits for Research Community

### Efficiency Gains
- **Unified Interface**: No need to learn multiple API systems
- **Automated Processing**: Reduces manual data collection time
- **Standardized Output**: Consistent analysis across projects
- **Rapid Prototyping**: Quick hypothesis testing and validation

### Enhanced Capabilities  
- **Multi-source Integration**: Capabilities beyond single data sources
- **Global Perspective**: Worldwide analysis without geographic limitations
- **Real-time Analysis**: Immediate access to current earthquake activity
- **Historical Context**: Long-term trend analysis and pattern recognition

### Research Quality
- **Reproducible Science**: Documented methods and consistent results
- **Peer Validation**: Community-verified analysis methods
- **Open Access**: Democratic access to high-quality seismic data
- **Collaboration**: Shared tools and standardized approaches

---

## 🚀 Getting Started for Researchers

1. **Install the server** following the Developer Setup Guide
2. **Connect via Claude Desktop** or your preferred MCP client
3. **Start with a simple analysis** of your research area
4. **Explore multi-parameter studies** combining different data types
5. **Integrate into your research workflow** for ongoing projects

### Need Help?
- **Scientific Questions**: Open GitHub discussions for research applications
- **Technical Issues**: Submit GitHub issues for bugs or feature requests
- **Collaboration**: Contact for multi-institutional research projects
- **Training**: Request workshops for research groups and institutions

**🌍 Advancing Earthquake Science Through Open, Accessible, and Comprehensive Data Integration 🌍**
