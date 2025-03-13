/**
 * Test script for verifying Claude AI integration in standalone builds
 * 
 * This script tests:
 * 1. Environment variable access (API keys)
 * 2. Claude API connectivity
 * 3. Question generation functionality
 * 
 * Usage: npx expo run:web -- scripts/test-claude-integration.js
 * 
 * Note: This script can be run in an Expo environment to simulate
 * the standalone build environment's behavior with API keys.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import env from '../src/utils/environment';

// This is a simplified version of the apiClient.generateQuestionsWithClaude method
async function testClaudeIntegration() {
  console.log('\n=== Claude AI Integration Test ===\n');
  
  // Step 1: Test environment variable access
  console.log('1. Testing environment variables...');
  await testEnvironmentVariables();
  
  // Step 2: Test Claude API connectivity
  console.log('\n2. Testing Claude API connectivity...');
  const apiKey = await getClaudeApiKey();
  if (!apiKey) {
    console.error('❌ Failed to get Claude API key from any source');
    return;
  }
  
  console.log('✅ Successfully retrieved Claude API key');
  
  // Step 3: Test question generation
  console.log('\n3. Testing question generation...');
  try {
    const result = await generateSampleQuestions(apiKey);
    console.log('✅ Successfully generated questions');
    console.log(`\nSample question: ${result.sampleQuestion}`);
    console.log(`\nTotal questions generated: ${result.questionCount}`);
  } catch (error) {
    console.error('❌ Failed to generate questions:', error.message);
  }
  
  console.log('\n=== Test Complete ===\n');
}

// Test environment variable access
async function testEnvironmentVariables() {
  console.log('Environment configuration:');
  console.log('- Environment:', env.environment);
  console.log('- Is production:', env.isProduction);
  console.log('- Is standalone:', env.isStandalone);
  console.log('- Is Expo Go:', env.isExpoGo);
  
  // Check Supabase configuration
  console.log('\nSupabase configuration:');
  if (env.supabaseUrl) {
    console.log('✅ Supabase URL found:', env.supabaseUrl.substring(0, 20) + '...');
  } else {
    console.error('❌ Supabase URL not found');
  }
  
  if (env.supabaseKey) {
    console.log('✅ Supabase Key found (hidden for security)');
  } else {
    console.error('❌ Supabase Key not found');
  }
  
  // Check Claude API key in different sources
  console.log('\nClaude API key sources:');
  console.log('- From env utility:', env.claudeApiKey ? '✅ Found' : '❌ Not found');
  
  try {
    const asyncStorageKey = await AsyncStorage.getItem('claude_api_key');
    console.log('- From AsyncStorage:', asyncStorageKey ? '✅ Found' : '❌ Not found');
  } catch (error) {
    console.error('❌ Error accessing AsyncStorage:', error.message);
  }
  
  const expoConfigKey = Constants.expoConfig?.extra?.claudeApiKey;
  console.log('- From Constants.expoConfig:', expoConfigKey ? '✅ Found' : '❌ Not found');
  
  // Check for Constants.manifest2 which is used in newer Expo SDK versions
  const manifest2Key = Constants.manifest2?.extra?.claudeApiKey;
  console.log('- From Constants.manifest2:', manifest2Key ? '✅ Found' : '❌ Not found');
}

// Get Claude API key with fallbacks
async function getClaudeApiKey() {
  // Try from environment utility
  let apiKey = env.claudeApiKey;
  
  // Try from AsyncStorage
  if (!apiKey) {
    try {
      apiKey = await AsyncStorage.getItem('claude_api_key');
    } catch (error) {
      console.warn('Failed to get Claude API key from AsyncStorage:', error.message);
    }
  }
  
  // Try from Expo Constants (multiple paths)
  if (!apiKey) {
    apiKey = Constants.expoConfig?.extra?.claudeApiKey || 
             Constants.manifest2?.extra?.claudeApiKey ||
             Constants.manifest?.extra?.claudeApiKey;
  }
  
  return apiKey;
}

// Generate sample aviation questions
async function generateSampleQuestions(apiKey) {
  // Sample aviation text for testing
  const sampleText = `
    Aircraft Weight and Balance
    
    Weight and balance is a critical aspect of aircraft operation. Every aircraft has a center of gravity (CG), 
    which is the point at which the aircraft would balance if suspended. The CG must be within specified limits 
    for safe flight.
    
    If the CG is too far forward, the aircraft may be difficult to rotate during takeoff and have poor climb performance. 
    If the CG is too far aft, the aircraft may be unstable and difficult to recover from unusual attitudes.
    
    The pilot must ensure that the aircraft is loaded within weight and balance limitations before every flight. 
    This involves calculating the total weight of the aircraft, including:
    - Basic empty weight (aircraft + unusable fuel + full oil)
    - Passengers and baggage
    - Usable fuel
    
    The moment (weight × arm) must be calculated for each item, and the sum divided by the total weight to determine 
    the CG location. This location must fall within the specified CG envelope for all phases of flight.
  `;
  
  // Simplified Claude API request
  const model = 'claude-3-haiku-20240307';
  
  console.log(`Making request to Claude API with model: ${model}`);
  
  const prompt = `You are an aviation exam question generator. Based on the following study material, create 3 multiple-choice questions that test understanding of key aviation concepts. 

For each question:
1. Create a clear, specific question about an important concept
2. Provide 4 answer options (A, B, C, D)
3. Indicate the correct answer
4. Include a brief explanation of why the answer is correct

Make sure your questions are directly based on the provided study material, not on general aviation knowledge.

Study material: ${sampleText}`;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });
  
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = `Claude API error: ${errorData.error?.message || errorMessage}`;
    } catch (jsonError) {
      // If we can't parse JSON, just use the HTTP error
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  // Extract the questions
  const rawResponse = data.content[0].text;
  
  // Extract first question as a sample
  const questionMatch = rawResponse.match(/\d+\.\s(.+?)A\)/s);
  const sampleQuestion = questionMatch ? questionMatch[1].trim() : 'Could not parse a sample question';
  
  // Count how many questions were generated
  const questionCount = (rawResponse.match(/\d+\./g) || []).length;
  
  return {
    sampleQuestion,
    questionCount,
    rawResponse
  };
}

// Run the test
testClaudeIntegration().catch(error => {
  console.error('Test failed with error:', error);
});
