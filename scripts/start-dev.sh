#!/bin/bash

# Development Startup Script for GroundSchool-AI
# This script helps launch the development environment with proper configuration

clear
echo "=== GroundSchool-AI Development Launcher ==="
echo "Starting development environment..."

# Make scripts executable if they aren't already
chmod +x ./scripts/*.sh

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "⚠️ node_modules not found. Running npm install first..."
  npm install
fi

# Set environment variables for development
export NODE_ENV=development
export EXPO_DEBUG=true

# Adding additional logging for troubleshooting
echo "Starting Expo development server with clean cache..."

# Clear cache and start development server
# This helps prevent issues after major version changes
echo "Clearing Metro bundler cache..."
rm -rf node_modules/.cache

# Start Expo with dev client
echo "Launching Expo development server..."
npx expo start --clear
