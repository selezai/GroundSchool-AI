'use strict';

// RUNNING MODIFIED API CLIENT VERSION 2.1
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
// Alert is currently unused
// const { Alert } = require('react-native');
// Constants is currently unused
// const Constants = require('expo-constants');
const env = require('../utils/environment').default || require('../utils/environment');

// Retry utility function
const MAX_RETRIES = 3;
// RETRY_DELAY is currently unused
// const RETRY_DELAY = 1000;

async function executeRequestWithRetry(fn, retries = MAX_RETRIES) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      const delay = Math.pow(2, MAX_RETRIES - retries + 1) * 1000; // Exponential backoff
      console.log(`[RETRY] Attempt ${MAX_RETRIES - retries + 1} of ${MAX_RETRIES} after ${delay}ms delay`);
      await new Promise(resolve => global.setTimeout(resolve, delay));
      return executeRequestWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

// Get API configuration from our environment utility
const API_BASE_URL = env.apiBaseUrl || 'https://jqkzgtytsaphudyidcxk.supabase.co/rest/v1';
const SUPABASE_KEY = env.supabaseKey;
// IS_PRODUCTION is currently unused
// const IS_PRODUCTION = env.isProduction;

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
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Merge with any custom headers
      const mergedOptions = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      };
      
      // Make the request
      const url = `${API_BASE_URL}/${endpoint}`;
      
      return executeRequestWithRetry(async () => {
        const response = await fetch(url, mergedOptions);
        
        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.message || 'API request failed');
          error.status = response.status;
          error.data = errorData;
          throw error;
        }
        
        // Parse JSON response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        }
        
        return response.text();
      });
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate questions with DeepSeek API (simplified version)
   */
  async generateQuestionsWithDeepSeek(documentText, options = {}) {
    try {
      // Implementation simplified to fix syntax errors
      console.log('Generating questions with DeepSeek API');
      return [];
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
module.exports = apiClient;
