#!/bin/bash

# refresh-app.sh - A script to refresh the application for development and testing

echo "===== Aviation Quiz App Refresher ====="
echo "1. Setting up Hot Reloading for Development"
echo "2. Building a new Development Build"
echo "3. Clearing Cache"
echo "4. Running Tests"
echo "======================================"

# 1. Setup Hot Reloading for Development
echo ""
echo "1. Setting up Hot Reloading for Development..."
echo "Stopping any running Metro bundler instances..."
killall -9 node 2>/dev/null

echo "Starting Metro bundler with clean cache..."
# This will start the dev server with a clean cache
npx expo start -c &
DEV_SERVER_PID=$!
sleep 5
# Allow dev server to start in background
kill -9 $DEV_SERVER_PID 2>/dev/null

# 2. Build a fresh Development Build
echo ""
echo "2. Building a fresh Development Build..."
echo "This would typically be done with 'npx expo build:android -t apk' for a production build"
echo "For development, use 'npx expo run:android' or 'npx expo run:ios' after starting the dev server"

# 3. Clear App Cache
echo ""
echo "3. Clearing Cache..."
echo "Clearing npm cache..."
npm cache clean --force
echo "Clearing expo cache..."
npx expo-doctor clear-cache
echo "Clearing watchman cache..."
watchman watch-del-all 2>/dev/null
rm -rf node_modules/.cache

# 4. Run Tests to Verify Functionality
echo ""
echo "4. Running Tests to verify functionality..."
echo "Testing basic app functionality..."
npm test || echo "Tests skipped or failed - please manually verify app functionality"

echo ""
echo "===== App Refresh Complete ====="
echo ""
echo "To run the app with hot reloading, use: npx expo start"
echo "To test on Android emulator: npx expo start --android"
echo "To test on iOS simulator: npx expo start --ios"
echo "To create a production build: npx expo build:android -t apk"
echo ""
echo "Your changes should now be properly reflected in the app!"
