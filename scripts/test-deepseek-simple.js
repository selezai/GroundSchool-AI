/**
 * Simple test script for DeepSeek integration
 * This script tests the basic functionality without requiring the full Expo environment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Sample aviation text for testing
const SAMPLE_TEXT = `
Aircraft Flight Controls

Primary flight controls consist of ailerons, elevators, and the rudder. Ailerons control roll, elevators control pitch, and the rudder controls yaw.

Ailerons are located on the trailing edge of each wing and move in opposite directions. When the pilot moves the control wheel (or stick) to the left, the left aileron moves up and the right aileron moves down. This creates differential lift, causing the aircraft to roll to the left.

Elevators are located on the horizontal stabilizer and control the aircraft's pitch. When the pilot pulls back on the control wheel, the elevators move up, creating a downward force on the tail and causing the nose to pitch up.

The rudder is located on the vertical stabilizer and controls yaw. When the pilot pushes the left rudder pedal, the rudder deflects to the left, creating a force that yaws the nose to the left.
`;

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

// Generate questions with DeepSeek API
async function generateQuestionsWithDeepSeek(documentText, options = {}) {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      reject(new Error('DeepSeek API key not found'));
      return;
    }

    // Set default options
    const questionCount = options.questionCount || 3;
    const model = options.model || 'deepseek-chat';
    
    const questionOptions = {
      questionCount,
      model
    };

    // Prepare the prompt
    const prompt = `You are an aviation exam question generator. Based on the following study material, create ${questionOptions.questionCount} multiple-choice questions that test understanding of key aviation concepts. 

For each question:
1. Create a clear, specific question about an important concept
2. Provide 4 answer options (A, B, C, D)
3. Indicate the correct answer
4. Include a brief explanation of why the answer is correct

Make sure your questions are directly based on the provided study material, not on general aviation knowledge.

Study material: ${documentText}`;

    // Request data
    const data = JSON.stringify({
      model: questionOptions.model,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Request options
    const requestOptions = {
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
    console.log(`Making request to DeepSeek API with model: ${questionOptions.model}`);
    console.log(`Requesting ${questionOptions.questionCount} questions`);
    
    const req = https.request(requestOptions, (res) => {
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
            
            const result = {
              rawResponse: parsedData.choices[0].message.content,
              model: parsedData.model,
              questionCount: questionOptions.questionCount
            };
            
            resolve(result);
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

// Main test function
async function runTest() {
  console.log('DeepSeek Integration Test');
  console.log('=======================\n');

  try {
    console.log('Generating aviation quiz questions...');
    const result = await generateQuestionsWithDeepSeek(SAMPLE_TEXT, {
      questionCount: 2,
      model: 'deepseek-chat'
    });

    console.log('\n✅ Successfully generated questions');
    console.log(`Model used: ${result.model}`);
    console.log(`Response length: ${result.rawResponse.length} characters`);
    
    console.log('\nGenerated Questions:');
    console.log('-------------------');
    console.log(result.rawResponse);
    
    console.log('\n✅ DeepSeek integration test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
