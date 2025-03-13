/**
 * Utility script to verify DeepSeek AI integration
 * This script tests the DeepSeek API connection and question generation
 */

const apiClient = require('../src/services/apiClient').default;
const env = require('../src/utils/environment').default;

// Sample aviation text for testing
const SAMPLE_TEXT = `
Aircraft Flight Controls

Primary flight controls consist of ailerons, elevators, and the rudder. Ailerons control roll, elevators control pitch, and the rudder controls yaw.

Ailerons are located on the trailing edge of each wing and move in opposite directions. When the pilot moves the control wheel (or stick) to the left, the left aileron moves up and the right aileron moves down. This creates differential lift, causing the aircraft to roll to the left.

Elevators are located on the horizontal stabilizer and control the aircraft's pitch. When the pilot pulls back on the control wheel, the elevators move up, creating a downward force on the tail and causing the nose to pitch up.

The rudder is located on the vertical stabilizer and controls yaw. When the pilot pushes the left rudder pedal, the rudder deflects to the left, creating a force that yaws the nose to the left.

Secondary flight controls include flaps, slats, spoilers, and trim systems. Flaps and slats increase lift at lower airspeeds, allowing for slower takeoff and landing speeds. Spoilers reduce lift and increase drag, useful for descent and after landing. Trim systems reduce the pilot's workload by relieving control pressures.
`;

/**
 * Test DeepSeek AI integration
 */
async function testDeepSeekIntegration() {
  console.log('Testing DeepSeek AI Integration');
  console.log('============================');
  
  try {
    // Check if DeepSeek API key is configured
    const apiKey = env.deepseekApiKey;
    if (!apiKey) {
      console.error('❌ DeepSeek API key not found in environment');
      console.log('Please ensure the DeepSeek API key is properly configured in app.json');
      return false;
    }
    
    console.log('✅ DeepSeek API key found');
    
    // Test question generation with DeepSeek
    console.log('\nTesting question generation...');
    console.log('This may take a moment as we connect to the DeepSeek API...');
    
    const result = await apiClient.generateQuestionsWithDeepSeek(SAMPLE_TEXT, {
      questionCount: 2 // Just generate 2 questions for the test
    });
    
    if (!result || !result.rawResponse) {
      console.error('❌ Failed to get response from DeepSeek API');
      return false;
    }
    
    console.log('✅ Successfully received response from DeepSeek API');
    console.log(`Model used: ${result.model}`);
    console.log(`Response length: ${result.rawResponse.length} characters`);
    
    // Parse the first 200 characters to verify content
    const previewText = result.rawResponse.substring(0, 200);
    console.log('\nPreview of DeepSeek response:');
    console.log('---------------------------');
    console.log(previewText + '...');
    
    console.log('\n✅ DeepSeek AI integration is working properly!');
    return true;
  } catch (error) {
    console.error('❌ DeepSeek AI integration test failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Run the test if executed directly
if (require.main === module) {
  testDeepSeekIntegration()
    .then(success => {
      if (success) {
        console.log('\nAll tests passed! Your DeepSeek AI integration is working properly.');
      } else {
        console.log('\nSome tests failed. Please check the error messages above.');
      }
    })
    .catch(error => {
      console.error('Unhandled error during testing:', error);
      process.exit(1);
    });
}

module.exports = { testDeepSeekIntegration };
