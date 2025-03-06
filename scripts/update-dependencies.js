#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk') || { green: text => text, yellow: text => text, red: text => text };

// Define the recommended package versions
const recommendedVersions = {
  "@react-native-async-storage/async-storage": "1.23.1",
  "expo-constants": "~17.0.7",
  "expo-document-picker": "~13.0.3",
  "expo-font": "~13.0.4",
  "expo-linking": "~7.0.5",
  "expo-splash-screen": "~0.29.22",
  "expo-status-bar": "~2.0.1",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-native": "0.76.7",
  "react-native-gesture-handler": "~2.20.2",
  "react-native-reanimated": "~3.16.1",
  "react-native-safe-area-context": "4.12.0",
  "react-native-screens": "~4.4.0",
  "@types/react": "~18.3.12"
};

// Path to package.json
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

// Function to update package.json
function updatePackageJson() {
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Make backup of original package.json
    fs.writeFileSync(`${packageJsonPath}.bak`, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green('✅ Created backup of package.json'));
    
    // Update dependencies
    let updatedCount = 0;
    for (const [pkg, version] of Object.entries(recommendedVersions)) {
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        console.log(chalk.yellow(`Updating ${pkg} from ${packageJson.dependencies[pkg]} to ${version}`));
        packageJson.dependencies[pkg] = version;
        updatedCount++;
      } else if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
        console.log(chalk.yellow(`Updating ${pkg} from ${packageJson.devDependencies[pkg]} to ${version}`));
        packageJson.devDependencies[pkg] = version;
        updatedCount++;
      } else {
        console.log(chalk.yellow(`Package ${pkg} not found in dependencies or devDependencies`));
      }
    }
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green(`✅ Updated ${updatedCount} package(s) in package.json`));
    
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Error updating package.json: ${error.message}`));
    return false;
  }
}

// Main function
function main() {
  console.log(chalk.green('🔍 Checking for package updates for Expo SDK 52...'));
  
  if (updatePackageJson()) {
    console.log(chalk.green('✅ Package.json updated with recommended versions for Expo SDK 52'));
    console.log(chalk.yellow('ℹ️  To complete the update, run: npm install'));
  } else {
    console.log(chalk.red('❌ Failed to update package.json'));
  }
}

// Run the script
main();
