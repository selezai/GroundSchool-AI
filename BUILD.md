# GroundSchool-AI Build Guide

This document provides instructions for building and deploying the GroundSchool-AI application using EAS Build.

## Prerequisites

Before building the app, ensure you have the following:

1. An Expo account (create one at https://expo.dev)
2. The EAS CLI installed globally: `npm install -g eas-cli`
3. Logged in to EAS CLI: `eas login`
4. For iOS builds: An Apple Developer account
5. For Android builds: A Google Play Console account

## Build Profiles

The app has three build profiles configured in `eas.json`:

### Development Build

A development build with the Expo development client enabled, useful for testing during development.

```bash
npm run build:dev
```

### Preview Build

An internal distribution build for testing before production release.

```bash
npm run build:preview
```

### Production Build

The final production build for submission to app stores.

```bash
npm run build:production
```

You can also build for specific platforms:

```bash
npm run build:android  # Build only for Android
npm run build:ios      # Build only for iOS
```

## Environment Variables

The build process uses environment variables to configure the app for different environments:

- `ENVIRONMENT`: The target environment (development, staging, production)
- `IS_DEVELOPMENT_BUILD`: Whether this is a development build
- `IS_PREVIEW_BUILD`: Whether this is a preview build
- `IS_PRODUCTION_BUILD`: Whether this is a production build

These are automatically set based on the build profile.

## Updates

You can push updates to existing builds using EAS Update:

```bash
npm run update:preview    # Update preview builds
npm run update:production # Update production builds
```

## Pre-build Checks

Before each build, the system runs pre-build checks to ensure everything is properly configured:

- Validates required files (app.json, eas.json, package.json)
- Checks app configuration
- Identifies native modules that might need special handling
- Verifies Expo SDK version

If any checks fail, the build will not proceed.

## Submitting to App Stores

### Android

To submit to Google Play:

1. Create a service account in the Google Play Console
2. Download the JSON key and save it as `google-service-account.json` in the project root
3. Run: `eas submit -p android --latest`

### iOS

To submit to the App Store:

1. Configure your Apple credentials in EAS
2. Run: `eas submit -p ios --latest`

## Troubleshooting

If you encounter build issues:

1. Check the EAS build logs for detailed error information
2. Verify that all native dependencies are properly configured
3. Ensure your Expo account has the necessary permissions
4. For iOS builds, check that your provisioning profiles and certificates are valid
5. For Android builds, verify your keystore configuration

## Build Server Requirements

EAS Build servers use the following specifications:

- Node.js version: 18.x (as specified in .nvmrc)
- Expo SDK: 52
- macOS for iOS builds, Linux for Android builds

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Expo SDK 52 Documentation](https://docs.expo.dev/versions/v52.0.0/)
