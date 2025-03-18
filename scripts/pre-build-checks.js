#!/usr/bin/env node

/**
 * Pre-build checks script
 * This script runs before EAS builds to ensure the environment is properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Log with colors
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Check if required files exist
function checkRequiredFiles() {
  log.info('Checking required files...');
  
  const requiredFiles = [
    { path: 'app.json', name: 'Expo configuration' },
    { path: 'eas.json', name: 'EAS Build configuration' },
    { path: 'package.json', name: 'Package configuration' },
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file.path);
    if (fileExists(filePath)) {
      log.success(`${file.name} (${file.path}) exists`);
    } else {
      log.error(`${file.name} (${file.path}) is missing`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// Validate app.json configuration
function validateAppJson() {
  log.info('Validating app.json configuration...');
  
  try {
    const appJsonPath = path.join(process.cwd(), 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Check required fields
    const requiredFields = [
      { path: 'expo.name', name: 'App name' },
      { path: 'expo.slug', name: 'App slug' },
      { path: 'expo.version', name: 'App version' },
      { path: 'expo.android.package', name: 'Android package name' },
      { path: 'expo.ios.bundleIdentifier', name: 'iOS bundle identifier' },
    ];
    
    let allFieldsExist = true;
    
    for (const field of requiredFields) {
      const parts = field.path.split('.');
      let value = appJson;
      
      for (const part of parts) {
        if (value && value[part] !== undefined) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      
      if (value) {
        log.success(`${field.name} (${field.path}) is configured: ${value}`);
      } else {
        log.error(`${field.name} (${field.path}) is missing or empty`);
        allFieldsExist = false;
      }
    }
    
    return allFieldsExist;
  } catch (err) {
    log.error(`Failed to validate app.json: ${err.message}`);
    return false;
  }
}

// Check for native modules that might need special handling
function checkNativeModules() {
  log.info('Checking for native modules that might need special handling...');
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const nativeModules = [
      '@react-native-google-signin/google-signin',
      'expo-apple-authentication',
      'react-native-keychain',
      '@invertase/react-native-apple-authentication',
    ];
    
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const module of nativeModules) {
      if (dependencies[module]) {
        log.warning(`Native module detected: ${module} (${dependencies[module]})`);
        log.warning(`Make sure you've configured any required native code for ${module}`);
      }
    }
    
    return true;
  } catch (err) {
    log.error(`Failed to check native modules: ${err.message}`);
    return false;
  }
}

// Check if the app is using Expo SDK 52
function checkExpoSdkVersion() {
  log.info('Checking Expo SDK version...');
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const expoVersion = packageJson.dependencies.expo;
    
    if (expoVersion && expoVersion.includes('52.')) {
      log.success(`Using Expo SDK 52: ${expoVersion}`);
      return true;
    } else {
      log.error(`Not using Expo SDK 52. Found: ${expoVersion}`);
      return false;
    }
  } catch (err) {
    log.error(`Failed to check Expo SDK version: ${err.message}`);
    return false;
  }
}

// Run all checks
function runAllChecks() {
  log.info('Running pre-build checks...');
  console.log(''); // Empty line for better readability
  
  const checks = [
    { name: 'Required Files', fn: checkRequiredFiles },
    { name: 'App Configuration', fn: validateAppJson },
    { name: 'Native Modules', fn: checkNativeModules },
    { name: 'Expo SDK Version', fn: checkExpoSdkVersion },
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    console.log(`${colors.cyan}====== ${check.name} ======${colors.reset}`);
    const passed = check.fn();
    allPassed = allPassed && passed;
    console.log(''); // Empty line for better readability
  }
  
  if (allPassed) {
    log.success('All pre-build checks passed! Ready to build.');
  } else {
    log.error('Some pre-build checks failed. Please fix the issues before building.');
    process.exit(1);
  }
}

// Run the checks
runAllChecks();
