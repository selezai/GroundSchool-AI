import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase configuration from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase configuration missing. Please check your environment variables.');
}

// Create Supabase client
const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    }
  }
);

export default supabase;
