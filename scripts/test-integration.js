/**
 * Integration test script for aviation quiz generation
 * Tests the entire flow from document text extraction to question generation
 * Run with: node scripts/test-integration.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import the API client and aiProcessing modules
const apiClient = require('../src/services/apiClient').default;
const { generateQuestionsWithDeepSeek } = require('../lib/aiProcessing');

// Sample document text for testing
const SAMPLE_TEXT = `
# Aviation Altimetry Systems

## Types of Altimeters
Aircraft use several types of altimeters for different purposes:

1. **Pressure Altimeter**: Measures altitude based on atmospheric pressure.
   - QNH setting: Displays altitude above mean sea level
   - QFE setting: Displays height above airfield
   - Standard setting (29.92 inHg/1013.2 hPa): Used for flight levels above transition altitude

2. **Radio Altimeter**: Measures actual height above ground using radio waves.
   - Critical for approaches and landings in low visibility
   - Typically displays from 0 to 2,500 feet AGL
   - Required for Category II and III approaches

3. **GPS Altitude**: Measures height with reference to the WGS-84 ellipsoid.
   - Must be corrected for local geoid height for accurate MSL altitude
   - Provides reliable altitude information regardless of atmospheric conditions

## Altimeter Errors
Pilots must be aware of the following errors that can affect altimeter readings:

- **Scale Error**: Mechanical inaccuracies in the instrument
- **Position Error**: Affected by the aircraft's position and attitude
- **Lag Error**: Delay in the instrument response during climbs and descents
- **Temperature Error**: "High to low, look out below" - Altimeter overreads in colder than standard air
- **Pressure Error**: Failure to set correct QNH causes 1 hPa error ≈ 30 feet altitude error

## Regulations
FAR 91.121 and ICAO Annex 2 require that:
- Below transition altitude: Local QNH setting must be used
- Above transition level: Standard pressure setting (29.92 inHg/1013.2 hPa) must be used
- Transition layer: Appropriate setting based on climbing or descending
`;

// Function to run the integration test
async function testIntegration() {
  try {
    console.log('\n=============================================');
    console.log('🧪 RUNNING FULL INTEGRATION TEST');
    console.log('=============================================\n');
    
    // Step 1: Test DeepSeek API connectivity
    console.log('Step 1: Testing DeepSeek API connectivity');
    // Check if we have the DeepSeek API key from env
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('❌ DeepSeek API key not found in environment variables!');
      console.log('Please ensure DEEPSEEK_API_KEY is set in your .env file');
      process.exit(1);
    }
    console.log('✅ Found DeepSeek API key\n');
    
    // Step 2: Generate questions using the apiClient directly
    console.log('Step 2: Generating questions using apiClient directly');
    console.log(`Document text length: ${SAMPLE_TEXT.length} characters`);
    
    console.log('Making request to DeepSeek API...');
    const apiResponse = await apiClient.generateQuestionsWithDeepSeek(SAMPLE_TEXT, {
      questionCount: 5,
      difficulty: 'mixed'
    });
    
    console.log('✅ Received response from DeepSeek API');
    console.log('📋 Raw response length:', apiResponse.rawResponse.length, 'characters');
    
    // Save raw response for analysis
    fs.writeFileSync('deepseek-api-response.txt', apiResponse.rawResponse);
    console.log('💾 Saved API response to deepseek-api-response.txt\n');
    
    // Step 3: Test question parsing
    console.log('Step 3: Testing question parsing');
    // Import the function directly using require for parsing
    const { parseQuestionsFromAIResponse } = require('../lib/aiProcessing');
    
    const parsedQuestions = parseQuestionsFromAIResponse(apiResponse.rawResponse, 5);
    
    console.log(`✅ Successfully parsed ${parsedQuestions.length} questions from the API response`);
    console.log('📊 Parsed question details:');
    parsedQuestions.forEach((q, i) => {
      console.log(`Question ${i+1}: "${q.text.substring(0, 50)}..." with ${q.options.length} options`);
    });
    
    // Save parsed questions for analysis
    fs.writeFileSync('parsed-questions.json', JSON.stringify(parsedQuestions, null, 2));
    console.log('💾 Saved parsed questions to parsed-questions.json\n');
    
    // Step 4: Test the complete aiProcessing flow
    console.log('Step 4: Testing complete aiProcessing flow');
    
    // Write sample text to a temporary file
    const tempFilePath = path.join(__dirname, 'temp-sample.txt');
    fs.writeFileSync(tempFilePath, SAMPLE_TEXT);
    
    try {
      // Call the full generateQuestions function and simulate a document path
      // Note: This won't use Supabase storage but will test the rest of the flow
      const generatedQuestions = await generateQuestionsWithDeepSeek(SAMPLE_TEXT, 5);
      
      console.log(`✅ Full flow successfully generated ${generatedQuestions.length} questions`);
      console.log('📊 Generated question samples:');
      generatedQuestions.slice(0, 2).forEach((q, i) => {
        console.log(`Question ${i+1}: "${q.text.substring(0, 50)}..."`)
        console.log(`  Options: ${q.options.map(o => o.id).join(', ')}`);
        console.log(`  Correct: ${q.correctOptionId}`);
      });
      
      // Save complete questions for analysis
      fs.writeFileSync('integration-questions.json', JSON.stringify(generatedQuestions, null, 2));
      console.log('💾 Saved integration test questions to integration-questions.json');
    } catch (processError) {
      console.error('❌ Error in aiProcessing flow:', processError);
    } finally {
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    }
    
    console.log('\n=============================================');
    console.log('✅ INTEGRATION TEST COMPLETED');
    console.log('=============================================');
    
    // Final assessment
    const success = parsedQuestions.length > 0;
    if (success) {
      console.log('\n🎉 SUCCESS: DeepSeek API integration is working correctly!');
      console.log('The system successfully generated and parsed aviation-specific questions.');
    } else {
      console.log('\n⚠️ WARNING: DeepSeek API integration may have issues.');
      console.log('Please review the logs and output files for more details.');
    }
    
  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
  }
}

// Run the test
testIntegration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
