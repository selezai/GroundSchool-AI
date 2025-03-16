// Diagnostic script to identify the exact point of failure in DeepSeek API integration
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { env } = require('../src/utils/environment');
const apiClient = require('../src/services/apiClient').default;

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

// Step-by-step debugging functions
async function checkApiKey() {
    console.log('===== STEP 1: API KEY CHECK =====');
    
    // Get the API key from environment
    const deepseekApiKey = env.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekApiKey) {
        console.error('❌ DeepSeek API key not found in environment variables');
        return false;
    }
    
    console.log('✅ DeepSeek API key found:', 
                deepseekApiKey ? `${deepseekApiKey.substring(0, 3)}...${deepseekApiKey.substring(deepseekApiKey.length - 3)}` : 'undefined');
    
    // Save API key to temp file to confirm it's accessible in the actual app
    const tempKeyPath = path.join(__dirname, 'temp-key-check.txt');
    fs.writeFileSync(tempKeyPath, `API key exists: ${Boolean(deepseekApiKey)}\nLength: ${deepseekApiKey?.length || 0}\nFirst chars: ${deepseekApiKey?.substring(0, 3) || ''}`);
    console.log(`API key details saved to ${tempKeyPath} for verification`);
    
    return Boolean(deepseekApiKey);
}

async function testDirectApiCall() {
    console.log('\n===== STEP 2: DIRECT API CALL TEST =====');
    
    const deepseekApiKey = env.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    
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
                max_tokens: 500,
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

async function testApiClientIntegration() {
    console.log('\n===== STEP 3: API CLIENT INTEGRATION TEST =====');
    
    try {
        console.log('Testing generateQuestionsWithDeepSeek via API client...');
        console.log('Using sample aviation text of length:', SAMPLE_TEXT.length);
        
        // Log the full environment before making API call
        console.log('Environment configuration:', JSON.stringify({
            apiKey: Boolean(env.deepseekApiKey),
            apiKeyLength: env.deepseekApiKey?.length || 0,
            environment: env.environment
        }, null, 2));
        
        const result = await apiClient.generateQuestionsWithDeepSeek(SAMPLE_TEXT, {
            questionCount: 3
        });
        
        console.log('✅ API client integration successful!');
        
        // Save raw response for analysis
        if (result && result.rawResponse) {
            const rawLogPath = path.join(__dirname, 'api-client-raw-response.txt');
            fs.writeFileSync(rawLogPath, result.rawResponse);
            console.log(`Raw API response saved to ${rawLogPath}`);
            
            // Count questions
            const questionCount = (result.rawResponse.match(/### Question \d+/g) || []).length;
            console.log(`Questions found in response: ${questionCount}`);
            
            return Boolean(questionCount > 0);
        } else {
            console.error('❌ API client returned invalid response', result);
            return false;
        }
    } catch (error) {
        console.error('❌ API client integration failed with error:', error.message);
        console.error('Error stack:', error.stack);
        return false;
    }
}

// Main diagnostic function
async function runDiagnostics() {
    console.log('========================================');
    console.log('DeepSeek API Integration Diagnostic Tool');
    console.log('========================================');
    
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
    
    let apiClientWorking = await testApiClientIntegration();
    if (!apiClientWorking) {
        console.log('\n❌ ISSUE: API client integration is failing');
        console.log('The direct API works but something is wrong with our integration');
    } else {
        console.log('\n✅ All tests passed successfully!');
    }
    
    console.log('\n========================================');
    console.log('Diagnostic Summary:');
    console.log(`1. API Key: ${apiKeyValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`2. Direct API: ${directApiWorking ? '✅ Working' : '❌ Failed'}`);
    console.log(`3. API Client: ${apiClientWorking ? '✅ Working' : '❌ Failed'}`);
    console.log('========================================');
}

// Run diagnostics
runDiagnostics().catch(err => {
    console.error('Fatal error during diagnostics:', err);
});
