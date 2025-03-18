import { useState, useEffect, useRef, useCallback } from 'react';
import Logger from '../utils/Logger';

/**
 * Hook to safely manage state in components, preventing updates on unmounted components
 * @param {any} initialValue - The initial state value
 * @returns {[any, Function]} - State and safe setState function
 */
export const useSafeState = (initialValue) => {
  const isMounted = useRef(true);
  const [state, setState] = useState(initialValue);

  // Track component mount status
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Safe setState function that only updates if component is mounted
  const safeSetState = useCallback((value) => {
    if (isMounted.current) {
      setState(value);
    } else {
      // Log warning in development, but not in production to avoid console spam
      if (process.env.NODE_ENV !== 'production') {
        Logger.warn('State update prevented on unmounted component');
      }
    }
  }, []);

  return [state, safeSetState];
};

/**
 * Hook to safely manage a ref that can be updated even after unmount
 * @param {any} initialValue - The initial ref value
 * @returns {Object} - Object containing ref, get, set, and isMounted
 */
export const useSafeRef = (initialValue) => {
  const ref = useRef(initialValue);
  const isMounted = useRef(true);

  // Track component mount status
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get current ref value
  const get = useCallback(() => ref.current, []);
  
  // Set ref value (safe to call even after unmount)
  const set = useCallback((value) => {
    ref.current = value;
  }, []);

  return { ref, get, set, isMounted: isMounted.current };
};

/**
 * Hook to safely execute effects with automatic cleanup
 * @param {Function} effect - Effect function to run
 * @param {Array} deps - Dependencies array
 */
export const useSafeEffect = (effect, deps = []) => {
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    
    let cleanup;
    
    try {
      // Run effect and capture cleanup function
      // Don't pass isMounted directly as it might not be expected by all effect functions
      cleanup = effect();
    } catch (error) {
      // Make sure we have something to log even if error is empty
      Logger.error('Error in useSafeEffect:', error || 'Unknown error');
    }
    
    // Return cleanup function
    return () => {
      isMounted.current = false;
      
      if (typeof cleanup === 'function') {
        try {
          cleanup();
        } catch (error) {
          Logger.error('Error in useSafeEffect cleanup:', error || 'Unknown error');
        }
      }
    };
  }, deps);
};

/**
 * Hook to safely execute async operations with automatic cancellation
 * @param {Function} asyncFn - Async function to execute
 * @param {Array} deps - Dependencies array
 * @returns {Object} - Object containing execute function, loading state, result, and error
 */
export const useSafeAsync = (asyncFn, deps = []) => {
  const [loading, setLoading] = useSafeState(false);
  const [result, setResult] = useSafeState(null);
  const [error, setError] = useSafeState(null);
  const isMounted = useRef(true);
  
  // Reset state when dependencies change
  useEffect(() => {
    setLoading(false);
    setResult(null);
    setError(null);
  }, deps);
  
  // Track component mount status
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Execute the async function
  const execute = useCallback(async (...args) => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const res = await asyncFn(...args);
      
      if (isMounted.current) {
        setResult(res);
        setLoading(false);
      }
      
      return res;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
        setLoading(false);
      }
      
      throw err;
    }
  }, [asyncFn, ...deps]);
  
  return { execute, loading, result, error };
};

export default {
  useSafeState,
  useSafeRef,
  useSafeEffect,
  useSafeAsync
};
