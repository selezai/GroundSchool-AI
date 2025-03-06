/**
 * Node.js Version Compatibility Checker
 * 
 * This script checks if the current Node.js version is compatible with
 * the target Expo SDK version.
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

// Node.js version requirements for different Expo SDK versions
const SDK_NODE_REQUIREMENTS = {
  '47': { major: 16, minor: 0 },
  '48': { major: 16, minor: 0 },
  '49': { major: 16, minor: 0 },
  '50': { major: 18, minor: 0 },
  '51': { major: 16, minor: 0 },
  '52': { major: 18, minor: 0 }
};

// Get current Node.js version
const currentNodeVersion = process.version;
const match = currentNodeVersion.match(/v(\d+)\.(\d+)\.(\d+)/);

if (!match) {
  console.error(chalk.red(`❌ Could not parse Node.js version: ${currentNodeVersion}`));
  process.exit(1);
}

const [, nodeMajor, nodeMinor] = match.map(Number);
console.log(chalk.blue(`🔍 Current Node.js version: ${currentNodeVersion}`));

// Get current Expo SDK version from app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
if (!fs.existsSync(appJsonPath)) {
  console.error(chalk.red('❌ app.json not found!'));
  process.exit(1);
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const sdkVersion = appJson.expo?.sdkVersion;

if (!sdkVersion) {
  console.error(chalk.red('❌ Could not find SDK version in app.json!'));
  process.exit(1);
}

const sdkMajor = parseInt(sdkVersion.split('.')[0], 10);
console.log(chalk.blue(`🔍 Target Expo SDK version: ${sdkVersion}`));

// Check compatibility
const requirement = SDK_NODE_REQUIREMENTS[sdkMajor];
if (!requirement) {
  console.log(chalk.yellow(`⚠️ No known Node.js requirements for Expo SDK ${sdkMajor}.`));
  process.exit(0);
}

const isCompatible = 
  nodeMajor > requirement.major || 
  (nodeMajor === requirement.major && nodeMinor >= requirement.minor);

console.log(chalk.yellow(`📋 Required Node.js version for Expo SDK ${sdkMajor}: v${requirement.major}.${requirement.minor}.0 or higher`));

if (isCompatible) {
  console.log(chalk.green(`✅ Your Node.js version ${currentNodeVersion} is compatible with Expo SDK ${sdkMajor}!`));
} else {
  console.log(chalk.red(`❌ Your Node.js version ${currentNodeVersion} is NOT compatible with Expo SDK ${sdkMajor}!`));
  console.log(chalk.yellow(`💡 You need to upgrade to Node.js v${requirement.major}.${requirement.minor}.0 or higher.`));
  
  // Suggest NVM for version management
  console.log(chalk.blue(`\n📝 Suggestion: Use NVM to manage Node.js versions:`));
  console.log(chalk.yellow(`  1. Install NVM if not already installed: https://github.com/nvm-sh/nvm`));
  console.log(chalk.yellow(`  2. Install required Node.js version: nvm install ${requirement.major}`));
  console.log(chalk.yellow(`  3. Use the required version: nvm use ${requirement.major}`));
  console.log(chalk.yellow(`  4. Verify: node --version`));
}

// Check npm version as well
const { execSync } = require('child_process');
let npmVersion;
try {
  npmVersion = execSync('npm --version').toString().trim();
  console.log(chalk.blue(`🔍 Current npm version: ${npmVersion}`));
  
  const npmMajor = parseInt(npmVersion.split('.')[0], 10);
  
  // Recommended npm versions
  const recommendedNpmVersion = sdkMajor >= 50 ? 9 : 8;
  
  if (npmMajor >= recommendedNpmVersion) {
    console.log(chalk.green(`✅ Your npm version ${npmVersion} is compatible with Expo SDK ${sdkMajor}!`));
  } else {
    console.log(chalk.yellow(`⚠️ Consider upgrading npm to v${recommendedNpmVersion}.x for better compatibility with Expo SDK ${sdkMajor}.`));
  }
} catch (e) {
  console.log(chalk.yellow(`⚠️ Could not determine npm version.`));
}
