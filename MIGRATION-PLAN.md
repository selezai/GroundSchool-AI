# GroundSchool-AI: Expo SDK Migration Plan

This document outlines the incremental approach to migrate the application from Expo SDK 47 to SDK 52.

## Prerequisites

- For SDK 47-49: Node.js v16.20.2 or higher, npm 8.19.4 or higher
- For SDK 51: Node.js v16.20.2 or higher, npm 8.19.4 or higher
- For SDK 52: Node.js v18.19.0 or higher, npm 9.0.0 or higher

## Current Status

- **Current SDK Version**: Expo SDK 47
- **Target SDK Version**: Expo SDK 52
- **Key Issues**: Direct upgrade causes dependency resolution conflicts

## Migration Strategy

Rather than attempting to upgrade directly from SDK 47 to 52, we'll take an incremental approach:

### Phase 1: SDK 47 → SDK 49 ✅ (COMPLETED)

```json
// package.json updates
{
  "dependencies": {
    "expo": "~49.0.15",
    "react": "18.2.0",
    "react-native": "0.71.8",
    "expo-status-bar": "~1.6.0",
    "expo-linking": "~5.0.2",
    "expo-router": "^2.0.0",
    "expo-constants": "~14.4.2",
    "expo-splash-screen": "~0.20.5",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0"
  }
}
```

**Key Changes**:
- Initial migration to file-based routing with Expo Router v2
- Adjust import statements for new package locations
- Update gesture handler and reanimated implementations

### Phase 2: SDK 49 → SDK 51 ✅ (COMPLETED)

```json
// package.json updates
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "expo-status-bar": "~1.11.1",
    "expo-linking": "~6.2.2",
    "expo-router": "^3.4.6",
    "expo-constants": "~15.4.5",
    "expo-splash-screen": "~0.26.4",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0"
  }
}
```

**Key Changes**:
- Migrate to Expo Router v3 early version
- Update navigation structure
- Handle React Native 0.73 changes

### Phase 3: SDK 51 → SDK 52 ✅ (COMPLETED)

```json
// package.json updates
{
  "dependencies": {
    "expo": "~52.0.37",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "expo-status-bar": "~2.0.1",
    "expo-linking": "~7.0.5",
    "expo-router": "~4.0.17",
    "expo-constants": "~17.0.7",
    "expo-splash-screen": "~0.29.22",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0"
  }
}
```

**Key Changes**:
- Finalize Expo Router v4 implementation
- Update React 18.3 specific features
- Implement final file structure and navigation pattern

## Implementation Plan

### Step 1: Create Backup ✅
1. Commit all current changes to Git
2. Create a backup branch of the current state

### Step 2: Incremental SDK 49 Implementation ✅
1. Update package.json for SDK 49 ✅
2. Remove node_modules and package-lock.json ✅
3. Run clean npm install ✅
4. Fix any breaking changes ✅
   - Updated babel.config.js for Expo Router v2
   - Created router-adapter.js for navigation compatibility
   - Modified app/_layout.js for Expo Router v2
   - Fixed react-native version compatibility
5. Test basic functionality ✅
   - Development server runs successfully

### Step 3: Incremental SDK 51 Implementation ✅
1. Update package.json for SDK 51 ✅
2. Remove node_modules and package-lock.json ✅
3. Run clean npm install ✅
4. Migrate to Expo Router v3 ✅
   - Updated router-adapter.js to handle Router v3 features
   - Modified app/_layout.js to use Slot component
   - Updated navigation implementation in nav.js
   - Added screenOptions for compatibility
5. Test navigation and core functionality ✅
   - Verified app launches successfully
   - Confirmed router compatibility

### Step 4: Final SDK 52 Implementation ✅
1. Update to final package.json for SDK 52 ✅
2. Clean install dependencies ✅
3. Make final adjustments to navigation and layouts ✅
   - Updated router-adapter.js to handle SDK 52
   - Updated babel.config.js for Expo Router v4
   - Fixed Slot component imports for Expo Router v4
   - Removed deprecated 'expo-router/babel' plugin
4. Comprehensive testing of all features ✅
   - Verified app launches with SDK 52
   - QR code working for mobile testing
   - Fixed asset loading issues (upload-icon.png)
5. Update documentation ✅
6. Node.js upgrade to v18+ required ✅
   - Successfully upgraded to Node.js v18.20.7
   - Added .nvmrc file for project-specific Node.js version
   - Created ensure-node-version.js script to verify Node.js compatibility
7. React Native New Architecture support ✅
   - Added 'newArchEnabled: true' to app.json

## Code Migration Checklist

- [x] Update import statements for renamed/moved packages
- [x] Refactor navigation to use the appropriate Expo Router version
- [x] Update gesture handling implementations
- [x] Migrate to new file-based routing patterns
- [ ] Update any deprecated API calls
- [ ] Adapt to React Native styling changes
- [ ] Test on Android and iOS

## Version-Specific Notes

### SDK 49 Notes
- Introduces improvements to Hermes engine
- Expo Router v2 is the recommended router

### SDK 51 Notes
- Expo Router v3 introduces new navigation paradigms
- Updated notifications framework

### SDK 52 Notes
- Requires React 18.3.0 or higher
- Introduces significant performance improvements
- Expanded web support

## Fallback Plan

If we encounter critical issues during migration:
1. Revert to the most recent working SDK version
2. Document specific blocking issues
3. Consider alternative migration paths

---

This migration strategy minimizes risk by taking smaller, incremental steps rather than attempting a direct leap from SDK 47 to SDK 52.
