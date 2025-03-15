/**
 * Direct test script for DeepSeek API to verify question generation
 * Run with: node scripts/test-deepseek-direct.js
 */
require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Sample document text - replace with actual text for testing
const SAMPLE_TEXT = `
Aircraft Flight Control Systems
Primary flight controls are required to safely control an aircraft during flight and consist of:
- Ailerons to control roll (movement around the longitudinal axis)
- Elevators to control pitch (movement around the lateral axis)
- Rudder to control yaw (movement around the vertical axis)

Secondary flight controls are used to improve aircraft performance characteristics or to relieve excessive control forces and include:
- Flaps
- Slats
- Spoilers
- Trim systems
`;

// Function to run the DeepSeek test
async function testDeepSeekQuestionGeneration() {
  try {
    console.log('\n---------------------------------------------');
    console.log('🧪 RUNNING DEEPSEEK API DIRECT TEST');
    console.log('---------------------------------------------\n');
    
    // Get DeepSeek API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('❌ DeepSeek API key not found in environment variables!');
      console.log('Please ensure DEEPSEEK_API_KEY is set in your .env file');
      process.exit(1);
    }
    
    console.log('✅ Found DeepSeek API key');
    
    // Prepare the prompt
    const prompt = `You are an aviation exam question generator. Based on the following study material, create 5 multiple-choice questions that test understanding of key aviation concepts.

For each question:
1. Create a clear, specific question about an important concept
2. Provide 4 answer options (A, B, C, D)
3. Indicate the correct answer
4. Include a brief explanation of why the answer is correct

IMPORTANT: Make your questions ONLY about the specific information in the provided study material, not general aviation knowledge.

Study material: ${SAMPLE_TEXT}`;

    console.log('📝 Sending request to DeepSeek API...');
    console.log(`📊 Document size: ${SAMPLE_TEXT.length} characters`);
    
    // Make the API request
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    
    // Process the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      console.error(errorText);
      return;
    }
    
    // Parse successful response
    const data = await response.json();
    console.log('✅ Received response from DeepSeek API\n');
    
    // Log the raw response
    const rawResponse = data.choices[0].message.content;
    console.log('📋 RAW RESPONSE FROM DEEPSEEK:');
    console.log('---------------------------------------------');
    console.log(rawResponse);
    console.log('---------------------------------------------\n');
    
    // Save response to file for analysis
    fs.writeFileSync('deepseek-response.txt', rawResponse);
    console.log('💾 Saved response to deepseek-response.txt');
    
    // Log usage information
    console.log('📊 USAGE STATS:');
    console.log(`Prompt tokens: ${data.usage.prompt_tokens}`);
    console.log(`Completion tokens: ${data.usage.completion_tokens}`);
    console.log(`Total tokens: ${data.usage.total_tokens}`);
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testDeepSeekQuestionGeneration();
