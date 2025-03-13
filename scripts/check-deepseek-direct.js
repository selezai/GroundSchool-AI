/**
 * Simple script to verify DeepSeek API connectivity
 * This script can be run directly with Node.js without requiring
 * the entire application to be loaded
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Get API key from app.json
function getApiKey() {
  try {
    const appJsonPath = path.join(__dirname, '../app.json');
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    return appConfig.expo.extra.deepseekApiKey;
  } catch (error) {
    console.error('❌ Error reading API key from app.json:', error.message);
    return null;
  }
}

// Test DeepSeek API connectivity with a simple request
async function testDeepSeekApi(apiKey) {
  return new Promise((resolve, reject) => {
    // Simple prompt for testing
    const prompt = 'Create one multiple-choice question about aviation safety.';
    
    // Request data
    const data = JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Request options
    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      }
    };

    // Make the request
    console.log('Making request to DeepSeek API...');
    const req = https.request(options, (res) => {
      let responseData = '';

      // Collect response data
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      // Process complete response
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            console.log('\n✅ Successfully received response from DeepSeek API');
            console.log(`Model: ${parsedData.model || 'Unknown'}`);
            
            if (parsedData.choices && parsedData.choices[0]) {
              const content = parsedData.choices[0].message.content;
              console.log(`Response length: ${content.length} characters`);
              console.log('\nPreview of response:');
              console.log('---------------------------');
              console.log(content.substring(0, 200) + '...');
            }
            
            resolve(true);
          } catch (error) {
            console.error('❌ Error parsing response:', error.message);
            reject(error);
          }
        } else {
          console.error(`❌ API request failed: HTTP ${res.statusCode}`);
          try {
            const errorData = JSON.parse(responseData);
            console.error('Error details:', errorData.error || errorData);
          } catch (e) {
            console.error('Raw response:', responseData);
          }
          reject(new Error(`HTTP error ${res.statusCode}`));
        }
      });
    });

    // Handle request errors
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    // Send the request
    req.write(data);
    req.end();
  });
}

// Main function
async function main() {
  console.log('DeepSeek API Connection Test');
  console.log('===========================\n');

  // Get API key
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ Failed to get DeepSeek API key');
    process.exit(1);
  }

  console.log('✅ Found DeepSeek API key:', apiKey.substring(0, 6) + '...');

  try {
    // Test API connection
    await testDeepSeekApi(apiKey);
    console.log('\n✅ DeepSeek API test completed successfully!');
  } catch (error) {
    console.error('\n❌ DeepSeek API test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
