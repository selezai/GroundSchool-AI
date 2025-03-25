import axios from 'axios';
import Logger from '../utils/Logger';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 10000;

/**
 * Creates and configures an axios client with retry logic and proper error handling
 * @returns {AxiosInstance} Configured axios client
 */
const createClient = () => {
  // Safely get API base URL with fallback
  const baseURL = process.env.API_BASE_URL || 'https://api.example.com';
  
  const client = axios.create({
    baseURL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add request interceptor for logging and headers
  client.interceptors.request.use(
    (config) => {
      // Log outgoing requests in development
      if (process.env.NODE_ENV === 'development') {
        Logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => {
      Logger.error('API Request Error', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor with retry logic
  client.interceptors.response.use(
    (response) => {
      // Log successful responses in development
      if (process.env.NODE_ENV === 'development') {
        Logger.debug(`API Response: ${response.status} ${response.config.url}`);
      }
      return response;
    }, 
    async (error) => {
      // Ensure config exists and is properly initialized
      if (!error.config) {
        Logger.error('API Error without config', error);
        return Promise.reject(error);
      }
      
      const config = error.config;
      config._retryCount = config._retryCount || 0;

      // Log the error with appropriate context
      Logger.error(`API Error (${config._retryCount}/${MAX_RETRIES}): ${error.message}`, {
        url: config.url,
        method: config.method,
        status: error.response?.status,
        data: error.response?.data
      });

      if (shouldRetry(error) && config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        
        // Exponential backoff with jitter
        const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1) + Math.random() * 100;
        Logger.info(`Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms`);
        
        try {
          await new Promise(resolve => global.setTimeout(resolve, delay));
          return client(config);
        } catch (retryError) {
          Logger.error('Error during retry', retryError);
          return Promise.reject(retryError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Determines if a request should be retried based on the error
 * @param {Error} error - The axios error
 * @returns {boolean} Whether the request should be retried
 */
function shouldRetry(error) {
  // Don't retry if it was a user error (4xx)
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return false;
  }
  
  return (
    !error.response || // Network errors (no response)
    error.response.status >= 500 || // Server errors
    error.code === 'ECONNABORTED' || // Timeout
    error.message.includes('Network Error') // Generic network errors
  );
}

// Create a singleton instance
const apiClient = createClient();
export default apiClient;
