import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import env from '../utils/environment';

// Get API configuration from our environment utility
const API_BASE_URL = env.apiBaseUrl || 'https://jqkzgtytsaphudyidcxk.supabase.co/rest/v1';
const SUPABASE_KEY = env.supabaseKey;
const IS_PRODUCTION = env.isProduction;

// Validate essential configuration
if (!SUPABASE_KEY) {
  console.error('Critical: SUPABASE_KEY not configured. API requests will fail.');
}

/**
 * API Client for making authenticated requests to the backend
 */
class ApiClient {
  /**
   * Make a request to the API with proper authentication
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} - Response data
   */
  async request(endpoint, options = {}) {
    try {
      // Get auth token from storage
      const token = await AsyncStorage.getItem('userToken');
      
      // Set up headers with Supabase authentication
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation',
        ...options.headers,
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Always include the Supabase key for unauthenticated access
      headers['apikey'] = SUPABASE_KEY;
      
      // Prepare request URL and options
      const url = `${API_BASE_URL}${endpoint}`;
      const requestOptions = {
        ...options,
        headers,
      };
      
      // Make the request
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, requestOptions);
      
      // Handle common error responses
      if (response.status === 401) {
        // Unauthorized - token expired or invalid
        await AsyncStorage.removeItem('userToken');
        Alert.alert('Session Expired', 'Please log in again to continue.');
        throw new Error('Unauthorized: Session expired');
      }
      
      // Parse response
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }
  
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
  
  /**
   * Upload a file with form data - This method is now optimized for Supabase storage
   * @param {string} endpoint - API endpoint
   * @param {Object} file - File object with uri, name, and type
   * @param {Object} additionalData - Additional form data to include
   * @returns {Promise<any>} - Response data
   */
  async uploadFile(endpoint, file, additionalData = {}) {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('userToken');
      
      // For file uploads to Supabase Storage, we need to use the Storage API
      // If this endpoint is for storage, restructure this request accordingly
      if (endpoint.includes('/storage/') || endpoint.includes('/documents/process')) {
        // Generate a file name with timestamp to avoid conflicts
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        // For Supabase storage, we need to convert the file to a blob
        console.log(`Converting file to blob: ${file.name}`);
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        // Construct the storage URL
        const bucket = endpoint.includes('documents') ? 'documents' : 'default';
        const storageUrl = `${API_BASE_URL.replace('/rest/v1', '/storage/v1')}/object/${bucket}/${fileName}`;
        
        console.log(`Uploading to Supabase Storage: ${storageUrl}`);
        
        // Set up headers with Supabase authentication
        const headers = {
          'Content-Type': file.type,
          'apikey': SUPABASE_KEY,
          'x-upsert': 'true' // Handle existing files
        };
        
        // Add auth token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Make the request directly to Supabase Storage
        const uploadResponse = await fetch(storageUrl, {
          method: 'POST',
          body: blob,
          headers,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Storage upload error:', errorData);
          throw new Error(errorData.message || `Storage API Error: ${uploadResponse.status}`);
        }
        
        // Get the public URL for the uploaded file
        const publicUrl = `${API_BASE_URL.replace('/rest/v1', '/storage/v1')}/object/public/${bucket}/${fileName}`;
        
        // Return formatted response with file info and metadata
        return {
          document: {
            id: additionalData.id || Date.now().toString(),
            title: file.name.replace(`.${fileExt}`, ''),
            fileName: fileName,
            fileType: file.type,
            fileSize: file.size || 0,
            url: publicUrl,
            createdAt: new Date().toISOString(),
            metadata: additionalData
          }
        };
      }
      
      // For regular API endpoints, use standard form data approach
      // Create form data
      const formData = new FormData();
      
      // Add file to form data
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      });
      
      // Add any additional data
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
      
