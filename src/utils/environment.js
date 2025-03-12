import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Environment detection utility
 * Helps determine which environment the app is running in
 */

// Get environment from Constants
const getEnvironmentSettings = () => {
  const { expoConfig } = Constants;
  const extra = expoConfig?.extra || {};
  
  return {
    // Get environment type
    environment: extra.environment || 'development',
    
    // Get specific environment flags
    isProduction: extra.isProductionBuild === true,
    isPreview: extra.isPreviewBuild === true,
    isDevelopment: extra.isDevelopmentBuild === true,
    
    // Detect if running in Expo Go
    isExpoGo: extra.isExpoGo !== false && !isDevClientPackage(),
    
    // Get API configuration
    apiBaseUrl: extra.apiBaseUrl,
    supabaseUrl: extra.supabaseUrl,
    supabaseKey: extra.supabaseKey,
    claudeApiKey: extra.claudeApiKey
  };
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

// Debug logging in non-production environments
if (!env.isProduction) {
  console.log('📱 App environment:', env.environment);
  console.log('🔄 isExpoGo:', env.isExpoGo);
}

export default env;
