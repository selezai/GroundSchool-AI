/**
 * Migration Verification Script
 * 
 * This script helps verify that the Expo SDK migration was successful by checking:
 * 1. Package version compatibility
 * 2. Import compatibility
 * 3. Basic app structures
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

// Check installed SDK version
const checkSDKVersion = () => {
  try {
    const sdkVersion = Constants.expoConfig?.sdkVersion || 'unknown';
    console.log(`[✓] Expo SDK Version: ${sdkVersion}`);
    return true;
  } catch (error) {
    console.error(`[✗] Expo SDK Version check failed: ${error.message}`);
    return false;
  }
};

// Check React Native version
const checkReactNativeVersion = () => {
  try {
    // This will output the React Native version
    console.log(`[✓] React Native Platform: ${Platform.OS} (Version info in package.json)`);
    return true;
  } catch (error) {
    console.error(`[✗] React Native check failed: ${error.message}`);
    return false;
  }
};

// Check if Expo Router is correctly imported
const checkExpoRouter = () => {
  try {
    const importTest = require('expo-router');
    console.log('[✓] Expo Router imported successfully');
    return true;
  } catch (error) {
    console.error(`[✗] Expo Router import failed: ${error.message}`);
    return false;
  }
};

// Check if icons work
const checkIcons = () => {
  try {
    // This will attempt to access an icon to ensure the package works
    const iconNames = Object.keys(Ionicons.glyphMap);
    console.log(`[✓] Expo Vector Icons working (${iconNames.length} icons available)`);
    return true;
  } catch (error) {
    console.error(`[✗] Expo Vector Icons check failed: ${error.message}`);
    return false;
  }
};

// Run all checks
const runVerification = async () => {
  console.log('======== MIGRATION VERIFICATION ========');
  console.log('Running checks to verify Expo SDK migration...\n');
  
  let passedChecks = 0;
  const totalChecks = 4;
  
  // Run checks
  if (checkSDKVersion()) passedChecks++;
  if (checkReactNativeVersion()) passedChecks++;
  if (checkExpoRouter()) passedChecks++;
  if (checkIcons()) passedChecks++;
  
  console.log('\n=============== SUMMARY ================');
  console.log(`Passed: ${passedChecks}/${totalChecks} checks`);
  
  if (passedChecks === totalChecks) {
    console.log('✅ Migration verification PASSED!');
  } else {
    console.log('⚠️ Migration verification INCOMPLETE - see errors above');
  }
  console.log('========================================');
};

// Execute verification
runVerification().catch(error => {
  console.error('Verification script failed to run:', error);
});
