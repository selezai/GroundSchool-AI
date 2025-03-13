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
   * Send a request to Claude AI for document analysis and question generation
   * @param {string} documentText - Text content of the document to analyze
   * @param {Object} options - Options for question generation
   * @returns {Promise<Array>} - Array of generated questions
   */
  async generateQuestionsWithClaude(documentText, options = {}) {
    try {
      console.log('Starting Claude API request for question generation');
      console.log(`Document text length: ${documentText.length} characters`);
      
      // Get Claude API key with multiple fallback options
      let apiKey = env.claudeApiKey;
      
      // If API key is not in environment, try to get it from AsyncStorage
      if (!apiKey) {
        console.log('Claude API key not found in environment, trying AsyncStorage');
        try {
          apiKey = await AsyncStorage.getItem('claude_api_key');
        } catch (storageError) {
          console.warn('Failed to get Claude API key from AsyncStorage:', storageError);
        }
      }
      
      // Try to get from app.json constants directly as a last resort
      if (!apiKey && Constants.expoConfig?.extra?.claudeApiKey) {
        console.log('Getting Claude API key from Constants.expoConfig');
        apiKey = Constants.expoConfig.extra.claudeApiKey;
      }
      
      // Check if we have a valid API key
      if (!apiKey) {
        console.error('Claude API key not found in any source');
        throw new Error('Claude API key not configured. Please check your app configuration.');
      }
      
      console.log('Claude API key found, proceeding with request');
      
      // Set default options
      const questionOptions = {
        questionCount: options.questionCount || 10,
        difficulty: options.difficulty || 'mixed',
        model: 'claude-3-haiku-20240307' // Using a faster model for mobile
      };
      
      // Trim document text to avoid token limits while preserving content
      // Keep the beginning and end of the document as these often contain key information
      const MAX_CHARS = 15000;
      let processedText = documentText;
      
      if (documentText.length > MAX_CHARS) {
        const halfMax = Math.floor(MAX_CHARS / 2);
        processedText = documentText.substring(0, halfMax) + 
          '\n[Content trimmed for length...]\n' + 
          documentText.substring(documentText.length - halfMax);
        console.log(`Trimmed document text from ${documentText.length} to ${processedText.length} chars`);
      }
      
      // Prepare the prompt for Claude
      const prompt = `You are an aviation exam question generator. Based on the following study material, create ${questionOptions.questionCount} multiple-choice questions that test understanding of key aviation concepts. 

For each question:
1. Create a clear, specific question about an important concept
2. Provide 4 answer options (A, B, C, D)
3. Indicate the correct answer
4. Include a brief explanation of why the answer is correct

Make sure your questions are directly based on the provided study material, not on general aviation knowledge.

Study material: ${processedText}`;
      
      // Make direct request to Claude API with better error handling
      console.log(`Making request to Claude API with model: ${questionOptions.model}`);
      
      const requestStartTime = Date.now();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
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
      
      const requestDuration = Date.now() - requestStartTime;
      console.log(`Claude API request completed in ${requestDuration / 1000} seconds`);
      
      // Parse response with better error handling
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = `Claude API error: ${errorData.error?.message || errorMessage}`;
        } catch (jsonError) {
          // If we can't parse JSON, just use the HTTP error
        }
        
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      const data = await response.json();
      console.log('Successfully received Claude API response');
      
      // Validate the response format
      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Invalid response format from Claude API:', data);
        throw new Error('Invalid response format from Claude API');
      }
      
      // Extract and return the AI response
      return {
        rawResponse: data.content[0].text,
        model: data.model,
        usage: data.usage
      };
    } catch (error) {
      console.error('Claude API request error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
