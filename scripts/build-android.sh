#!/bin/bash
# Script to build a standalone Android APK with DeepSeek API integration
# Modified version focused on Android only

# Set error handling
set -e

# Display header
echo "========================================"
echo "GroundSchool-AI Android Build Script"
echo "========================================"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
node -v | grep -q "v18" || { echo "Error: Node.js v18 is required. Please use nvm to switch to the correct version."; exit 1; }

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Install missing system UI package
echo "Ensuring expo-system-ui is installed..."
npm install expo-system-ui

# Clean build cache
echo "Cleaning build cache..."
rm -rf .expo/web-build/ || true
rm -rf dist/ || true

# Update environment for standalone build
echo "Configuring environment for standalone build..."
npx expo config --type introspect > /dev/null

# Build the standalone app
echo "Building standalone Android app using EAS..."
echo "This will create an APK file with the DeepSeek API integration."
export NODE_OPTIONS="--max-old-space-size=4096"

# Ensure EAS CLI is available
if ! command -v eas &> /dev/null; then
  echo "EAS CLI not found. Installing eas-cli globally..."
  npm install -g eas-cli
fi

# Start the build for Android only
echo "Starting EAS build for Android..."
eas build --platform android --profile standalone --non-interactive

echo ""
echo "Android build process started!"
echo ""
echo "Your app build with DeepSeek API integration has been queued on EAS servers."
echo "You can check the build status in the Expo dashboard or by running:"
echo "npx eas build:list"
echo ""
echo "Once complete, you can download the APK from the Expo dashboard"
echo "or by running: npx eas build:download"
