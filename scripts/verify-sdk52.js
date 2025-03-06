/**
 * SDK 52 Migration Verification Script
 * 
 * This script verifies that key dependencies for Expo SDK 52 are correctly installed
 * and reports any issues or discrepancies.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Expected versions for SDK 52
const EXPECTED_VERSIONS = {
  'expo': '52.0.1',
  'expo-router': '4.0.2',
  'react': '18.2.0',
  'react-native': '0.74.5',
  '@react-navigation/native': '6.1.10',
  'react-native-reanimated': '3.10.1',
  'react-native-screens': '3.31.1'
};

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appJsonPath = path.join(__dirname, '..', 'app.json');

try {
  console.log(chalk.blue('🔍 Verifying SDK 52 Migration...'));
  
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
  if (sdkVersion === '52.0.0') {
    console.log(chalk.green('✅ app.json sdkVersion is correctly set to 52.0.0'));
  } else {
    console.log(chalk.red(`❌ app.json sdkVersion is ${sdkVersion}, expected 52.0.0`));
  }

  console.log(chalk.yellow('📋 Verifying key dependencies:'));
  
  // Check each expected dependency
  let allValid = true;
  Object.entries(EXPECTED_VERSIONS).forEach(([pkg, expectedVersion]) => {
    const actualVersion = dependencies[pkg];
    
    if (!actualVersion) {
      console.log(chalk.red(`❌ ${pkg}: Missing, expected ${expectedVersion}`));
      allValid = false;
    } else if (!actualVersion.includes(expectedVersion.split('.')[0]) && 
              !actualVersion.includes(expectedVersion)) {
      console.log(chalk.red(`❌ ${pkg}: ${actualVersion}, expected compatible with ${expectedVersion}`));
      allValid = false;
    } else {
      console.log(chalk.green(`✅ ${pkg}: ${actualVersion}`));
    }
  });

  // Check for Router v4 compatibility
  console.log(chalk.yellow('📋 Verifying Expo Router v4 compatibility:'));
  try {
    const layoutContent = fs.readFileSync(path.join(__dirname, '..', 'app', '_layout.js'), 'utf8');
    
    if (layoutContent.includes('RouterComponents.Slot') || layoutContent.includes('Slot')) {
      console.log(chalk.green('✅ app/_layout.js uses Slot component (Router v4 compatible)'));
    } else {
      console.log(chalk.red('❌ app/_layout.js might not be using Slot component for Router v4'));
    }

    if (fs.existsSync(path.join(__dirname, '..', 'app', 'router-adapter.js'))) {
      const adapterContent = fs.readFileSync(path.join(__dirname, '..', 'app', 'router-adapter.js'), 'utf8');
      if (adapterContent.includes('52.0.0')) {
        console.log(chalk.green('✅ router-adapter.js is configured for SDK 52'));
      } else {
        console.log(chalk.yellow('⚠️ router-adapter.js might not be updated for SDK 52'));
      }
    } else {
      console.log(chalk.red('❌ router-adapter.js not found'));
    }
    
    // Check babel.config.js
    const babelConfigContent = fs.readFileSync(path.join(__dirname, '..', 'babel.config.js'), 'utf8');
    if (babelConfigContent.includes('Router v4')) {
      console.log(chalk.green('✅ babel.config.js is configured for Expo Router v4'));
    } else {
      console.log(chalk.yellow('⚠️ babel.config.js might not be updated for Expo Router v4'));
    }
  } catch (err) {
    console.log(chalk.red(`❌ Error verifying Router v4 compatibility: ${err.message}`));
  }

  // Summary
  console.log('\n' + chalk.yellow('📋 Migration Verification Summary:'));
  if (allValid && sdkVersion === '52.0.0') {
    console.log(chalk.green('🎉 SDK 52 Migration appears successful!'));
  } else {
    console.log(chalk.red('⚠️ Some issues were found with the SDK 52 migration.'));
  }

} catch (error) {
  console.error(chalk.red(`❌ Error during verification: ${error.message}`));
  process.exit(1);
}
