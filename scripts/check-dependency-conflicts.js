/**
 * Check Dependency Conflicts
 * 
 * This script analyzes the node_modules directory to find potential
 * dependency conflicts that might be causing crashes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define critical packages that might cause conflicts
const CRITICAL_PACKAGES = [
  '@sentry/react-native',
  'react-native',
  'expo',
  'expo-router',
  'react-navigation',
  '@react-navigation/native',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}Dependency Conflict Checker${colors.reset}`);
console.log('Analyzing node_modules for potential conflicts...\n');

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log(`${colors.red}Error: node_modules directory not found. Run npm install first.${colors.reset}`);
  process.exit(1);
}

// Function to find all instances of a package in node_modules
function findPackageInstances(packageName) {
  try {
    // Use find command to locate all package.json files for this package
    const cmd = `find ${nodeModulesPath} -type f -path "*/${packageName}/package.json" -o -path "*node_modules/${packageName.replace('@', '')}/package.json"`;
    const result = execSync(cmd, { encoding: 'utf8' });
    
    // Parse the results
    const paths = result.trim().split('\n').filter(Boolean);
    
    // Extract version information
    return paths.map(packagePath => {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return {
          path: packagePath.replace(process.cwd(), ''),
          version: packageJson.version,
          parent: getParentPackage(packagePath)
        };
      } catch (err) {
        return {
          path: packagePath.replace(process.cwd(), ''),
          version: 'unknown',
          error: err.message,
          parent: getParentPackage(packagePath)
        };
      }
    });
  } catch (err) {
    return [];
  }
}

// Function to get the parent package that depends on this package
function getParentPackage(packagePath) {
  // Extract the parent path
  const parts = packagePath.split('/node_modules/');
  if (parts.length <= 2) {
    return 'root';
  }
  
  // The parent is the last part before the current package
  const parentParts = parts[parts.length - 2].split('/');
  return parentParts[parentParts.length - 1];
}

// Check each critical package
let hasConflicts = false;
CRITICAL_PACKAGES.forEach(packageName => {
  const instances = findPackageInstances(packageName);
  
  if (instances.length === 0) {
    console.log(`${colors.yellow}Warning: Package ${packageName} not found${colors.reset}`);
    return;
  }
  
  if (instances.length === 1) {
    console.log(`${colors.green}✓ ${packageName}@${instances[0].version}${colors.reset}`);
    return;
  }
  
  // Multiple versions found - potential conflict
  hasConflicts = true;
  console.log(`${colors.red}✗ ${colors.bold}${packageName}${colors.reset}${colors.red} has multiple versions:${colors.reset}`);
  
  // Group by version
  const versionMap = {};
  instances.forEach(instance => {
    if (!versionMap[instance.version]) {
      versionMap[instance.version] = [];
    }
    versionMap[instance.version].push(instance);
  });
  
  // Display each version and its locations
  Object.keys(versionMap).forEach(version => {
    console.log(`  ${colors.yellow}Version ${version}:${colors.reset}`);
    versionMap[version].forEach(instance => {
      console.log(`    - ${instance.path} (required by: ${instance.parent})`);
    });
  });
  
  console.log('');
});

if (!hasConflicts) {
  console.log(`\n${colors.green}${colors.bold}No conflicts found in critical packages!${colors.reset}`);
} else {
  console.log(`\n${colors.red}${colors.bold}Conflicts detected!${colors.reset}`);
  console.log(`${colors.yellow}Recommendation: Run the following commands to fix:${colors.reset}`);
  console.log('  npm dedupe');
  console.log('  npm install');
  console.log('  ./scripts/clean-project.sh');
}

// Check for peer dependency issues
console.log(`\n${colors.blue}${colors.bold}Checking for peer dependency issues...${colors.reset}`);
try {
  const npmOutput = execSync('npm ls', { encoding: 'utf8' });
  const peerIssues = npmOutput.match(/UNMET PEER DEPENDENCY.*/g);
  
  if (peerIssues && peerIssues.length > 0) {
    console.log(`${colors.red}Found ${peerIssues.length} peer dependency issues:${colors.reset}`);
    peerIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  } else {
    console.log(`${colors.green}No peer dependency issues found.${colors.reset}`);
  }
} catch (err) {
  console.log(`${colors.red}Error checking peer dependencies: ${err.message}${colors.reset}`);
}

// Check for native module issues
console.log(`\n${colors.blue}${colors.bold}Checking for native module issues...${colors.reset}`);
const nativeModules = [
  '@sentry/react-native',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-screens'
];

nativeModules.forEach(moduleName => {
  const modulePath = path.join(nodeModulesPath, moduleName);
  if (!fs.existsSync(modulePath)) {
    console.log(`${colors.yellow}Warning: Native module ${moduleName} not found${colors.reset}`);
    return;
  }
  
  // Check if the module has been properly linked
  const iosPath = path.join(modulePath, 'ios');
  const androidPath = path.join(modulePath, 'android');
  
  if (fs.existsSync(iosPath) && fs.existsSync(androidPath)) {
    console.log(`${colors.green}✓ ${moduleName} has native code for both iOS and Android${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ ${moduleName} might have missing native code${colors.reset}`);
  }
});

console.log(`\n${colors.bold}Analysis complete.${colors.reset}`);
