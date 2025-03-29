/**
 * Test script for DeepSeek integration with the app
 * This script uses the actual app code to test the integration
 * 
 * Run with: npx expo run:web -- scripts/test-deepseek-app-integration.js
 */

// Import required modules
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import env from '../src/utils/environment';
import apiClient from '../src/services/apiClient';

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
 * Main test function
 */
async function testDeepSeekIntegration() {
  console.log('\n=== DeepSeek Integration Test ===\n');
  
  // Step 1: Test environment configuration
  console.log('1. Testing environment configuration...');
  await testEnvironmentConfig();
  
  // Step 2: Test DeepSeek API
  console.log('\n2. Testing DeepSeek API...');
  const apiKey = await getDeepSeekApiKey();
  if (!apiKey) {
    console.error('❌ Failed to get DeepSeek API key');
    return;
  }
  
  // Step 3: Test question generation
  console.log('\n3. Testing question generation...');
  await testQuestionGeneration();
}

/**
 * Test environment configuration
 */
async function testEnvironmentConfig() {
  console.log('Environment status:');
  console.log('- Production build:', env.isProductionBuild ? '✅ Yes' : '❌ No');
  console.log('- Standalone build:', env.isStandaloneBuild ? '✅ Yes' : '❌ No');
  console.log('- Expo Go:', env.isExpoGo ? '✅ Yes' : '❌ No');
  
  // Check API keys
  console.log('\nAPI Keys:');
  console.log('- Supabase URL:', env.supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- Supabase Key:', env.supabaseKey ? '✅ Set' : '❌ Missing');
  console.log('- DeepSeek API Key:', env.deepseekApiKey ? '✅ Set' : '❌ Missing');
  
  // Check AsyncStorage
  console.log('\nChecking AsyncStorage:');
  try {
    const storedKey = await AsyncStorage.getItem('deepseek_api_key');
    console.log('- DeepSeek API Key in AsyncStorage:', storedKey ? '✅ Found' : '❌ Not found');
  } catch (error) {
    console.error('❌ Error accessing AsyncStorage:', error.message);
  }
  
  // Check Expo Constants
  console.log('\nChecking Expo Constants:');
  const expoKey = Constants.expoConfig?.extra?.deepseekApiKey;
  console.log('- DeepSeek API Key in Constants:', expoKey ? '✅ Found' : '❌ Not found');
}

/**
 * Get DeepSeek API key from various sources
 */
async function getDeepSeekApiKey() {
  // Try from environment
  let apiKey = env.deepseekApiKey;
  
  // Try from AsyncStorage
  if (!apiKey) {
    try {
      apiKey = await AsyncStorage.getItem('deepseek_api_key');
    } catch (error) {
      console.warn('Failed to get DeepSeek API key from AsyncStorage:', error.message);
    }
  }
  
  // Try from Expo Constants
  if (!apiKey) {
    apiKey = Constants.expoConfig?.extra?.deepseekApiKey;
  }
  
  if (apiKey) {
    const maskedKey = apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4);
    console.log(`✅ Found DeepSeek API key: ${maskedKey}`);
  } else {
    console.error('❌ DeepSeek API key not found in any source');
  }
  
  return apiKey;
}

/**
 * Test question generation with DeepSeek
 */
async function testQuestionGeneration() {
  try {
    console.log('Generating questions with DeepSeek...');
    console.log('This may take a moment...');
    
    const result = await apiClient.generateQuestionsWithDeepSeek(SAMPLE_TEXT, {
      questionCount: 2
    });
    
    if (!result || !result.rawResponse) {
      console.error('❌ Failed to generate questions');
      return false;
    }
    
    console.log('✅ Successfully generated questions');
    console.log(`- Model used: ${result.model}`);
    console.log(`- Response length: ${result.rawResponse.length} characters`);
    
    // Display a preview of the response
    console.log('\nPreview of generated questions:');
    console.log('-------------------------------');
    console.log(result.rawResponse.substring(0, 300) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Question generation failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Run the test if not imported as a module
if (require.main === module) {
  testDeepSeekIntegration().catch(error => {
    console.error('Test failed with error:', error);
  });
}

export { testDeepSeekIntegration, getDeepSeekApiKey };
