import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Environment detection utility
 * Helps determine which environment the app is running in and provides access to environment variables
 */

// Enhanced environment detection with better standalone handling
const getEnvironmentSettings = () => {
  // Get Expo configuration
  const { expoConfig, manifest2 } = Constants;
  
  // For standalone builds, we can access values through multiple paths depending on the Expo SDK version
  // This ensures better compatibility across different build types and SDK versions
  const extra = expoConfig?.extra || manifest2?.extra || {};
  
  // Check if we're running in a standalone build (not in Expo Go or dev client)
  const isStandalone = Constants.appOwnership === 'standalone' || 
                     !!Constants.manifest?.releaseChannel ||
                     !!manifest2?.releaseChannel;
                     
  // In standalone builds, always treat as production unless explicitly set otherwise
  const isProductionBuild = isStandalone ? 
    (extra.isProductionBuild !== false) : // Default to true for standalone
    (extra.isProductionBuild === true);   // Default to false otherwise
  
  // Determine environment type
  const envType = isProductionBuild ? 'production' : 
                (extra.isPreviewBuild ? 'preview' : 'development');
  
  // Get the DeepSeek API key, checking multiple potential sources
  const deepseekApiKey = extra.DEEPSEEK_API_KEY || extra.deepseekApiKey || null;
  
  // Construct and return the environment object
  const env = {
    // Environment type and flags
    environment: envType,
    isProduction: isProductionBuild,
    isPreview: extra.isPreviewBuild === true,
    isDevelopment: !isProductionBuild && !extra.isPreviewBuild,
    isStandalone,
    
    // Detect if running in Expo Go
    isExpoGo: Constants.appOwnership === 'expo' && !isDevClientPackage(),
    
    // API configuration with fallbacks
    apiBaseUrl: extra.API_BASE_URL || extra.apiBaseUrl || 'https://jqkzgtytsaphudyidcxk.supabase.co/rest/v1',
    supabaseUrl: extra.SUPABASE_URL || extra.supabaseUrl || 'https://jqkzgtytsaphudyidcxk.supabase.co',
    supabaseKey: extra.SUPABASE_KEY || extra.supabaseKey,
    deepseekApiKey: deepseekApiKey
  };
  
  return env;
};

// Helper to detect if running in a dev client or standalone app
const isDevClientPackage = () => {
  const { expoConfig } = Constants;
  
  if (Platform.OS === 'web') return false;
  
  try {
    // Using manifest to detect dev client
    return Boolean(
      Constants.expoGoConfig || // Expo SDK 49+
      expoConfig?.extra?.expoGo || // Custom flag
      (expoConfig?.developmentClient && !expoConfig.packagerOpts?.dev) // Older detection
    );
  } catch (e) {
    console.warn('Error detecting environment:', e);
    return false;
  }
};

// Export environment settings
export const env = getEnvironmentSettings();

// Enhanced logging for debugging
console.log('📱 App environment:', env.environment);
console.log('🚀 Build type:', 
  env.isStandalone ? 'Standalone' : 
  (env.isExpoGo ? 'Expo Go' : 'Development Client'));

// Log API configuration status
console.log('🔑 API Keys status:', {
  supabaseUrl: env.supabaseUrl ? '✅ Set' : '❌ Missing',
  supabaseKey: env.supabaseKey ? '✅ Set' : '❌ Missing', 
  deepseekApiKey: env.deepseekApiKey ? '✅ Set' : '❌ Missing' 
});

// Store the DeepSeek API key in AsyncStorage as a backup in case the environment
// variables are not accessible in some parts of the app
if (env.deepseekApiKey) {
  AsyncStorage.setItem('deepseek_api_key', env.deepseekApiKey)
    .catch(err => console.warn('Failed to store DeepSeek API key in AsyncStorage:', err));
}

export default env;
