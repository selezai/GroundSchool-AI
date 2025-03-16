// Node-compatible diagnostic script for DeepSeek API
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Sample document content for testing
const SAMPLE_TEXT = `
Aviation Safety Procedures

Pre-flight Inspection:
1. Check all control surfaces for full range of motion.
2. Inspect fuel quantity and quality.
3. Verify oil levels are within acceptable range.
4. Check tires for proper inflation and wear.
5. Ensure all required documentation is on board.

Emergency Procedures:
If engine failure occurs during flight:
- Establish best glide speed immediately
- Look for suitable landing area
- Attempt engine restart if time permits
- Declare emergency on 121.5 MHz
- Prepare passengers for emergency landing

Weather Minimums:
VFR flight requires:
- 3 statute miles visibility
- 1,000 ft ceiling in controlled airspace
- 500 ft below clouds, 1,000 ft above clouds, 2,000 ft horizontal from clouds

Airspace Classifications:
Class A: IFR only, above 18,000 ft MSL
Class B: Requires clearance, surrounds major airports
Class C: Requires radio contact, surrounds busy airports
Class D: Requires radio contact, surrounds smaller airports
Class E: Controlled airspace not classified as A, B, C, or D
Class G: Uncontrolled airspace
`;

// Enhanced DeepSeek prompt that enforces document-specific questions
function createDeepSeekPrompt(docText, questionCount = 3) {
  return `You are an aviation exam question generator specializing in creating DOCUMENT-SPECIFIC questions. You must create ${questionCount} multiple-choice questions EXCLUSIVELY based on the aviation study material below.

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
${docText}

FINAL REMINDER: Create ONLY questions that can be answered directly from the provided document. I will check each question against the document content, so do not introduce generic aviation information not present in this specific material.`;
}

// Step-by-step debugging functions
async function checkApiKey() {
    console.log('===== STEP 1: API KEY CHECK =====');
    
    // Get the API key from environment
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
        console.error('❌ DeepSeek API key not found in environment variables');
        return false;
    }
    
    console.log('✅ DeepSeek API key found:', 
                deepseekApiKey ? `${deepseekApiKey.substring(0, 3)}...${deepseekApiKey.substring(deepseekApiKey.length - 3)}` : 'undefined');
    
    return Boolean(deepseekApiKey);
}

async function testDirectApiCall() {
    console.log('\n===== STEP 2: DIRECT API CALL TEST =====');
    
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
        console.error('❌ Cannot test API: No API key available');
        return false;
    }
    
    try {
        console.log('Making direct request to DeepSeek API...');
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekApiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: "Generate a simple multiple choice question about aviation with 4 options."
                    }
                ]
            })
        });
        
        const data = await response.json();
        
        if (response.status !== 200) {
            console.error('❌ API call failed with status:', response.status);
            console.error('Error details:', JSON.stringify(data, null, 2));
            return false;
        }
        
        console.log('✅ Direct API call successful!');
        console.log('Response preview:', data.choices?.[0]?.message?.content?.substring(0, 200) + '...');
        
        // Save full response for analysis
        const responseLogPath = path.join(__dirname, 'direct-api-response.json');
        fs.writeFileSync(responseLogPath, JSON.stringify(data, null, 2));
        console.log(`Full response saved to ${responseLogPath}`);
        
        return true;
    } catch (error) {
        console.error('❌ Direct API call failed with error:', error.message);
        return false;
    }
}

async function testDocumentSpecificPrompt() {
    console.log('\n===== STEP 3: DOCUMENT-SPECIFIC PROMPT TEST =====');
    
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
        console.error('❌ Cannot test document-specific prompt: No API key available');
        return false;
    }
    
    try {
        console.log('Testing document-specific prompt...');
        console.log('Using sample aviation text of length:', SAMPLE_TEXT.length);
        
        // Create prompt for document-specific questions
        const prompt = createDeepSeekPrompt(SAMPLE_TEXT, 3);
        
        // Log the prompt for debugging
        const promptLogPath = path.join(__dirname, 'document-specific-prompt.txt');
        fs.writeFileSync(promptLogPath, prompt);
        console.log(`Prompt saved to ${promptLogPath}`);
        
        // Make API call with document-specific prompt
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekApiKey}`
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
        
        const data = await response.json();
        
        if (response.status !== 200) {
            console.error('❌ Document-specific API call failed with status:', response.status);
            console.error('Error details:', JSON.stringify(data, null, 2));
            return false;
        }
        
        // Save full response for analysis
        const rawResponseContent = data.choices?.[0]?.message?.content || '';
        const rawLogPath = path.join(__dirname, 'document-specific-response.txt');
        fs.writeFileSync(rawLogPath, rawResponseContent);
        console.log(`Document-specific response saved to ${rawLogPath}`);
        
        // Count questions
        const questionCount = (rawResponseContent.match(/### Question \d+/g) || []).length;
        console.log(`Questions found in response: ${questionCount}`);
        
        if (questionCount > 0) {
            console.log('✅ Document-specific prompt test successful!');
            console.log('Response preview:', rawResponseContent.substring(0, 200) + '...');
            return true;
        } else {
            console.error('❌ No questions found in response');
            return false;
        }
    } catch (error) {
        console.error('❌ Document-specific prompt test failed with error:', error.message);
        console.error('Error stack:', error.stack);
        return false;
    }
}

// Main diagnostic function
async function runDiagnostics() {
    console.log('========================================');
    console.log('DeepSeek API Integration Diagnostic Tool');
    console.log('========================================');
    
    console.log(`Using Node.js version: ${process.version}`);
    console.log(`Current working directory: ${process.cwd()}`);
    
    let apiKeyValid = await checkApiKey();
    if (!apiKeyValid) {
        console.log('\n❌ CRITICAL ISSUE: DeepSeek API key is missing or invalid');
        console.log('Please check your .env file and ensure DEEPSEEK_API_KEY is set properly');
        return;
    }
    
    let directApiWorking = await testDirectApiCall();
    if (!directApiWorking) {
        console.log('\n❌ CRITICAL ISSUE: Cannot connect to DeepSeek API directly');
        console.log('Please check your internet connection and API key validity');
        return;
    }
    
    let documentSpecificPromptWorking = await testDocumentSpecificPrompt();
    if (!documentSpecificPromptWorking) {
        console.log('\n❌ ISSUE: Document-specific prompt is not working');
        console.log('The DeepSeek API works for basic prompts but not for document-specific ones');
    } else {
        console.log('\n✅ All tests passed successfully!');
    }
    
    console.log('\n========================================');
    console.log('Diagnostic Summary:');
    console.log(`1. API Key: ${apiKeyValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`2. Direct API: ${directApiWorking ? '✅ Working' : '❌ Failed'}`);
    console.log(`3. Document-Specific Prompt: ${documentSpecificPromptWorking ? '✅ Working' : '❌ Failed'}`);
    console.log('========================================');
}

// Run diagnostics
runDiagnostics().catch(err => {
    console.error('Fatal error during diagnostics:', err);
});
