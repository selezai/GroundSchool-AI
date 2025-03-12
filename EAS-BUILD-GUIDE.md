# EAS Build Guide for GroundSchool-AI

This document outlines the process for building the GroundSchool-AI app using EAS (Expo Application Services).

## Prerequisites

- Node.js v18.20.7 (as specified in `.nvmrc`)
- Expo SDK 52
- EAS CLI (`npm install -g eas-cli`)

## Project Configuration

The project has been configured with:
- Valid EAS Project ID: `1618f683-148e-4c3a-beb5-a6114f1d72f6`
- Encryption compliance for iOS: `ITSAppUsesNonExemptEncryption: false`
- Environment-aware configuration in `app.config.js`

## Build Profiles

The project includes the following build profiles in `eas.json`:

### Development
```json
"development": {
  "developmentClient": true,
  "distribution": "internal",
  "ios": {
    "resourceClass": "m-medium"
  },
  "env": {
    "ENVIRONMENT": "development"
  }
}
```

### Preview
```json
"preview": {
  "distribution": "internal",
  "ios": {
    "resourceClass": "m-medium"
  },
  "env": {
    "ENVIRONMENT": "preview"
  }
}
```

### Production
```json
"production": {
  "autoIncrement": true,
  "ios": {
    "resourceClass": "m-medium"
  },
  "env": {
    "ENVIRONMENT": "production"
  }
}
```

## Build Commands

### Android Build (No Developer Account Required)
```bash
npx eas-cli build --profile preview --platform android
```

### iOS Build (Apple Developer Account Required)
```bash
npx eas-cli build --profile preview --platform ios
```

### iOS Development Client (No Developer Account Required)
```bash
npx eas-cli build --profile development --platform ios
```

### iOS Simulator Build (No Developer Account Required)
```bash
npx eas-cli build --profile preview --platform ios --local
```

## Environment Variables

Environment variables are managed through:
1. `app.config.js` for build-time variables
2. EAS environment variables for sensitive information

## Troubleshooting

### Common Issues

1. **Invalid Project ID**
   - Solution: Run `npx eas-cli project:init` to generate a valid UUID

2. **iOS Encryption Compliance**
   - Solution: Add `"ITSAppUsesNonExemptEncryption": false` to iOS infoPlist in app.json

3. **Android Keystore**
   - Important: Keep your keystore file secure. Losing it means you can't update your app.

## Future Considerations

- Consider purchasing an Apple Developer account ($99/year) for App Store distribution
- Set up CI/CD with EAS for automated builds
- Configure update channels for OTA updates
