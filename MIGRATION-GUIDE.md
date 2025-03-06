# Expo SDK 52 Migration Guide

This guide provides detailed instructions for migrating the GroundSchool-AI application from Expo SDK 51 to SDK 52.

## Prerequisites

- Node.js v18+ (v18.20.7 recommended)
- npm v10+ (v10.8.2 recommended)
- Expo CLI

## Environment Setup

1. **Node.js Version**:
   - The project requires Node.js v18+
   - An `.nvmrc` file has been added to ensure the correct Node.js version
   - Run `nvm use` in the project root to automatically switch to the correct version

2. **Automatic Version Checking**:
   - The `ensure-node-version.js` script runs before `npm start` to verify Node.js compatibility

## Migration Steps

### 1. Update Dependencies

The project now uses Expo SDK 52, which requires specific package versions:

- React Native: 0.74.5 (current) → 0.76.7 (recommended)
- React: 18.2.0 (current) → 18.3.1 (recommended)
- Other Expo packages have been updated to their SDK 52 compatible versions

Run the dependency update script:

```bash
node scripts/update-dependencies.js
npm install
```

### 2. New Architecture Support

React Native's New Architecture is now enabled:

- `app.json` has been updated with `"newArchEnabled": true`
- This provides performance improvements and better native module support

### 3. Expo Router v4 Compatibility

- Router adapter has been updated for Expo Router v4
- The `Slot` component is now imported directly from `expo-router`
- The deprecated `expo-router/babel` plugin has been removed from `babel.config.js`

### 4. Testing the Migration

1. **Local Development**:
   ```bash
   npm start
   ```

2. **Web Version**:
   - Press `w` in the Expo CLI to open the web version

3. **Mobile Testing**:
   - Scan the QR code with Expo Go on your mobile device
   - Press `a` to open in Android emulator or `i` for iOS simulator

## Troubleshooting

### Common Issues

1. **Node.js Version Errors**:
   - Error: `ReadableStream is not defined`
   - Solution: Ensure you're using Node.js v18+ by running `nvm use`

2. **Module Resolution Errors**:
   - Error: `Unable to resolve module expo-router/layouts`
   - Solution: The project has been updated to use direct imports from `expo-router`

3. **Package Version Warnings**:
   - Warning: `The following packages should be updated for best compatibility...`
   - Solution: Run `node scripts/update-dependencies.js` followed by `npm install`

### Rollback Procedure

If issues persist, you can roll back to the previous SDK:

1. Restore the package.json backup:
   ```bash
   cp package.json.bak package.json
   ```

2. Reinstall dependencies:
   ```bash
   npm install
   ```

## Migration Checklist

- [x] Update Node.js to v18+
- [x] Update Expo SDK to 52
- [x] Update React Native to compatible version
- [x] Fix router adapter for Expo Router v4
- [x] Enable New Architecture
- [x] Test application functionality
- [ ] Update remaining dependencies to recommended versions
- [ ] Comprehensive testing after dependency updates

## References

- [Official Expo SDK 52 Migration Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [React Native 0.76 Release Notes](https://reactnative.dev/blog/2023/12/06/0.73-stable-released)
- [Expo Router v4 Documentation](https://docs.expo.dev/router/reference/slot/)
