/**
 * Dependency Version Checker
 * 
 * This script checks all dependencies in package.json against known compatible
 * versions for Expo SDK 52. It helps diagnose version conflicts before installation.
 */

const fs = require('fs');
const path = require('path');

// Try to dynamically load chalk, but handle if it's not installed
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Simple fallback if chalk is not available
  chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`
  };
}

// Known compatible versions for Expo SDK 52
// These are the versions that work with Expo 52
const COMPATIBLE_VERSIONS = {
  // Core packages
  'expo': '~52.0.0',
  'react': '18.2.0',
  'react-dom': '18.2.0',
  'react-native': '0.74.5',
  
  // Expo packages
  'expo-constants': '~16.0.0',
  'expo-font': '~12.0.0',
  'expo-linking': '~6.3.0',
  'expo-router': '^4.0.0',
  'expo-splash-screen': '~0.27.0',
  'expo-status-bar': '~1.12.0',
  'expo-document-picker': '~12.0.0',
  
  // React Navigation
  
  // UI & Utilities
  'react-native-gesture-handler': '~2.16.0',
  'react-native-reanimated': '~3.10.0',
  'react-native-safe-area-context': '4.10.0',
  'react-native-screens': '~3.29.0',
  'react-native-web': '~0.19.6',
  '@expo/vector-icons': '^14.0.0'
};

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  console.log(chalk.blue('🔍 Checking dependency versions for Expo SDK 52 compatibility...'));
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('❌ package.json not found!'));
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  console.log(chalk.yellow('📋 Checking dependencies:'));
  
  let hasIncompatibleVersions = false;
  
  // Check each dependency against compatible versions
  Object.entries(COMPATIBLE_VERSIONS).forEach(([pkg, compatibleVersion]) => {
    const currentVersion = allDependencies[pkg];
    
    if (!currentVersion) {
      console.log(chalk.yellow(`ℹ️ ${pkg}: Not found in package.json`));
      return;
    }
    
    // Basic version compatibility check (this is simplified and not 100% accurate)
    const isCompatible = 
      currentVersion === compatibleVersion ||
      (currentVersion.startsWith('~') && compatibleVersion.startsWith('~') && 
       currentVersion.split('.')[0] === compatibleVersion.split('.')[0] && 
       currentVersion.split('.')[1] === compatibleVersion.split('.')[1]) ||
      (currentVersion.startsWith('^') && compatibleVersion.startsWith('^') && 
       currentVersion.split('.')[0] === compatibleVersion.split('.')[0]);
    
    if (!isCompatible) {
      console.log(chalk.red(`❌ ${pkg}: ${currentVersion} (recommended: ${compatibleVersion})`));
      hasIncompatibleVersions = true;
    } else {
      console.log(chalk.green(`✅ ${pkg}: ${currentVersion}`));
    }
  });
  
  // Print summary
  console.log('\n' + chalk.yellow('📋 Dependency Check Summary:'));
  if (hasIncompatibleVersions) {
    console.log(chalk.red('⚠️ Some dependencies may not be compatible with Expo SDK 52.'));
    console.log(chalk.yellow('Consider updating the versions in package.json before running npm install.'));
  } else {
    console.log(chalk.green('🎉 All checked dependencies appear compatible with Expo SDK 52!'));
  }
  
} catch (error) {
  console.error(chalk.red(`❌ Error during dependency check: ${error.message}`));
  process.exit(1);
}
