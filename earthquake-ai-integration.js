/**
 * Earthquake AI Integration Module
 * 
 * This module provides functions to integrate AI earthquake summaries
 * from the MCP server into your existing earthquake dashboard.
 * 
 * Usage:
 * 1. Include this file in your HTML: <script src="earthquake-ai-integration.js"></script>
 * 2. Call EarthquakeAI.getSummary() to get AI analysis
 * 3. Call EarthquakeAI.getRecentEarthquakes() to get latest data
 */

window.EarthquakeAI = {
    // Base URL for the MCP API server
    API_BASE: 'http://localhost:5001/api/earthquakes',
    
    /**
     * Get AI-powered earthquake summary
     * @param {string} type - Summary type: 'daily', 'weekly', 'monthly'
     * @param {boolean} includePredictions - Include risk predictions
     * @returns {Promise<Object>} AI summary data
     */
    async getSummary(type = 'daily', includePredictions = true) {
        try {
            const url = `${this.API_BASE}/summary?type=${type}&include_predictions=${includePredictions}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Parse the AI summary from the response
            if (data.content && data.content[0] && data.content[0].text) {
                const summaryData = JSON.parse(data.content[0].text);
                return {
                    success: true,
                    summary: summaryData.summary,
                    keyFindings: summaryData.key_findings,
                    riskAssessment: summaryData.risk_assessment,
                    recommendations: summaryData.recommendations,
                    rawData: summaryData
                };
            }
            
            return { success: false, error: 'Invalid response format' };
            
        } catch (error) {
            console.error('Error fetching AI summary:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get recent earthquakes with AI analysis
     * @param {number} magnitudeMin - Minimum magnitude (default: 2.5)
     * @param {number} limit - Maximum number of results (default: 50)
     * @param {number} days - Days to look back (default: 7)
     * @returns {Promise<Object>} Recent earthquake data
     */
    async getRecentEarthquakes(magnitudeMin = 2.5, limit = 50, days = 7) {
        try {
            const url = `${this.API_BASE}/recent?magnitude_min=${magnitudeMin}&limit=${limit}&days=${days}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.content && data.content[0] && data.content[0].text) {
                const earthquakeData = JSON.parse(data.content[0].text);
                return {
                    success: true,
                    count: earthquakeData.count,
                    earthquakes: earthquakeData.earthquakes,
                    maxMagnitude: earthquakeData.max_magnitude,
                    avgMagnitude: earthquakeData.avg_magnitude,
                    rawData: earthquakeData
                };
            }
            
            return { success: false, error: 'Invalid response format' };
            
        } catch (error) {
            console.error('Error fetching recent earthquakes:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Analyze earthquake patterns for a region
     * @param {string} region - Region to analyze (default: 'global')
     * @param {string} timeWindow - Time window: '1d', '7d', '30d' (default: '7d')
     * @param {number} magnitudeThreshold - Minimum magnitude for analysis (default: 4.0)
     * @returns {Promise<Object>} Pattern analysis data
     */
    async analyzePatterns(region = 'global', timeWindow = '7d', magnitudeThreshold = 4.0) {
        try {
            const url = `${this.API_BASE}/patterns?region=${region}&time_window=${timeWindow}&magnitude_threshold=${magnitudeThreshold}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.content && data.content[0] && data.content[0].text) {
                const patternData = JSON.parse(data.content[0].text);
                return {
                    success: true,
                    analysis: patternData.analysis,
                    patterns: patternData.patterns,
                    trends: patternData.trends,
                    riskLevel: patternData.risk_level,
                    rawData: patternData
                };
            }
            
            return { success: false, error: 'Invalid response format' };
            
        } catch (error) {
            console.error('Error analyzing patterns:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get significant earthquakes
     * @param {number} daysBack - Days to look back (default: 30)
     * @param {boolean} includeAftershocks - Include aftershocks (default: true)
     * @returns {Promise<Object>} Significant earthquake data
     */
    async getSignificantEarthquakes(daysBack = 30, includeAftershocks = true) {
        try {
            const url = `${this.API_BASE}/significant?days_back=${daysBack}&include_aftershocks=${includeAftershocks}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.content && data.content[0] && data.content[0].text) {
                const significantData = JSON.parse(data.content[0].text);
                return {
                    success: true,
                    count: significantData.count,
                    earthquakes: significantData.earthquakes,
                    summary: significantData.summary,
                    rawData: significantData
                };
            }
            
            return { success: false, error: 'Invalid response format' };
            
        } catch (error) {
            console.error('Error fetching significant earthquakes:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Test the API connection
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.API_BASE}/test`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error testing connection:', error);
            return { status: 'error', message: error.message };
        }
    },
    
    /**
     * Create an AI summary widget for your dashboard
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Configuration options
     */
    async createSummaryWidget(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID ${containerId} not found`);
            return;
        }
        
        // Default options
        const config = {
            title: '🤖 AI Earthquake Analysis',
            summaryType: 'daily',
            includePredictions: true,
            autoRefresh: true,
            refreshInterval: 300000, // 5 minutes
            ...options
        };
        
        // Create widget HTML
        container.innerHTML = `
            <div class="ai-summary-widget" style="
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                margin: 10px 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            ">
                <h3 style="margin: 0 0 15px 0; display: flex; align-items: center;">
                    ${config.title}
                    <span id="loading-indicator" style="margin-left: 10px; font-size: 14px;">⏳ Loading...</span>
                </h3>
                <div id="ai-summary-content">
                    <p>Fetching AI analysis...</p>
                </div>
                <div id="refresh-info" style="
                    margin-top: 15px;
                    font-size: 12px;
                    opacity: 0.8;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    padding-top: 10px;
                ">
                    Last updated: Never
                </div>
            </div>
        `;
        
        // Function to update the widget
        const updateWidget = async () => {
            const loadingIndicator = document.getElementById('loading-indicator');
            const content = document.getElementById('ai-summary-content');
            const refreshInfo = document.getElementById('refresh-info');
            
            try {
                loadingIndicator.textContent = '⏳ Loading...';
                
                const summaryData = await this.getSummary(config.summaryType, config.includePredictions);
                
                if (summaryData.success) {
                    content.innerHTML = `
                        <div style="margin-bottom: 15px;">
                            <strong>📊 Summary:</strong><br>
                            <span style="font-size: 14px; line-height: 1.5;">${summaryData.summary}</span>
                        </div>
                        ${summaryData.keyFindings ? `
                        <div style="margin-bottom: 15px;">
                            <strong>🔍 Key Findings:</strong><br>
                            <ul style="margin: 5px 0 0 20px; font-size: 14px;">
                                ${summaryData.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        ${summaryData.riskAssessment ? `
                        <div style="margin-bottom: 15px;">
                            <strong>⚠️ Risk Assessment:</strong><br>
                            <span style="font-size: 14px; line-height: 1.5;">${summaryData.riskAssessment}</span>
                        </div>
                        ` : ''}
                        ${summaryData.recommendations && summaryData.recommendations.length > 0 ? `
                        <div>
                            <strong>💡 Recommendations:</strong><br>
                            <ul style="margin: 5px 0 0 20px; font-size: 14px;">
                                ${summaryData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    `;
                    loadingIndicator.textContent = '✅ Updated';
                } else {
                    content.innerHTML = `<p style="color: #ffcccc;">❌ Error: ${summaryData.error}</p>`;
                    loadingIndicator.textContent = '❌ Error';
                }
                
                refreshInfo.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
                
            } catch (error) {
                content.innerHTML = `<p style="color: #ffcccc;">❌ Error: ${error.message}</p>`;
                loadingIndicator.textContent = '❌ Error';
            }
        };
        
        // Initial load
        await updateWidget();
        
        // Auto refresh if enabled
        if (config.autoRefresh) {
            setInterval(updateWidget, config.refreshInterval);
        }
        
        // Return update function so user can manually refresh
        return updateWidget;
    }
};

// Example usage functions for easy integration
window.EarthquakeAI.examples = {
    /**
     * Simple example: Add AI summary to existing element
     */
    async addSimpleSummary(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const summary = await EarthquakeAI.getSummary();
        if (summary.success) {
            element.innerHTML = `
                <div style="padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; margin: 10px 0;">
                    <h4>🤖 AI Analysis</h4>
                    <p>${summary.summary}</p>
                </div>
            `;
        }
    },
    
    /**
     * Create a comprehensive dashboard section
     */
    async createDashboardSection(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div id="ai-summary-section"></div>
                <div id="ai-patterns-section"></div>
            </div>
        `;
        
        // Add AI summary widget
        await EarthquakeAI.createSummaryWidget('ai-summary-section');
        
        // Add pattern analysis
        const patternsContainer = document.getElementById('ai-patterns-section');
        const patterns = await EarthquakeAI.analyzePatterns();
        
        if (patterns.success) {
            patternsContainer.innerHTML = `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f8f9fa;">
                    <h3>📈 Pattern Analysis</h3>
                    <p><strong>Risk Level:</strong> ${patterns.riskLevel}</p>
                    <p>${patterns.analysis}</p>
                </div>
            `;
        }
    }
};

console.log('🌍 Earthquake AI Integration Module loaded!');
console.log('Usage: EarthquakeAI.getSummary(), EarthquakeAI.createSummaryWidget("container-id")');