      // Set up headers with Supabase authentication
      const headers = {
        'Content-Type': 'multipart/form-data',
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation',
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make the request
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`File Upload Request: POST ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      });
      
      // Handle common error responses
      if (response.status === 401) {
        await AsyncStorage.removeItem('userToken');
        Alert.alert('Session Expired', 'Please log in again to continue.');
        throw new Error('Unauthorized: Session expired');
      }
      
      // Parse response
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('File Upload Error:', error);
      throw error;
    }
  }
  
  /**
   * Send a request to DeepSeek AI for document analysis and question generation
   * @param {string} documentText - Text content of the document to analyze
   * @param {Object} options - Options for question generation
   * @returns {Promise<Array>} - Array of generated questions
   */
  async generateQuestionsWithDeepSeek(documentText, options = {}) {
    const MAX_RETRIES = 3; // Maximum number of retry attempts
    let retryCount = 0; // Initialize retry counter
    
    try {
      console.log('Starting DeepSeek API request for question generation');
      console.log(`Document text length: ${documentText.length} characters`);
      
      // Get DeepSeek API key with multiple fallback options
      let apiKey = env.deepseekApiKey;
      
      // If API key is not in environment, try to get it from AsyncStorage
      if (!apiKey) {
        console.log('DeepSeek API key not found in environment, trying AsyncStorage');
        try {
          apiKey = await AsyncStorage.getItem('deepseek_api_key');
        } catch (storageError) {
          console.warn('Failed to get DeepSeek API key from AsyncStorage:', storageError);
        }
      }
      
      // Try to get from app.json constants directly as a last resort
      if (!apiKey && Constants.expoConfig?.extra?.deepseekApiKey) {
        console.log('Getting DeepSeek API key from Constants.expoConfig');
        apiKey = Constants.expoConfig.extra.deepseekApiKey;
      }
      
      // Check if we have a valid API key
      if (!apiKey) {
        console.error('DeepSeek API key not found in any source');
        throw new Error('DeepSeek API key not configured. Please check your app configuration.');
      }
      
      console.log('DeepSeek API key found, proceeding with request');
      
      // Set default options
      const questionOptions = {
        questionCount: options.questionCount || 10,
        difficulty: options.difficulty || 'mixed',
        model: 'deepseek-chat' // DeepSeek Chat model
      };
      
      // Improved document processing to retain more context
      // We'll use a smarter approach to preserve document structure better
      const MAX_CHARS = 24000; // Increased to capture more content
      let processedText = documentText;
      
      if (documentText.length > MAX_CHARS) {
        // Calculate sections to keep more intelligently
        const startSection = Math.floor(MAX_CHARS * 0.6); // 60% from start
        const endSection = Math.floor(MAX_CHARS * 0.4);   // 40% from end
        
        // Extract content to preserve important sections
        processedText = documentText.substring(0, startSection) + 
          '\n\n[...Some content omitted for length...]\n\n' + 
          documentText.substring(documentText.length - endSection);
          
        console.log(`Enhanced document processing: Trimmed from ${documentText.length} to ${processedText.length} chars`);
        console.log(`Keeping first ${startSection} and last ${endSection} chars of content`);
      }
      
      // Enhanced prompt for DeepSeek with stronger focus on document specificity
      const prompt = `You are an aviation exam question generator specializing in creating DOCUMENT-SPECIFIC questions. You must create ${questionOptions.questionCount} multiple-choice questions EXCLUSIVELY based on the aviation study material below.

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
      
      // Make direct request to DeepSeek API with better error handling
      console.log(`Making request to DeepSeek API with model: ${questionOptions.model}`);
      
      const requestStartTime = Date.now();
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: questionOptions.model,
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });
      
        // Parse response with enhanced error handling and detailed logging
        console.log('[DEBUG] API Response status:', response.status);
        
        if (!response.ok) {
          let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
          console.error('[ERROR] Non-200 response from DeepSeek API:', response.status);
          
          // Enhanced parsing of error responses
          try {
            const errorText = await response.text();
            console.error('[ERROR] DeepSeek error response body:', errorText);
            
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = `DeepSeek API error: ${errorData.error?.message || errorData.message || errorMessage}`;
              
              // Check for specific error patterns
              if (errorData.error?.code === 'invalid_api_key' || 
                  errorText.includes('authentication') || 
                  errorText.includes('api key')) {
                console.error('[ERROR] API key authentication issue detected');
              }
            } catch (jsonError) {
              console.error('[ERROR] Could not parse error response as JSON:', jsonError);
            }
          } catch (textError) {
            console.error('[ERROR] Could not read error response as text:', textError);
          }
          
          console.error('[FATAL]', errorMessage);
          
          // If this is a retry-able error (like rate limiting or temporary API issue)
          if (response.status === 429 || response.status >= 500) {
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
              console.log(`[RETRY] Attempt ${retryCount} of ${MAX_RETRIES} after ${delay}ms delay`);
              await new Promise(resolve => setTimeout(resolve, delay));
              
              // Instead of continue, we need to retry the request properly
              // We'll handle this in the calling function
              return { shouldRetry: true, retryCount };
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Parse the successful response with enhanced validation
        console.log('[DEBUG] Parsing DeepSeek API response');
        let data;
        
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('[ERROR] Failed to parse API response as JSON:', jsonError);
          console.error('[ERROR] Response status was:', response.status);
          
          try {
            const textResponse = await response.text();
            console.error('[ERROR] Raw response text:', textResponse.substring(0, 500) + '...');
          } catch (e) {
            console.error('[ERROR] Could not extract response text:', e);
          }
          
          throw new Error('Invalid JSON response from DeepSeek API');
        }
        
        console.log('[SUCCESS] Successfully received and parsed DeepSeek API response');
        
        // Validate the response format with detailed inspection
        if (!data) {
          console.error('[ERROR] Empty response data from DeepSeek API');
          throw new Error('Empty response from DeepSeek API');
        }
        
        if (!data.choices) {
          console.error('[ERROR] Missing choices in DeepSeek API response:', JSON.stringify(data).substring(0, 200));
          throw new Error('Missing choices in DeepSeek API response');
        }
        
        if (!data.choices[0]) {
          console.error('[ERROR] Empty choices array in DeepSeek API response:', data.choices);
          throw new Error('Empty choices in DeepSeek API response');
        }
        
        if (!data.choices[0].message) {
          console.error('[ERROR] No message in first choice of DeepSeek API response:', data.choices[0]);
          throw new Error('No message in DeepSeek API response');
        }
        
        if (!data.choices[0].message.content) {
          console.error('[ERROR] No content in message of DeepSeek API response:', data.choices[0].message);
          throw new Error('No content in DeepSeek API response message');
        }
        
        // Validate the content for expected question format
        const content = data.choices[0].message.content;
        
        console.log('[DEBUG] Content length:', content.length);
        console.log('[DEBUG] Content preview:', content.substring(0, 200) + '...');
        
        // Check if the content actually contains questions
        const questionMatches = content.match(/### Question \d+/g) || [];
        console.log('[DEBUG] Detected questions in response:', questionMatches.length);
        
        if (questionMatches.length === 0) {
          console.warn('[WARN] No questions detected in standard format, checking alternative formats...');
          
          // Check for alternative formats before giving up
          const altFormats = {
            numberedList: (content.match(/\d+\.\s+.*\?/g) || []).length,
            questionText: (content.match(/Question:?\s+.*\?/gi) || []).length,
            anyQuestionMarks: (content.match(/\?/g) || []).length
          };
          
          console.log('[DEBUG] Alternative formats detected:', JSON.stringify(altFormats));
          
          if (altFormats.anyQuestionMarks === 0) {
            console.error('[ERROR] No question marks found in response content');
            console.error('[ERROR] Response does not appear to contain actual questions');
            throw new Error('DeepSeek API response does not contain properly formatted questions');
          }
        }
        
        // Log success metrics to help diagnose the quality of the response
        console.log('[METRICS] Response statistics:');
        console.log('  - Content length:', content.length);
        console.log('  - Questions found:', questionMatches.length);
        console.log('  - Question marks:', (content.match(/\?/g) || []).length);
        console.log('  - Multiple choice options:', (content.match(/\([A-D]\)/g) || []).length);
        console.log('  - Correct answer indicators:', (content.match(/Correct answer/gi) || []).length);
        
        // Extract and return the AI response with enhanced data
        console.log('[SUCCESS] API request completed successfully');
        
        return {
          rawResponse: data.choices[0].message.content,
          model: data.model || "deepseek-chat",
          usage: data.usage || { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 },
          questionCount: questionMatches.length,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        // Detailed error handling and logging
        console.error('┌─────────────────────────────────────────────────');
        console.error('│ ❌ DEEPSEEK API REQUEST FAILED');
        console.error('│ Error:', error.message);
        
        if (error.name === 'AbortError') {
          console.error('│ Cause: Request timed out after 60 seconds');
        } else if (error.message.includes('Network request failed')) {
          console.error('│ Cause: Network connectivity issue');
        } else {
          console.error('│ Stack:', error.stack);
        }
        
        console.error('└─────────────────────────────────────────────────');
        
        // Retry logic for recoverable errors
        if (retryCount < MAX_RETRIES && 
            (error.message.includes('Network request failed') || 
             error.name === 'AbortError' || 
             error.message.includes('429') || 
             error.message.includes('500'))) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`[RETRY] Attempt ${retryCount} of ${MAX_RETRIES} after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry the request
        }
        
        throw error;
      }
    }
    
    // If we've exhausted retries
    throw new Error(`DeepSeek API request failed after ${MAX_RETRIES} retries`);
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
