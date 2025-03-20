#!/bin/bash

# Build script for GroundSchool-AI with Sentry integration
# This script builds the app with the specified profile and platform

# Set default values
PROFILE="development"
PLATFORM="all"

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Print usage information
function print_usage {
  echo -e "${BOLD}Usage:${NC} ./scripts/build-with-sentry.sh [options]"
  echo ""
  echo "Options:"
  echo "  -p, --profile    Build profile (development, preview, production) [default: development]"
  echo "  -t, --platform   Platform to build for (android, ios, all) [default: all]"
  echo "  -h, --help       Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/build-with-sentry.sh --profile development --platform android"
  echo "  ./scripts/build-with-sentry.sh -p preview -t ios"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -p|--profile)
      PROFILE="$2"
      shift
      shift
      ;;
    -t|--platform)
      PLATFORM="$2"
      shift
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_usage
      exit 1
      ;;
  esac
done

# Validate profile
if [[ "$PROFILE" != "development" && "$PROFILE" != "preview" && "$PROFILE" != "production" ]]; then
  echo -e "${RED}Error: Invalid profile '$PROFILE'. Must be one of: development, preview, production${NC}"
  exit 1
fi

# Validate platform
if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "all" ]]; then
  echo -e "${RED}Error: Invalid platform '$PLATFORM'. Must be one of: android, ios, all${NC}"
  exit 1
fi

# Set environment variable for Sentry
if [[ "$PROFILE" == "development" ]]; then
  export SENTRY_ENVIRONMENT="development"
elif [[ "$PROFILE" == "preview" ]]; then
  export SENTRY_ENVIRONMENT="preview"
else
  export SENTRY_ENVIRONMENT="production"
fi

echo -e "${GREEN}${BOLD}Building GroundSchool-AI with Sentry integration${NC}"
echo -e "${YELLOW}Profile:${NC} $PROFILE"
echo -e "${YELLOW}Platform:${NC} $PLATFORM"
echo -e "${YELLOW}Sentry Environment:${NC} $SENTRY_ENVIRONMENT"
echo ""

# Run pre-build checks
echo -e "${YELLOW}Running pre-build checks...${NC}"
node scripts/pre-build-checks.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Pre-build checks failed. Aborting build.${NC}"
  exit 1
fi
echo -e "${GREEN}Pre-build checks passed.${NC}"
echo ""

# Build the app
echo -e "${YELLOW}Starting build process...${NC}"
echo ""

if [ "$PLATFORM" == "all" ]; then
  npx eas build --profile $PROFILE --platform all
elif [ "$PLATFORM" == "android" ]; then
  npx eas build --profile $PROFILE --platform android
elif [ "$PLATFORM" == "ios" ]; then
  npx eas build --profile $PROFILE --platform ios
fi

# Check if build was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Please check the logs for more information.${NC}"
  exit 1
fi

echo -e "${GREEN}${BOLD}Build completed successfully!${NC}"
echo ""
echo -e "You can view your build status in the EAS dashboard."
echo -e "Sentry will automatically capture crash reports from this build."
