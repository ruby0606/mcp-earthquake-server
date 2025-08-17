// Test to show how the model gets date information
import { USGSDataProvider } from './dist/providers/usgs-provider.js';

async function demonstrateDateSources() {
  console.log('📅 How the MCP Server Determines Dates:\n');
  
  const usgsProvider = new USGSDataProvider();
  
  try {
    console.log('1. 🖥️  SYSTEM DATE (JavaScript new Date()):');
    console.log(`   Current system date: ${new Date().toISOString()}`);
    console.log(`   Current local time: ${new Date().toLocaleString()}`);
    console.log(`   Date components: ${new Date().toISOString().split('T')[0]}`);
    
    console.log('\n2. 📡 EARTHQUAKE DATA TIMESTAMPS (from USGS API):');
    const earthquakes = await usgsProvider.getEarthquakes('significant', 'week');
    
    if (earthquakes.features.length > 0) {
      const recent = earthquakes.features[0];
      console.log(`   Latest earthquake time (raw): ${recent.properties.time}`);
      console.log(`   Converted to Date: ${new Date(recent.properties.time).toISOString()}`);
      console.log(`   Human readable: ${new Date(recent.properties.time).toLocaleString()}`);
      console.log(`   Date only: ${new Date(recent.properties.time).toISOString().split('T')[0]}`);
    }
    
    console.log('\n3. 🔄 API METADATA TIMESTAMPS:');
    console.log(`   Feed generated: ${new Date(earthquakes.metadata.generated).toLocaleString()}`);
    console.log(`   Feed URL: ${earthquakes.metadata.url}`);
    
    console.log('\n4. ⏰ DEFAULT TIME RANGES (when user doesn\'t specify):');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    console.log(`   30 days ago: ${thirtyDaysAgo.toISOString()}`);
    console.log(`   Current time: ${new Date().toISOString()}`);
    
    console.log('\n📊 DATE SOURCES SUMMARY:');
    console.log('✅ System Clock: JavaScript Date.now() and new Date()');
    console.log('✅ Earthquake Times: USGS provides Unix timestamps in milliseconds');
    console.log('✅ API Metadata: USGS includes feed generation timestamps');  
    console.log('✅ Time Calculations: JavaScript calculates relative times (30 days ago, etc.)');
    console.log('✅ No Hardcoded Dates: All dates are dynamic and real-time');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

demonstrateDateSources();
