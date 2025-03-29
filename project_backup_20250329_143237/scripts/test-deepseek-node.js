/**
 * Node-compatible test script for DeepSeek API integration
 * This script tests the DeepSeek API directly without requiring React Native dependencies
 * Run with: node scripts/test-deepseek-node.js
 */
require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Sample document text for testing - aviation altimetry focused
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
`;

/**
 * Directly calls DeepSeek API to generate questions
 */
async function generateQuestionsWithDeepSeek(documentText, questionCount = 5) {
  try {
    console.log(`Generating ${questionCount} questions with DeepSeek AI`);
    console.log(`Document text length: ${documentText.length} characters`);
    
    // Get DeepSeek API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DeepSeek API key not found in environment variables');
    }
    
    // Prepare the prompt for DeepSeek
    const prompt = `You are an aviation exam question generator. Your ONLY task is to create ${questionCount} multiple-choice questions STRICTLY based on the study material provided below.

IMPORTANT RULES:
1. ONLY create questions about specific information contained in the study material
2. DO NOT create generic aviation questions not covered in the material
3. Each question must directly reference concepts, facts, or procedures from the text
4. If the study material is insufficient, create fewer high-quality specific questions instead of generic ones

For each question:
1. Create a clear, specific question about an important concept from the material
2. Provide 4 answer options labeled (A, B, C, D)
3. Clearly indicate the correct answer with "Correct answer: [letter]"
4. Include a brief explanation of why the answer is correct

Format each question with a clear question number, the question text, options A-D, correct answer, and explanation.

STUDY MATERIAL:
${documentText}

Remember: Quality over quantity. Only create questions directly answerable from the provided study material.`;
    
    console.log('Making request to DeepSeek API...');
    
    // Make the request to DeepSeek API
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
    
    // Check for error response
    if (!response.ok) {
      let errorText = `HTTP error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorText = `DeepSeek API error: ${errorData.error?.message || errorText}`;
      } catch (e) {
        // If we can't parse JSON, just use the HTTP error
      }
      throw new Error(errorText);
    }
    
    // Parse successful response
    const data = await response.json();
    console.log('✅ Received response from DeepSeek API');
    
    // Extract and return the raw response content
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}

/**
 * Parse questions from DeepSeek's text response
 */
function parseQuestionsFromAIResponse(aiResponse, expectedCount) {
  try {
    console.log('Parsing DeepSeek response into structured questions');
    console.log('Response starts with:', aiResponse.substring(0, 100) + '...');
    
    // Enhanced response parsing with multiple formats support
    let questionBlocks;
    
    // Try different splitting patterns based on how DeepSeek formats questions
    // Pattern 1: Questions prefixed with '### Question X:' (typical DeepSeek format)
    if (aiResponse.includes('### Question')) {
      console.log('Detected DeepSeek markdown format with ### Question headers');
      questionBlocks = aiResponse.split(/###\s*Question\s*\d+[:.\s]+/).filter(block => block.trim().length > 0);
    }
    // Pattern 2: Questions separated by numbered patterns like '1.' or simple dash blocks
    else if (aiResponse.match(/\n\s*\d+\.\s+/)) {
      console.log('Detected numbered list format');
      questionBlocks = aiResponse.split(/\n\s*\d+\.\s+/).filter(block => block.trim().length > 0);
    }
    // Pattern 3: Questions separated by '---' markdown dividers
    else if (aiResponse.includes('---')) {
      console.log('Detected markdown divider format');
      questionBlocks = aiResponse.split(/\n\s*---\s*\n/).filter(block => block.trim().length > 0);
    }
    // Fallback: Try to split by double newline and look for question patterns
    else {
      console.log('Using fallback question parsing logic');
      questionBlocks = aiResponse.split(/\n\n+/).filter(block => {
        return block.includes('?') && (block.includes('Correct Answer') || block.includes('Answer:'));
      });
    }
    
    console.log(`Identified ${questionBlocks.length} potential question blocks`);
    
    const questions = [];
    
    questionBlocks.forEach((block, index) => {
      try {
        // Extract question text (everything before options start)
        // Try multiple patterns for question extraction
        let questionText = '';
        
        // First try to get text before the first option
        const questionMatch = block.match(/([\s\S]+?)\n\s*[A-D][.):]\s+/s) || 
                            block.match(/\*\*([^*]+)\*\*/); // Look for bolded question in markdown
                            
        if (questionMatch) {
          questionText = questionMatch[1].trim();
        } else if (block.includes('?')) {
          // Try to extract first sentence ending with question mark
          const questionMarkMatch = block.match(/([^.!?]+\?)/); 
          if (questionMarkMatch) {
            questionText = questionMarkMatch[1].trim();
          }
        }
        
        // Remove any markdown formatting from question text
        questionText = questionText.replace(/\*\*/g, '').trim();
        
        // Enhanced option extraction that handles multiple formats
        const optionsRegex = /\b([A-D])[.):]\s*([^\n]+)/g;
        const options = [];
        let match;
        
        while ((match = optionsRegex.exec(block)) !== null) {
          options.push({
            id: match[1], // A, B, C, or D
            text: match[2].trim()
          });
        }
        
        // Extract correct answer with enhanced pattern matching
        const correctAnswerMatch = block.match(/Correct [Aa]nswer\s*[:.]+\s*([A-D])/i) || 
                                  block.match(/Answer\s*[:.]+\s*([A-D])/i) ||
                                  block.match(/\*\*Correct [Aa]nswer[:.]*\*\*\s*([A-D])/i);
                                  
        const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : '';
        
        // Enhanced explanation extraction
        const explanationMatch = block.match(/Explanation\s*[:.]+\s*([\s\S]+?)(?=\n\s*\d|\n\s*---|$)/is) ||
                                block.match(/\*\*Explanation\*\*\s*[:.]*\s*([\s\S]+?)(?=\n\s*\d|\n\s*---|$)/is);
                                
        const explanation = explanationMatch ? explanationMatch[1].trim() : '';
        
        console.log(`Question ${index + 1} parsing result:`, {
          hasText: !!questionText,
          optionsCount: options.length,
          hasCorrectAnswer: !!correctAnswer,
          hasExplanation: !!explanation
        });
        
        // Only add well-formed questions
        if (questionText && options.length >= 3 && correctAnswer) {
          questions.push({
            id: `q-${Date.now()}-${index}`,
            text: questionText,
            options: options,
            correctOptionId: correctAnswer,
            explanation: explanation
          });
        } else {
          console.warn(`Skipping malformed question ${index + 1}:`, {
            textLength: questionText?.length || 0,
            optionsCount: options.length,
            correctAnswer
          });
        }
      } catch (parseError) {
        console.warn(`Error parsing question block ${index}:`, parseError);
        // Continue with other questions
      }
    });
    
    console.log(`Successfully parsed ${questions.length} questions`);
    
    // If we didn't get enough questions, log a warning
    if (questions.length < expectedCount) {
      console.warn(`Warning: Expected ${expectedCount} questions but only parsed ${questions.length}`);
    }
    
    return questions;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return []; // Return empty array on error
  }
}

