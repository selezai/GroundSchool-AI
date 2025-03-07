import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

// Get API configuration from environment variables or use defaults
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.SUPABASE_URL || 'https://jqkzgtytsaphudyidcxk.supabase.co/rest/v1';
const SUPABASE_KEY = Constants.expoConfig?.extra?.supabaseKey || process.env.SUPABASE_KEY;

// Validate essential configuration
if (!SUPABASE_KEY) {
  console.warn('Warning: SUPABASE_KEY not configured. API requests will likely fail.');
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
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
