#!/bin/bash
# GroundSchool-AI - OTA Update Publisher
# This script publishes an update that will be automatically applied to existing app installations

echo "========================================="
echo "GroundSchool-AI - OTA Update Publisher"
echo "========================================="

# Ensure we're using the correct Node.js version
if [ -f .nvmrc ]; then
  echo "Using Node.js version specified in .nvmrc..."
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm use
fi

# Set environment variables for the update
export EAS_NO_VCS=1

echo "Creating update for production channel..."
npx eas update --auto --channel production

echo ""
echo "Update has been published!"
echo "Users will automatically receive this update next time they open the app."
echo "No reinstallation required."
