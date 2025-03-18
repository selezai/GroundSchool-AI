#!/bin/bash

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   GroundSchool-AI Build Script       ${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Function to print usage
function print_usage {
  echo -e "${YELLOW}Usage:${NC}"
  echo -e "  ./scripts/build.sh [options]"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo -e "  ${GREEN}dev${NC}         Build development version for all platforms"
  echo -e "  ${GREEN}preview${NC}     Build preview version for all platforms"
  echo -e "  ${GREEN}production${NC}  Build production version for all platforms"
  echo -e "  ${GREEN}android${NC}     Build production version for Android only"
  echo -e "  ${GREEN}ios${NC}         Build production version for iOS only"
  echo -e "  ${GREEN}help${NC}        Show this help message"
  echo ""
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
  echo -e "${RED}Error: No build type specified${NC}"
  print_usage
  exit 1
fi

# Process arguments
case "$1" in
  dev)
    echo -e "${BLUE}Building development version for all platforms...${NC}"
    npm run build:dev
    ;;
  preview)
    echo -e "${BLUE}Building preview version for all platforms...${NC}"
    npm run build:preview
    ;;
  production)
    echo -e "${BLUE}Building production version for all platforms...${NC}"
    npm run build:production
    ;;
  android)
    echo -e "${BLUE}Building production version for Android only...${NC}"
    npm run build:android
    ;;
  ios)
    echo -e "${BLUE}Building production version for iOS only...${NC}"
    npm run build:ios
    ;;
  help)
    print_usage
    exit 0
    ;;
  *)
    echo -e "${RED}Error: Unknown build type: $1${NC}"
    print_usage
    exit 1
    ;;
esac

echo -e "${GREEN}Build process initiated. Check EAS dashboard for build status.${NC}"
echo -e "${BLUE}https://expo.dev/accounts/selezai/projects/groundschool-ai/builds${NC}"
