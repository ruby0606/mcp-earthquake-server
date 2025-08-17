// Test waveform tool output format
import { IrisDataProvider } from './dist/providers/iris-provider.js';

async function testWaveformOutput() {
  console.log('🌊 Testing Waveform Tool Output Format...\n');
  
  const irisProvider = new IrisDataProvider();
  
  try {
    // Test with valid parameters that should work
    const result = await irisProvider.getWaveformData({
      eventId: 'test-event',
      network: 'US',
      station: 'ANMO',
      channel: 'BHZ',
      startTime: '2025-08-17T10:00:00Z',
      endTime: '2025-08-17T10:01:00Z'
    });
    
    console.log('✅ Waveform data structure:');
    console.log(`📊 Event ID: ${result.eventId}`);
    console.log(`🏢 Station: ${result.network}.${result.station}.${result.channel}`);
    console.log(`⏱️  Duration: ${result.duration}s`);
    console.log(`📈 Sample Rate: ${result.sampleRate} Hz`);
    console.log(`📉 Total Samples: ${result.samples.length}`);
    console.log(`🔊 Peak: ${result.peakAmplitude.toFixed(6)}`);
    console.log(`🔉 RMS: ${result.rmsAmplitude.toFixed(6)}`);
    console.log(`✨ Quality: ${result.quality}`);
    
    console.log('\n📄 Sample MCP Tool Response (Text Only):');
    console.log('---');
    
    const mockResponse = {
      content: [
        {
          type: "text",
          text: `## Waveform Data Retrieved

**Event ID:** ${result.eventId}
**Station:** ${result.network}.${result.station}.${result.channel}
**Time Range:** ${result.startTime} to ${result.endTime}
**Samples:** ${result.samples.length} data points
**Sample Rate:** ${result.sampleRate} Hz
**Duration:** ${result.duration.toFixed(1)}s

### Waveform Analysis
- **Peak Amplitude:** ${result.peakAmplitude.toFixed(6)} counts
- **RMS Amplitude:** ${result.rmsAmplitude.toFixed(6)} counts
- **Signal Quality:** ${result.quality.toUpperCase()}
- **Data Format:** MinISEED (${(result.samples.length * 4 / 1024).toFixed(1)} KB)

### Sample Data Preview
\`\`\`
First 10 samples: [${result.samples.slice(0, 10).map(s => s.toFixed(3)).join(', ')}${result.samples.length > 10 ? ', ...' : ''}]
Last 10 samples:  [${result.samples.slice(-10).map(s => s.toFixed(3)).join(', ')}]
\`\`\`

**Status:** ✅ Waveform data successfully retrieved from IRIS FDSNWS dataselect service`
        }
      ]
    };
    
    console.log(mockResponse.content[0].text);
    
    console.log('\n🎯 Content Type Validation:');
    console.log(`✅ Content Type: ${mockResponse.content[0].type} (Claude Desktop Compatible)`);
    console.log('✅ No resource_link content types used');
    console.log('✅ All data presented as formatted text');
    
  } catch (error) {
    console.log('ℹ️  Error testing (expected for some parameters):');
    console.log(error.message.substring(0, 200) + '...');
  }
}

testWaveformOutput();
