/**
 * SDK 51 Migration Verification Script
 * 
 * This script verifies that key dependencies for Expo SDK 51 are correctly installed
 * and reports any issues or discrepancies.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Expected versions for SDK 51
const EXPECTED_VERSIONS = {
  'expo': '51.0.0',
  'expo-router': '3.4.6',
  'react': '18.2.0',
  'react-native': '0.73.2',
  '@react-navigation/native': '6.1.9',
  'react-native-reanimated': '3.6.1',
  'react-native-screens': '3.29.0'
};

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appJsonPath = path.join(__dirname, '..', 'app.json');

try {
  console.log(chalk.blue('🔍 Verifying SDK 51 Migration...'));
  
  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('❌ package.json not found!'));
    process.exit(1);
  }

  // Check if app.json exists
  if (!fs.existsSync(appJsonPath)) {
    console.error(chalk.red('❌ app.json not found!'));
    process.exit(1);
  }

  // Parse package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Parse app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const sdkVersion = appJson.expo?.sdkVersion;

  console.log(chalk.yellow('📋 Verifying app.json:'));
  if (sdkVersion === '51.0.0') {
    console.log(chalk.green('✅ app.json sdkVersion is correctly set to 51.0.0'));
  } else {
    console.log(chalk.red(`❌ app.json sdkVersion is ${sdkVersion}, expected 51.0.0`));
  }

  console.log(chalk.yellow('📋 Verifying key dependencies:'));
  
  // Check each expected dependency
  let allValid = true;
  Object.entries(EXPECTED_VERSIONS).forEach(([pkg, expectedVersion]) => {
    const actualVersion = dependencies[pkg];
    
    if (!actualVersion) {
      console.log(chalk.red(`❌ ${pkg}: Missing, expected ${expectedVersion}`));
      allValid = false;
    } else if (actualVersion !== expectedVersion && 
              !actualVersion.startsWith(expectedVersion) && 
              !expectedVersion.startsWith(actualVersion.split('.')[0])) {
      console.log(chalk.red(`❌ ${pkg}: ${actualVersion}, expected ${expectedVersion}`));
      allValid = false;
    } else {
      console.log(chalk.green(`✅ ${pkg}: ${actualVersion}`));
    }
  });

  // Check for Router v3 compatibility
  console.log(chalk.yellow('📋 Verifying Expo Router v3 compatibility:'));
  try {
    const layoutContent = fs.readFileSync(path.join(__dirname, '..', 'app', '_layout.js'), 'utf8');
    
    if (layoutContent.includes('RouterComponents.Slot') || layoutContent.includes('Slot')) {
      console.log(chalk.green('✅ app/_layout.js uses Slot component (Router v3 compatible)'));
    } else {
      console.log(chalk.red('❌ app/_layout.js might not be using Slot component for Router v3'));
    }

    if (fs.existsSync(path.join(__dirname, '..', 'app', 'router-adapter.js'))) {
      console.log(chalk.green('✅ router-adapter.js exists for version compatibility'));
    } else {
      console.log(chalk.red('❌ router-adapter.js not found'));
    }
  } catch (err) {
    console.log(chalk.red(`❌ Error verifying Router v3 compatibility: ${err.message}`));
  }

  // Summary
  console.log('\n' + chalk.yellow('📋 Migration Verification Summary:'));
  if (allValid && sdkVersion === '51.0.0') {
    console.log(chalk.green('🎉 SDK 51 Migration appears successful!'));
  } else {
    console.log(chalk.red('⚠️ Some issues were found with the SDK 51 migration.'));
  }

} catch (error) {
  console.error(chalk.red(`❌ Error during verification: ${error.message}`));
  process.exit(1);
}