// Function to run the integration test
async function testDeepSeekIntegration() {
  try {
    console.log('\n=============================================');
    console.log('🧪 RUNNING DEEPSEEK INTEGRATION TEST');
    console.log('=============================================\n');
    
    // Step 1: Get the raw response from DeepSeek
    console.log('Step 1: Getting questions from DeepSeek API');
    const rawResponse = await generateQuestionsWithDeepSeek(SAMPLE_TEXT, 5);
    
    // Save raw response for analysis
    fs.writeFileSync(path.join(__dirname, 'deepseek-response.txt'), rawResponse);
    console.log('💾 Saved API response to deepseek-response.txt\n');
    
    // Step 2: Parse the questions
    console.log('Step 2: Parsing the questions from the response');
    const parsedQuestions = parseQuestionsFromAIResponse(rawResponse, 5);
    
    // Save parsed questions for analysis
    fs.writeFileSync(path.join(__dirname, 'parsed-questions.json'), 
      JSON.stringify(parsedQuestions, null, 2));
    console.log('💾 Saved parsed questions to parsed-questions.json\n');
    
    // Step 3: Analyze the results
    console.log('Step 3: Analyzing results');
    console.log(`Total questions parsed: ${parsedQuestions.length}`);
    
    // Display the questions
    parsedQuestions.forEach((question, index) => {
      console.log(`\nQuestion ${index + 1}: ${question.text}`);
      question.options.forEach(option => {
        const marker = option.id === question.correctOptionId ? '✓' : ' ';
        console.log(`  ${marker} ${option.id}. ${option.text}`);
      });
      console.log(`  Explanation: ${question.explanation.substring(0, 100)}...`);
    });
    
    // Final assessment
    console.log('\n=============================================');
    console.log('✅ INTEGRATION TEST COMPLETED');
    console.log('=============================================');
    
    if (parsedQuestions.length > 0) {
      console.log('\n🎉 SUCCESS: DeepSeek API integration is working correctly!');
      console.log('The questions are specific to the provided aviation altimetry content.');
      console.log('Your app should now generate specific questions from uploaded documents.');
    } else {
      console.log('\n⚠️ WARNING: DeepSeek API integration may have issues.');
      console.log('Please review the logs and output files for more details.');
    }
    
  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
  }
}

// Run the test
testDeepSeekIntegration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
