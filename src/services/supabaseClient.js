import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Logger from '../utils/Logger';

// Safely get environment variables with proper fallbacks
// Using hardcoded fallbacks since environment variables may not properly load in development
const getSupabaseConfig = () => {
  try {
    // First try to get from Constants
    const configUrl = Constants.expoConfig?.extra?.supabaseUrl;
    const configKey = Constants.expoConfig?.extra?.supabaseKey;
    
    // Use hardcoded values as fallback
    const supabaseUrl = configUrl || 'https://jqkzgtytsaphudyidcxk.supabase.co';
    const supabaseKey = configKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3pndHl0c2FwaHVkeWlkY3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNjIyNTcsImV4cCI6MjA1NjkzODI1N30.dr2SAy2P4JqPdQ8WpOexz57kIYS-B2eYO2mApzelcio';
    
    // Log configuration source without sensitive data
    Logger.debug(`Supabase config source: ${configUrl ? 'Constants' : 'Fallback'} on ${Platform.OS}`);
    
    return { supabaseUrl, supabaseKey };
  } catch (error) {
    Logger.error('Failed to get Supabase config', error);
    // Return fallback values in case of error
    return {
      supabaseUrl: 'https://jqkzgtytsaphudyidcxk.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3pndHl0c2FwaHVkeWlkY3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNjIyNTcsImV4cCI6MjA1NjkzODI1N30.dr2SAy2P4JqPdQ8WpOexz57kIYS-B2eYO2mApzelcio'
    };
  }
};

// Create a safe async storage wrapper with error handling to prevent crashes
const safeAsyncStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (_error) {
      Logger.warn(`Failed to get item from AsyncStorage: ${key}`);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      return await AsyncStorage.setItem(key, value);
    } catch (_error) {
      Logger.warn(`Failed to set item in AsyncStorage: ${key}`);
      return null;
    }
  },
  removeItem: async (key) => {
    try {
      return await AsyncStorage.removeItem(key);
    } catch (_error) {
      Logger.warn(`Failed to remove item from AsyncStorage: ${key}`);
      return null;
    }
  }
};

// Create Supabase client with more resilient configuration
let supabaseInstance = null;

const getSupabase = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  try {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured!');
    }
    
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          storage: safeAsyncStorage,
        },
        global: {
          // Add more resilient fetch with timeout for network issues
          fetch: (...args) => {
            const controller = new global.AbortController();
            const { signal } = controller;
            
            // Set 30 second timeout for API calls to prevent hanging
            const timeout = global.setTimeout(() => controller.abort(), 30000);
            
            return fetch(...args, { signal })
              .finally(() => global.clearTimeout(timeout));
          }
        }
      }
    );
    
    Logger.info('Supabase client initialized successfully');
    return supabaseInstance;
  } catch (error) {
    Logger.error('Failed to initialize Supabase client:', error);
    
    // Create a fallback client that won't crash the app but will log errors
    const createFallbackMethod = (methodName) => (...args) => {
      Logger.error(`Supabase ${methodName} called but client failed to initialize`);
      return { data: null, error: new Error('Supabase client not initialized') };
    };
    
    supabaseInstance = {
      auth: {
        getUser: createFallbackMethod('auth.getUser'),
        signIn: createFallbackMethod('auth.signIn'),
        signOut: createFallbackMethod('auth.signOut'),
      },
      storage: {
        from: () => ({
          upload: createFallbackMethod('storage.upload'),
          getPublicUrl: createFallbackMethod('storage.getPublicUrl')
        })
      },
      from: () => ({
        select: createFallbackMethod('from.select'),
        insert: createFallbackMethod('from.insert'),
        update: createFallbackMethod('from.update'),
        delete: createFallbackMethod('from.delete')
      })
    };
    
    return supabaseInstance;
  }
};

// Initialize supabase for backward compatibility
const supabase = getSupabase();

export { supabase, getSupabase };
export default supabase;
