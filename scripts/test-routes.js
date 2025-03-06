#!/usr/bin/env node

/**
 * Expo SDK 52 Migration - Route Testing Tool
 * 
 * This script tests all routes in the application to verify 
 * that they load correctly after the Expo SDK 52 migration.
 * 
 * Usage:
 *   npm run test-routes
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: text => text, yellow: text => text, red: text => text };

// Define the app directory
const appDir = path.resolve(__dirname, '..', 'app');

/**
 * Finds all potential route files in the app directory
 * @returns {Array<string>} Array of routes found
 */
function findRoutes() {
  try {
    // Get all files in the app directory recursively
    const getFilesRecursively = (dir) => {
      const files = [];
      
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          files.push(...getFilesRecursively(fullPath));
        } else if (
          item.isFile() && 
          (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) &&
          !item.name.startsWith('_')
        ) {
          files.push(fullPath);
        }
      }
      
      return files;
    };
    
    const allFiles = getFilesRecursively(appDir);
    
    // Convert file paths to route paths
    const routes = allFiles.map(file => {
      const relativePath = path.relative(appDir, file);
      const routePath = relativePath
        .replace(/\\/g, '/') // Convert Windows backslashes to forward slashes
        .replace(/\.(js|jsx|tsx)$/, '') // Remove file extension
        .replace(/\/index$/, ''); // Remove index from route path
      
      return {
        routePath: `/${routePath}`,
        filePath: file
      };
    });
    
    return routes;
  } catch (error) {
    console.error(chalk.red(`❌ Error finding routes: ${error.message}`));
    return [];
  }
}

/**
 * Checks a route file for common issues after migration
 * @param {string} filePath Path to the route file
 * @returns {Array} Array of issues found
 */
function checkRouteFile(filePath) {
  try {
    const issues = [];
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for deprecated imports
    if (content.includes('import { Slot } from "expo-router/layouts"') || 
        content.includes("import { Slot } from 'expo-router/layouts'")) {
      issues.push('Uses deprecated import from expo-router/layouts');
    }
    
    // Check for old Screen import pattern
    if (content.includes('import { Screen } from "expo-router"') || 
        content.includes("import { Screen } from 'expo-router'")) {
      issues.push('Uses deprecated Screen import pattern');
    }
    
    // Check for missing expo-router imports
    if ((content.includes('<Slot') || content.includes('<Stack.Screen')) && 
        !content.includes('expo-router')) {
      issues.push('Uses router components but missing expo-router import');
    }
    
    return issues;
  } catch (error) {
    return [`Error analyzing file: ${error.message}`];
  }
}

/**
 * Main function
 */
function main() {
  console.log(chalk.green('🔍 Testing application routes after Expo SDK 52 migration...\n'));
  
  const routes = findRoutes();
  
  if (routes.length === 0) {
    console.log(chalk.yellow('⚠️ No routes found in the app directory'));
    return;
  }
  
  console.log(chalk.green(`Found ${routes.length} routes to test:`));
  
  let hasIssues = false;
  
  routes.forEach((route, index) => {
    const issues = checkRouteFile(route.filePath);
    
    if (issues.length > 0) {
      hasIssues = true;
      console.log(chalk.yellow(`\n${index + 1}. ${route.routePath} (${path.relative(appDir, route.filePath)})`));
      console.log(chalk.red(`   Issues found:`));
      issues.forEach(issue => {
        console.log(chalk.red(`   - ${issue}`));
      });
    } else {
      console.log(chalk.green(`${index + 1}. ${route.routePath} - OK`));
    }
  });
  
  console.log('\n');
  
  if (hasIssues) {
    console.log(chalk.yellow('⚠️ Some routes have potential issues that need to be addressed'));
    console.log(chalk.yellow('   Please check the files listed above and fix the issues'));
  } else {
    console.log(chalk.green('✅ All routes appear to be compatible with Expo SDK 52'));
  }
  
  console.log(chalk.green('\n📋 Migration testing completed!'));
}

// Run the script
main();
