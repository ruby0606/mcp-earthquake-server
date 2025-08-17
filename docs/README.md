# MCP Earthquake Server Documentation

This directory contains comprehensive documentation for the MCP Earthquake Server project.

## 📚 Documentation Index

### 🎯 Project Status & Reviews
- **[CURRENT-STATUS-REVIEW.md](CURRENT-STATUS-REVIEW.md)** - Current project status and milestone tracking
- **[CHANGE-REVIEW-CLAUDE-DESKTOP.md](CHANGE-REVIEW-CLAUDE-DESKTOP.md)** - Claude Desktop integration changes and reviews

### 🔬 Technical Reports
- **[GNSS-VALIDATION-REPORT.md](GNSS-VALIDATION-REPORT.md)** - GNSS data source validation and authenticity verification
- **[INSAR-ASF-DAAC-REPORT.md](INSAR-ASF-DAAC-REPORT.md)** - InSAR provider integration with Alaska Satellite Facility DAAC

### 📖 User Guides
- **[EXAMPLES.md](EXAMPLES.md)** - Usage examples and code samples
- **[RESEARCH-GUIDE.md](RESEARCH-GUIDE.md)** - Scientific research and earthquake monitoring guide

### 🧪 Testing Documentation
- **[../test/TEST-VALIDATION-SUMMARY.md](../test/TEST-VALIDATION-SUMMARY.md)** - Comprehensive test validation summary

## 🚀 Quick Start

For initial setup and development, see:
- **[../README.md](../README.md)** - Main project overview and quick start
- **[../DEVELOPER-SETUP.md](../DEVELOPER-SETUP.md)** - Development environment setup instructions

## 📁 Project Structure

```
mcp-earthquake-server/
├── README.md                    # Main project documentation
├── DEVELOPER-SETUP.md          # Development setup guide
├── docs/                       # Extended documentation
│   ├── EXAMPLES.md            # Usage examples
│   ├── RESEARCH-GUIDE.md      # Scientific guide
│   ├── GNSS-VALIDATION-REPORT.md
│   ├── INSAR-ASF-DAAC-REPORT.md
│   ├── CURRENT-STATUS-REVIEW.md
│   └── CHANGE-REVIEW-CLAUDE-DESKTOP.md
├── src/                        # Source code
├── test/                       # Test suite
│   └── TEST-VALIDATION-SUMMARY.md
└── ...
```

## 🌍 Data Sources

The MCP Earthquake Server integrates with multiple authoritative data sources:

- **USGS** - Real-time earthquake feeds and ShakeMap data
- **IRIS** - Seismological waveform data and station networks  
- **GNSS** - GPS displacement monitoring via Nevada Geodetic Laboratory
- **InSAR** - Satellite radar interferometry via ASF DAAC

All data sources provide authentic, real-time geophysical data with zero hallucination risk.

---

**Need Help?** Start with the [README.md](../README.md) and [DEVELOPER-SETUP.md](../DEVELOPER-SETUP.md) in the project root.
