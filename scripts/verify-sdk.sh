#!/bin/bash

# Verify SDK Migration Script
# This script helps verify that the Expo SDK migration was successful

echo "=== GroundSchool-AI SDK Migration Verification ==="
echo "Checking SDK and dependencies..."

# Check node version
echo -n "Node.js version: "
node -v

# Check npm version
echo -n "npm version: "
npm -v

# Display Expo CLI version if installed
if command -v expo &> /dev/null; then
  echo -n "Expo CLI version: "
  expo --version
else
  echo "Expo CLI not found - consider installing it globally"
fi

# Check installed packages
echo ""
echo "=== Installed Package Versions ==="
echo -n "Expo: "
grep '"expo": ' package.json
echo -n "React: "
grep '"react": ' package.json
echo -n "React Native: "
grep '"react-native": ' package.json
echo -n "Expo Router: "
grep '"expo-router": ' package.json
echo ""

# Verify project structure
echo "=== Project Structure Verification ==="
if [ -d "./app" ]; then
  echo "✅ app/ directory exists"
else
  echo "❌ app/ directory not found"
fi

if [ -f "./app/_layout.js" ]; then
  echo "✅ app/_layout.js exists"
else
  echo "❌ app/_layout.js not found"
fi

if [ -f "./app/router-adapter.js" ]; then
  echo "✅ app/router-adapter.js exists"
else
  echo "❌ app/router-adapter.js not found"
fi

# Report app.json SDK version
echo ""
echo "=== app.json Configuration ==="
echo -n "SDK Version in app.json: "
grep '"sdkVersion": ' app.json

echo ""
echo "=== Next Steps ==="
echo "1. Try running 'npx expo start' after npm install completes"
echo "2. Fix any configuration or import errors"
echo "3. Move to next phase (SDK 51) once stable"
echo ""

# End of verification
echo "Verification complete. For more detailed checks, run: node ./scripts/verify-migration.js"
