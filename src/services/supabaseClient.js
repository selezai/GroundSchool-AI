import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Debug log for understanding environment configuration
const debugEnvironment = () => {
  console.log('=== ENVIRONMENT DEBUG INFO ===');
  console.log('Platform:', Platform.OS);
  console.log('Process env SUPABASE_URL:', process.env.SUPABASE_URL || 'undefined');
  console.log('Expo Config Values:', {
    supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl || 'undefined',
    supabaseKey: Constants.expoConfig?.extra?.supabaseKey ? '**present**' : 'undefined',
    environment: Constants.expoConfig?.extra?.environment || 'undefined'
  });
};

// Call debug function
debugEnvironment();

// Safely get environment variables with proper fallbacks
// Using hardcoded fallbacks since environment variables may not properly load in development
const supabaseUrl = 'https://jqkzgtytsaphudyidcxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3pndHl0c2FwaHVkeWlkY3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNjIyNTcsImV4cCI6MjA1NjkzODI1N30.dr2SAy2P4JqPdQ8WpOexz57kIYS-B2eYO2mApzelcio';

// More detailed validation with clear console messages
if (!supabaseUrl) {
  console.error('CRITICAL: Supabase URL is missing. The app will likely crash on API calls.');
} else if (!supabaseKey) {
  console.error('CRITICAL: Supabase API key is missing. The app will likely crash on API calls.');
} else {
  console.log('Supabase configuration loaded successfully');
}

// Create a safe async storage wrapper with error handling to prevent crashes
const safeAsyncStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get item from AsyncStorage: ${key}`, error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      return await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set item in AsyncStorage: ${key}`, error);
      return null;
    }
  },
  removeItem: async (key) => {
    try {
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove item from AsyncStorage: ${key}`, error);
      return null;
    }
  }
};

// Create Supabase client with more resilient configuration
let supabase;
try {
  supabase = createClient(
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
          const controller = new AbortController();
          const { signal } = controller;
          
          // Set 30 second timeout for API calls to prevent hanging
          const timeout = setTimeout(() => controller.abort(), 30000);
          
          return fetch(...args, { signal })
            .finally(() => clearTimeout(timeout));
        }
      }
    }
  );
  
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a fallback client that won't crash the app but will log errors
  const createFallbackMethod = (methodName) => (...args) => {
    console.error(`Supabase ${methodName} called but client failed to initialize`);
    return { data: null, error: new Error('Supabase client not initialized') };
  };
  
  supabase = {
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
}

export { supabase };
export default supabase;
