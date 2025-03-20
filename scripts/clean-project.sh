#!/bin/bash

# Clean Project Script for GroundSchool-AI
# This script cleans up the project for a fresh build

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${GREEN}GroundSchool-AI Project Cleanup${NC}"
echo -e "This script will clean up the project for a fresh build."
echo ""

# Make sure we're in the project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: Not in project root. Please run this script from the project root.${NC}"
  exit 1
fi

# Ask for confirmation
read -p "This will remove node_modules, the .expo directory, and other build artifacts. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Cleanup cancelled.${NC}"
  exit 0
fi

echo -e "${YELLOW}Starting cleanup...${NC}"

# Stop any running processes
echo -e "Stopping any running processes..."
npx kill-port 19000 19001 19002 8081

# Remove node_modules
echo -e "Removing node_modules..."
rm -rf node_modules

# Remove Expo cache
echo -e "Removing Expo cache..."
rm -rf .expo
rm -rf .expo-shared

# Remove iOS and Android build directories
echo -e "Removing iOS and Android build directories..."
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build

# Remove Metro bundler cache
echo -e "Removing Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*

# Remove Watchman cache
echo -e "Cleaning Watchman..."
watchman watch-del-all 2>/dev/null || true

# Clear React Native cache
echo -e "Clearing React Native cache..."
rm -rf $TMPDIR/react-*

# Clear npm cache
echo -e "Clearing npm cache..."
npm cache clean --force

# Remove package-lock.json
echo -e "Removing package-lock.json..."
rm -f package-lock.json

# Reinstall dependencies
echo -e "${GREEN}Reinstalling dependencies...${NC}"
npm install

# Rebuild the project
echo -e "${GREEN}Cleanup complete!${NC}"
echo -e "To rebuild the project, run:"
echo -e "  ${BOLD}npm run build:sentry:preview${NC}"
echo ""
echo -e "To start the development server, run:"
echo -e "  ${BOLD}npm start${NC}"
