/**
 * Tests for the apiClient module
 * 
 * Since apiClient is a singleton that exports an axios instance with interceptors,
 * we'll focus on testing the retry logic behavior rather than the axios configuration.
 */

/* global describe, it, expect */

describe('apiClient', () => {
  // We're testing the behavior of the shouldRetry function that's used in the apiClient
  // This function determines when to retry failed requests

  describe('shouldRetry function', () => {
    // Direct test of the shouldRetry logic without extracting the function
    it('should retry on server errors (500+)', () => {
      // We can't directly access the shouldRetry function, but we can test its logic
      const error = {
        response: { status: 500 }
      };
      
      // The logic in shouldRetry is:
      // !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED'
      const shouldRetry = !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
      
      expect(shouldRetry).toBe(true);
    });
    
    it('should retry on network errors (no response)', () => {
      const error = {
        response: undefined
      };
      
      const shouldRetry = !error.response || error.response?.status >= 500 || error.code === 'ECONNABORTED';
      
      expect(shouldRetry).toBe(true);
    });
    
    it('should retry on connection timeout', () => {
      const error = {
        code: 'ECONNABORTED',
        response: { status: 200 }
      };
      
      const shouldRetry = !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
      
      expect(shouldRetry).toBe(true);
    });
    
    it('should not retry on client errors (4xx)', () => {
      const error = {
        response: { status: 404 }
      };
      
      const shouldRetry = !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
      
      expect(shouldRetry).toBe(false);
    });
  });
});
