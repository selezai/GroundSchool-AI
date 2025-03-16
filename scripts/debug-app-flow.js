// Enhanced debug script for application flow
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Mock Supabase client to simulate document retrieval
const mockSupabase = {
  storage: {
    from: (bucket) => ({
      download: async (filePath) => {
        console.log(`[MOCK] Downloading from ${bucket}/${filePath}`);
        
        // Create a mock response with sample aviation content
        const sampleContent = fs.readFileSync(path.join(__dirname, 'sample-aviation-doc.txt'), 'utf8');
        
        return {
          data: {
            text: async () => sampleContent
          },
          error: null
        };
      }
    })
  }
};

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: async (key) => {
    if (key === 'deepseek_api_key') {
      return process.env.DEEPSEEK_API_KEY;
    }
    return null;
  },
  setItem: async (key, value) => {
    console.log(`[MOCK] Setting ${key} in AsyncStorage`);
  }
};

// Create sample aviation document if it doesn't exist
function createSampleDocument() {
  const samplePath = path.join(__dirname, 'sample-aviation-doc.txt');
  if (!fs.existsSync(samplePath)) {
    const sampleContent = `
Aviation Regulations and Procedures
===================================

AIRPORT MARKINGS AND SIGNAGE
----------------------------

1. Runway Markings:
   - White centerline markings indicate the center of the runway
   - White threshold markings indicate the beginning of the runway available for landing
   - White aiming point markings provide a visual aiming point for landing
   - White touchdown zone markings identify the touchdown zone

2. Taxiway Markings:
   - Yellow centerline markings indicate the center of the taxiway
   - Yellow edge markings define the edge of the taxiway
   - Enhanced taxiway centerline markings have dashed lines on either side of the centerline
   - Surface painted holding position signs have a red background with white inscriptions

3. Airport Signs:
   - Red signs with white text indicate mandatory instructions
   - Yellow signs with black text provide location information
   - Black signs with yellow text provide direction information
   - Red and white signs indicate the runway safety area/obstacle free zone boundary

WEATHER MINIMUMS FOR VFR FLIGHT
-------------------------------

Class B Airspace:
- 3 statute miles visibility
- Clear of clouds

Class C Airspace:
- 3 statute miles visibility
- 500 feet below clouds
- 1,000 feet above clouds
- 2,000 feet horizontal from clouds

Class D Airspace:
- 3 statute miles visibility
- 500 feet below clouds
- 1,000 feet above clouds
- 2,000 feet horizontal from clouds

Class E Airspace (below 10,000 feet MSL):
- 3 statute miles visibility
- 500 feet below clouds
- 1,000 feet above clouds
- 2,000 feet horizontal from clouds

Class G Airspace (1,200 feet or less AGL, day):
- 1 statute mile visibility
- Clear of clouds

EMERGENCY PROCEDURES
-------------------

Engine Failure During Flight:
1. Establish best glide speed immediately (typically 65-75 knots in a small aircraft)
2. Select a suitable landing area within gliding distance
3. Attempt to restart the engine if time and altitude permit
4. Perform emergency checklist items
5. Declare emergency on 121.5 MHz if radio is operational
6. Plan approach to selected landing area
7. Shut off fuel and electrical systems before touchdown
8. Unlock doors before landing
9. Touch down at minimum controllable airspeed

Radio Communication Failure:
1. Set transponder to 7600
2. Continue flight according to the route and altitude from:
   - Assigned route and altitude
   - Expected route and altitude
   - Filed route and altitude
3. Arrive at the destination as close as possible to the ETA
4. Begin descent from the last assigned altitude at the expect further clearance time
5. If no expect further clearance time was given, begin descent at the ETA
`;
    
    fs.writeFileSync(samplePath, sampleContent);
    console.log(`Created sample aviation document at ${samplePath}`);
  }
}

