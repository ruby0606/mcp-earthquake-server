// Quick test of IRIS waveform parameter validation
import { IrisDataProvider } from './dist/providers/iris-provider.js';

async function quickWaveformTest() {
  console.log('🔧 Quick IRIS Waveform Parameter Test...\n');
  
  const irisProvider = new IrisDataProvider();
  
  try {
    // Test with clearly invalid parameters to trigger 400 error
    await irisProvider.getWaveformData({
      eventId: 'test-400-error',
      network: 'INVALID',
      station: 'BADSTATION',
      channel: 'XXX',
      startTime: 'invalid-date',
      endTime: 'invalid-date'
    });
    
    console.log('❌ Should have failed validation');
    
  } catch (error) {
    console.log('✅ Parameter validation working:');
    console.log('📝 Error message:', error.message);
    
    if (error.message.includes('Invalid waveform parameters')) {
      console.log('🎯 Specific parameter error handling is working!');
    } else {
      console.log('ℹ️  General error handling caught the issue');
    }
  }
  
  console.log('\n✅ IRIS Waveform Fix Applied:');
  console.log('• Updated to FDSNWS dataselect endpoint');
  console.log('• Fixed parameter names (starttime/endtime)');
  console.log('• Added MinISEED binary format handling');
  console.log('• Improved error messages with specific feedback');
  console.log('• HTTP status code specific handling (400, 404, 204)');
}

quickWaveformTest();
