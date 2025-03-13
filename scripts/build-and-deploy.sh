#!/bin/bash
# Script to build and deploy the app

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting build and deploy process...${NC}"

# Step 1: Make sure we're using the right Node.js version
echo -e "\n${YELLOW}Checking Node.js version...${NC}"
if [ -f .nvmrc ]; then
  echo "Found .nvmrc file, using specified Node.js version"
  . ~/.nvm/nvm.sh || true  # Source NVM if available
  nvm use || true
fi

# Step 2: Install dependencies if needed
echo -e "\n${YELLOW}Checking dependencies...${NC}"
if [ "$1" == "--install" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Step 3: Run tests
echo -e "\n${YELLOW}Running DeepSeek API test...${NC}"
node scripts/check-deepseek-direct.js
if [ $? -ne 0 ]; then
  echo -e "${RED}DeepSeek API test failed. Aborting build.${NC}"
  exit 1
fi

# Step 4: Choose build type
BUILD_TYPE="development"
if [ "$1" == "--production" ] || [ "$2" == "--production" ]; then
  BUILD_TYPE="production"
  echo -e "\n${YELLOW}Building PRODUCTION version${NC}"
else
  echo -e "\n${YELLOW}Building DEVELOPMENT version${NC}"
  echo "Use --production flag to build a production version"
fi

# Step 5: Build the app
echo -e "\n${YELLOW}Building app (${BUILD_TYPE})...${NC}"
if [ "$BUILD_TYPE" == "production" ]; then
  # Production build with EAS
  eas build --platform android --non-interactive
else
  # Development build
  expo build:android -t apk
fi

# Step 6: Deploy updates (if using Expo Updates)
if [ "$1" == "--publish" ] || [ "$2" == "--publish" ] || [ "$3" == "--publish" ]; then
  echo -e "\n${YELLOW}Publishing updates to Expo...${NC}"
  expo publish
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Updates published successfully!${NC}"
    echo "Users with the existing app will receive these changes on next app launch."
  else
    echo -e "${RED}Failed to publish updates.${NC}"
  fi
fi

echo -e "\n${GREEN}Build process completed!${NC}"
echo "Check the output above for any errors or warnings."

# Display help if requested
if [ "$1" == "--help" ]; then
  echo -e "\n${YELLOW}Usage:${NC}"
  echo "./scripts/build-and-deploy.sh [options]"
  echo ""
  echo "Options:"
  echo "  --install     Install dependencies before building"
  echo "  --production  Build a production version"
  echo "  --publish     Publish updates to Expo after building"
  echo "  --help        Display this help message"
fi