// Simulate the API client with detailed logging
async function simulateApiClient(documentText) {
  console.log('\n===== SIMULATING API CLIENT FLOW =====');
  console.log(`Document text length: ${documentText.length} characters`);
  
  // Get API key from environment or AsyncStorage
  let apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ DeepSeek API key not found in environment');
    throw new Error('DeepSeek API key not configured');
  }
  
  console.log('✅ Found API key, proceeding with request');
  
  // Process document text (similar to what happens in apiClient.js)
  const MAX_CHARS = 24000;
  let processedText = documentText;
  
  if (documentText.length > MAX_CHARS) {
    const startSection = Math.floor(MAX_CHARS * 0.6);
    const endSection = Math.floor(MAX_CHARS * 0.4);
    
    processedText = documentText.substring(0, startSection) + 
      '\n\n[...Some content omitted for length...]\n\n' + 
      documentText.substring(documentText.length - endSection);
      
    console.log(`Trimmed document from ${documentText.length} to ${processedText.length} chars`);
  }
  
  // Create the prompt
  const questionCount = 3;
  const prompt = `You are an aviation exam question generator specializing in creating DOCUMENT-SPECIFIC questions. You must create ${questionCount} multiple-choice questions EXCLUSIVELY based on the aviation study material below.

CRITICAL REQUIREMENTS:
1. EVERY question MUST be answerable using ONLY information contained explicitly in the provided study material
2. DO NOT create generic aviation questions or use your general knowledge
3. DO NOT invent facts not present in the document
4. Each question must directly quote or paraphrase specific content from the study material
5. If you cannot create enough specific questions, return fewer questions rather than creating generic ones

QUESTION FORMAT REQUIREMENTS:
1. Begin each question with "### Question X" (where X is the question number)
2. Create a clear, specific question that targets important concepts from the material
3. Provide 4 answer options labeled (A, B, C, D)
4. Clearly mark the correct answer with "Correct answer: [letter]"
5. Include an explanation that references the specific section of the document that contains the answer

STUDY MATERIAL:
${processedText}

FINAL REMINDER: Create ONLY questions that can be answered directly from the provided document. I will check each question against the document content, so do not introduce generic aviation information not present in this specific material.`;
  
  console.log('Created prompt of length:', prompt.length);
  
  // Make the API call
  try {
    console.log('Making request to DeepSeek API...');
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      console.error(`❌ API call failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully received DeepSeek API response');
    
    // Extract the content
    const content = data.choices[0].message.content;
    
    // Log sample of the response
    console.log('\nResponse preview:');
    console.log(content.substring(0, 300) + '...\n');
    
    // Count questions in the response
    const questionCount = (content.match(/### Question \d+/g) || []).length;
    console.log(`Questions found in response: ${questionCount}`);
    
    // Save the response for analysis
    const responsePath = path.join(__dirname, 'api-simulation-response.txt');
    fs.writeFileSync(responsePath, content);
    console.log(`Full response saved to ${responsePath}`);
    
    // Parse the questions (similar to what happens in aiProcessing.js)
    simulateQuestionParsing(content, 3);
    
    return {
      success: true,
      questionCount,
      rawResponse: content
    };
  } catch (error) {
    console.error('❌ API request failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Simulate the question parsing logic from aiProcessing.js
function simulateQuestionParsing(aiResponse, expectedCount) {
  console.log('\n===== SIMULATING QUESTION PARSING =====');
  
  try {
    console.log('Parsing DeepSeek response into structured questions');
    
    // Log the start of the response
    console.log('Response starts with:', aiResponse.substring(0, 100) + '...');
    
    // Try different splitting patterns (from aiProcessing.js)
    let questionBlocks;
    let patternName = 'unknown';
    
    // Pattern 1: ### Question format
    if (aiResponse.includes('### Question')) {
      console.log('✅ Detected DeepSeek markdown format with ### Question headers');
      questionBlocks = aiResponse.split(/###\s*Question\s*\d+[:.\s]+/).filter(block => block.trim().length > 0);
      patternName = '### Question format';
    }
    // Pattern 2: Numbered list format
    else if (aiResponse.match(/\n\s*\d+\.\s+/)) {
      console.log('✅ Detected numbered list format');
      questionBlocks = aiResponse.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);
      patternName = 'Numbered list format';
    }
    // Pattern 3: Markdown divider format
    else if (aiResponse.includes('---')) {
      console.log('✅ Detected markdown divider format');
      questionBlocks = aiResponse.split(/\n\s*---\s*\n/).filter(block => block.trim().length > 0);
      patternName = 'Markdown divider format';
    }
    // Fallback parsing approach
    else {
      console.log('⚠️ No standard format detected, using fallback parsing approach');
      questionBlocks = aiResponse.split(/\n\s*\n/).filter(block => {
        return block.trim().length > 0 && 
              (block.includes('?') || block.includes('Question'));
      });
      patternName = 'Fallback parsing';
    }
    
    console.log(`Using pattern: ${patternName}`);
    console.log(`Found ${questionBlocks.length} potential question blocks`);
    
    if (questionBlocks.length === 0) {
      console.error('❌ No question blocks found in response!');
      console.log('This explains why fallback questions are being used!');
      return [];
    }
    
    // Log a sample of the first question block
    if (questionBlocks.length > 0) {
      console.log('\nSample question block:');
      console.log(questionBlocks[0].substring(0, 200) + '...');
    }
    
    // Count pattern matches in the response
    const patterns = {
      questionMarks: (aiResponse.match(/\?/g) || []).length,
      optionA: (aiResponse.match(/\([Aa]\)|\[Aa\]|[Aa][.):]/g) || []).length,
      optionB: (aiResponse.match(/\([Bb]\)|\[Bb\]|[Bb][.):]/g) || []).length,
      optionC: (aiResponse.match(/\([Cc]\)|\[Cc\]|[Cc][.):]/g) || []).length,
      optionD: (aiResponse.match(/\([Dd]\)|\[Dd\]|[Dd][.):]/g) || []).length,
      correctAnswer: (aiResponse.match(/correct answer/gi) || []).length
    };
    
    console.log('\nPattern detection results:');
    console.log(JSON.stringify(patterns, null, 2));
    
    console.log('\n===== CONCLUSION =====');
    if (patterns.questionMarks >= expectedCount && 
        patterns.optionA >= expectedCount && 
        patterns.optionB >= expectedCount &&
        patterns.correctAnswer >= expectedCount) {
      console.log('✅ Response contains sufficient question elements');
      console.log('The parsing should be able to extract questions successfully');
    } else {
      console.log('❌ Response is missing key question elements');
      console.log('This could explain why fallback questions are being used');
    }
    
    return questionBlocks;
  } catch (error) {
    console.error('❌ Error simulating question parsing:', error);
    return [];
  }
}

// Simulate the full document-to-questions flow
async function simulateFullFlow() {
  console.log('========================================');
  console.log('DeepSeek API Integration Flow Simulator');
  console.log('========================================');
  
  // Create sample document
  createSampleDocument();
  
  try {
    // Step 1: Extract document text (mock)
    const samplePath = path.join(__dirname, 'sample-aviation-doc.txt');
    const documentText = fs.readFileSync(samplePath, 'utf8');
    console.log(`✅ Extracted document text (${documentText.length} characters)`);
    
    // Step 2: Process document with API client
    const apiResult = await simulateApiClient(documentText);
    
    if (apiResult.success) {
      console.log('\n✅ Full flow simulation completed successfully');
      console.log('The issue is likely not with the API or processing logic');
      console.log('Check for runtime issues in the mobile app environment');
    } else {
      console.log('\n❌ Full flow simulation failed');
      console.log('Error:', apiResult.error);
    }
    
    console.log('\n======== RECOMMENDATIONS ========');
    console.log('1. Add detailed logging to the mobile app');
    console.log('2. Check that document content is being properly extracted');
    console.log('3. Verify API key is correctly stored and retrieved in the app');
    console.log('4. Look for network connectivity issues in the mobile environment');
    console.log('5. Check for memory or performance limitations in the app');
    console.log('========================================');
  } catch (error) {
    console.error('Fatal error during flow simulation:', error);
  }
}

// Run the simulation
simulateFullFlow().catch(err => {
  console.error('Unhandled error:', err);
});
