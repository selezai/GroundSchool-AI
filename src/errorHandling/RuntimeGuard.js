import { Platform } from 'react-native';
import Logger from '../utils/Logger';
import PlatformService from '../services/PlatformService';

/**
 * Queue for retrying failed API requests
 */
const retryQueue = [];

/**
 * Maximum number of retries for API requests
 */
const MAX_RETRIES = 3;

/**
 * Redirect to a safe screen when a critical error occurs
 */
const redirectToSafety = () => {
  try {
    Logger.warn('Redirecting to safety due to critical error');
    
    // Redirect to error screen
    if (Platform.OS === 'web') {
      // Use window.location for web
      window.location.href = '/error';
    } else {
      // For native, we'll rely on the error boundary
      // This function is mainly for logging
    }
  } catch (error) {
    console.error('Failed to redirect to safety:', error);
  }
};

/**
 * Suppress an error without crashing the app
 * @param {Error} error - The error to suppress
 */
const suppressError = (error) => {
  try {
    Logger.warn('Suppressing non-critical error:', error);
  } catch (e) {
    console.warn('Failed to log suppressed error:', e);
  }
};

/**
 * Queue a failed API request for retry
 * @param {Object} config - The request configuration
 */
const queueRetry = (config) => {
  try {
    // Add retry count or initialize it
    const retryCount = config.retryCount || 0;
    
    // Check if we've reached the maximum number of retries
    if (retryCount >= MAX_RETRIES) {
      Logger.warn(`Maximum retries (${MAX_RETRIES}) reached for request:`, config);
      return;
    }
    
    // Add to retry queue with incremented retry count
    const retryConfig = {
      ...config,
      retryCount: retryCount + 1
    };
    
    retryQueue.push(retryConfig);
    Logger.info(`Queued API request for retry (${retryCount + 1}/${MAX_RETRIES}):`, config.url);
    
    // Schedule retry processing if not already scheduled
    if (retryQueue.length === 1) {
      setTimeout(processRetryQueue, 5000);
    }
  } catch (error) {
    Logger.error('Failed to queue retry:', error);
  }
};

/**
 * Process the retry queue
 */
const processRetryQueue = async () => {
  if (retryQueue.length === 0) return;
  
  try {
    Logger.info(`Processing retry queue (${retryQueue.length} items)`);
    
    // Take the first item from the queue
    const config = retryQueue.shift();
    
    // Retry the request (implementation depends on your API client)
    // This is a placeholder - replace with your actual API client
    // apiClient.request(config).catch(error => {
    //   // If it fails again, re-queue it
    //   queueRetry(config);
    // });
    
    // Schedule next retry if there are more items
    if (retryQueue.length > 0) {
      setTimeout(processRetryQueue, 5000);
    }
  } catch (error) {
    Logger.error('Error processing retry queue:', error);
    
    // Schedule next retry anyway
    if (retryQueue.length > 0) {
      setTimeout(processRetryQueue, 5000);
    }
  }
};

/**
 * Error detection and handling strategies
 */
const protectionHandlers = {
  navigation: {
    detect: (error) => {
      return error.message && (
        error.message.includes('navigation') ||
        error.message.includes('router') ||
        error.message.includes('navigator') ||
        error.message.includes('drawer')
      );
    },
    handle: (error) => {
      Logger.error('Navigation error caught by RuntimeGuard:', error);
      redirectToSafety();
      return true; // Error handled
    }
  },
  
  state: {
    detect: (error) => {
      return error.message && (
        error.message.includes('unmounted') ||
        error.message.includes('state update') ||
        error.message.includes('React state') ||
        error.message.includes('setState')
      );
    },
    handle: (error) => {
      suppressError(error);
      return true; // Error handled
    }
  },
  
  api: {
    detect: (error) => {
      return error && error.config && (error.response || error.request);
    },
    handle: (error) => {
      if (error.config) {
        queueRetry(error.config);
        return true; // Error handled
      }
      return false; // Could not handle error
    }
  },
  
  storage: {
    detect: (error) => {
      return error.message && (
        error.message.includes('storage') ||
        error.message.includes('AsyncStorage') ||
        error.message.includes('localStorage')
      );
    },
    handle: (error) => {
      Logger.error('Storage error caught by RuntimeGuard:', error);
      suppressError(error);
      return true; // Error handled
    }
  },
  
  network: {
    detect: (error) => {
      return error.message && (
        error.message.includes('network') ||
        error.message.includes('connection') ||
        error.message.includes('offline') ||
        error.message.includes('timeout')
      );
    },
    handle: (error) => {
      Logger.error('Network error caught by RuntimeGuard:', error);
      // Could show an offline indicator or toast
      return true; // Error handled
    }
  }
};

/**
 * Protect a function with runtime error handling
 * @param {Function} fn - The function to protect
 * @returns {Function} - Protected function
 */
export const protect = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Find a handler for this error
      const handler = Object.values(protectionHandlers)
        .find(h => h.detect(error));
      
      if (handler && handler.handle(error)) {
        // Error was handled, return a safe value
        return null;
      }
      
      // No handler found or handler couldn't handle it, rethrow
      throw error;
    }
  };
};

/**
 * Create a protected version of an object's methods
 * @param {Object} obj - The object to protect
 * @returns {Object} - Object with protected methods
 */
export const protectObject = (obj) => {
  const protectedObj = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'function') {
      protectedObj[key] = protect(obj[key]);
    } else {
      protectedObj[key] = obj[key];
    }
  }
  
  return protectedObj;
};

/**
 * Global error handler for uncaught errors
 * @param {Error} error - The uncaught error
 * @param {boolean} isFatal - Whether the error is fatal
 */
export const globalErrorHandler = (error, isFatal = false) => {
  try {
    Logger.error(`Global error caught (isFatal: ${isFatal}):`, error);
    
    // Find a handler for this error
    const handler = Object.values(protectionHandlers)
      .find(h => h.detect(error));
    
    if (handler) {
      handler.handle(error);
    } else if (isFatal) {
      // For fatal errors, redirect to safety
      redirectToSafety();
    }
  } catch (e) {
    // Last resort error handling
    console.error('Error in global error handler:', e);
    console.error('Original error:', error);
  }
};

export default {
  protect,
  protectObject,
  globalErrorHandler,
  redirectToSafety,
  suppressError,
  queueRetry
};
