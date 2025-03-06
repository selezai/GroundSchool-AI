#!/usr/bin/env node

/**
 * This script ensures the correct Node.js version is used for the project.
 * It automatically switches to the Node.js version specified in .nvmrc if nvm is available.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

// Read the required Node.js version from .nvmrc
const nvmrcPath = path.join(__dirname, '..', '.nvmrc');
const requiredVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();

// Get current Node.js version
const currentVersion = process.version.slice(1); // Remove 'v' prefix

console.log(`🔍 Current Node.js version: ${process.version}`);
console.log(`📋 Required Node.js version from .nvmrc: v${requiredVersion}`);

// Check if current version satisfies the requirement
if (!currentVersion.startsWith(requiredVersion)) {
  console.log(`⚠️ Node.js version mismatch. Required: v${requiredVersion}.x, Current: ${process.version}`);
  
  try {
    // Try to use nvm to switch Node.js version
    console.log(`🔄 Attempting to switch to Node.js v${requiredVersion} using nvm...`);
    
    // Check if nvm is available
    const nvmPath = process.env.NVM_DIR || path.join(process.env.HOME, '.nvm');
    
    if (fs.existsSync(nvmPath)) {
      try {
        // Execute nvm command
        execSync(`source "${nvmPath}/nvm.sh" && nvm use ${requiredVersion}`, { 
          stdio: 'inherit',
          shell: '/bin/bash'
        });
        
        console.log(`✅ Successfully switched to Node.js v${requiredVersion}`);
        console.log(`🚨 Please restart the application with 'npm start' to use the correct Node.js version.`);
        exit(1); // Exit with error to prevent npm from continuing
      } catch (error) {
        console.error(`❌ Failed to switch Node.js version using nvm:`, error.message);
        console.log(`🚨 Please manually switch to Node.js v${requiredVersion} using:\n   source ~/.nvm/nvm.sh && nvm use ${requiredVersion}`);
        exit(1);
      }
    } else {
      console.log(`⚠️ nvm not found. Please install nvm or manually switch to Node.js v${requiredVersion}`);
      exit(1);
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    exit(1);
  }
} else {
  console.log(`✅ Using correct Node.js version: ${process.version}`);
}
