/**
 * Simple Node.js script to verify DeepSeek API connectivity
 * This script doesn't require Expo/React Native dependencies
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read app.json to extract DeepSeek API key
function getDeepSeekApiKey() {
  try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Try to get the API key from various potential locations in app.json
    const apiKey = 
      appJson.expo?.extra?.deepseekApiKey || 
      appJson.expo?.extra?.DEEPSEEK_API_KEY;
    
    return apiKey;
  } catch (error) {
    console.error('Error reading app.json:', error.message);
    return null;
  }
}

// Simple function to make a request to the DeepSeek API
function testDeepSeekApi(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    // Create a minimal test message
    const data = JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Hello DeepSeek! Please respond with a single word: 'Working'"
        }
      ]
    });

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve({
              success: true,
              content: parsedData.choices?.[0]?.message?.content || 'No content returned',
              model: parsedData.model
            });
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          let errorMessage = `HTTP error ${res.statusCode}`;
          try {
            const errorData = JSON.parse(responseData);
            errorMessage = errorData.error?.message || errorMessage;
          } catch (e) {
            // Use the default error message if we can't parse the response
          }
          reject(new Error(errorMessage));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n=== DeepSeek API Configuration Test ===\n');
  
  // Step 1: Get the API key
  const apiKey = getDeepSeekApiKey();
  
  if (!apiKey) {
    console.error('❌ DeepSeek API key not found in app.json');
    console.log('\nPossible issues:');
    console.log('1. The API key may not be properly set in app.json');
    console.log('2. The API key may be under a different property name');
    console.log('\nPlease check your app.json file and ensure the DeepSeek API key is correctly configured.');
    return;
  }
  
  console.log('✅ Found DeepSeek API key in app.json');
  console.log(`API Key (masked): ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
  
  // Step 2: Test the API connection
  console.log('\nTesting connection to DeepSeek API...');
  
  try {
    const result = await testDeepSeekApi(apiKey);
    console.log('✅ Successfully connected to DeepSeek API!');
    console.log(`Model used: ${result.model}`);
    console.log(`Response: "${result.content.trim()}"`);
  } catch (error) {
    console.error(`❌ DeepSeek API test failed: ${error.message}`);
    console.log('\nPossible issues:');
    console.log('1. The API key may be invalid or expired');
    console.log('2. There may be network connectivity issues');
    console.log('3. DeepSeek API service may be experiencing downtime');
    return;
  }
  
  console.log('\n=== Test Complete ===');
  console.log('The DeepSeek API is properly configured and functional.');
}

// Run the test
main().catch(error => {
  console.error('Test failed with error:', error);
});
