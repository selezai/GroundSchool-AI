#!/bin/bash

# Update Dependencies Script for GroundSchool-AI
# This script updates dependencies with a focus on Sentry and crash reporting

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${GREEN}GroundSchool-AI Dependency Update${NC}"
echo -e "This script will update dependencies with a focus on Sentry and crash reporting."
echo ""

# Make sure we're in the project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: Not in project root. Please run this script from the project root.${NC}"
  exit 1
fi

# Ask for confirmation
read -p "This will update dependencies. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Update cancelled.${NC}"
  exit 0
fi

echo -e "${YELLOW}Starting dependency update...${NC}"

# First, update Sentry packages
echo -e "Updating Sentry packages..."
npm install --save @sentry/react-native@latest
npm install --save-dev @sentry/node@latest

# Update core dependencies that are safe to update
echo -e "Updating core dependencies..."
npm install --save react-native-dotenv@latest dotenv@latest

# Update Expo packages that are safe to update
echo -e "Updating Expo packages..."
npm install --save expo-constants@latest expo-device@latest

# Fix any dependency conflicts
echo -e "Fixing dependency conflicts..."
npm dedupe

# Clean npm cache
echo -e "Cleaning npm cache..."
npm cache clean --force

# Run npm audit fix
echo -e "Running npm audit fix..."
npm audit fix

# Install again to ensure everything is consistent
echo -e "${GREEN}Reinstalling dependencies...${NC}"
npm install

echo -e "${GREEN}Dependency update complete!${NC}"
echo -e "To rebuild the project, run:"
echo -e "  ${BOLD}npm run build:sentry:preview${NC}"
