#!/bin/bash
# Script to build a standalone version of the GroundSchool-AI app
# This script builds a standalone APK that doesn't require a development server

# Set error handling
set -e

# Display header
echo "========================================"
echo "GroundSchool-AI Standalone Build Script"
echo "========================================"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
node -v | grep -q "v18" || { echo "Error: Node.js v18 is required. Please use nvm to switch to the correct version."; exit 1; }

# Install dependencies if needed
echo "Installing and updating dependencies..."
npm install

# Install missing system UI package
echo "Installing expo-system-ui for Android..."
npm install expo-system-ui

# Fix outdated packages
echo "Updating Expo packages to latest compatible versions..."
npx expo install --fix

# Clean build cache
echo "Cleaning build cache..."
rm -rf .expo/web-build/ || true
rm -rf dist/ || true

# Run expo doctor to check for issues
echo "Running expo-doctor to check for issues..."
npx expo-doctor

# Update environment for standalone build
echo "Configuring environment for standalone build..."
# This ensures the app knows it's running in standalone mode
npx expo config --type introspect > /dev/null

# Build the standalone app
echo "Building standalone app using EAS..."
echo "This will create an APK file that can run without a development server."
export NODE_OPTIONS="--max-old-space-size=4096"

# Use the full path to eas to avoid execution issues
EAS_PATH="$(npm bin)/eas"
echo "Using EAS at: $EAS_PATH"

if [ ! -f "$EAS_PATH" ]; then
  echo "EAS binary not found. Installing eas-cli globally..."
  npm install -g eas-cli
  EAS_PATH="$(which eas)"
fi

echo "Starting EAS build..."
"$EAS_PATH" build --profile standalone --platform android --non-interactive

echo ""
echo "Build process started!"
echo ""
echo "Your standalone app build has been queued on EAS servers."
echo "You can check the build status in the Expo dashboard or by running:"
echo "npx eas build:list"
echo ""
echo "Once complete, you can download the APK from the Expo dashboard"
echo "or by running: npx eas build:download"
echo ""
echo "Note: This build is configured to work without a development server"
echo "and includes all the Claude AI integration functionality."
