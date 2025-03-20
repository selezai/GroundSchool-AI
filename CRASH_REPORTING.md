# Crash Reporting in GroundSchool-AI

This document outlines the crash reporting system implemented in GroundSchool-AI to help diagnose and fix crashes.

## Overview

We've implemented a comprehensive crash reporting solution using Sentry to capture detailed information about crashes and errors in the application. This system will help us identify the root causes of crashes and provide better error handling.

## Features

1. **Automatic Crash Reporting**
   - Captures JavaScript exceptions
   - Captures native crashes
   - Tracks app lifecycle events
   - Provides detailed stack traces

2. **Error Boundaries**
   - Prevents the entire app from crashing due to component errors
   - Provides user-friendly error screens
   - Allows users to share error reports

3. **Safe Mode**
   - Automatically enters safe mode after repeated crashes
   - Resets non-critical app data to recover from data corruption

4. **Breadcrumbs**
   - Tracks important app events leading up to a crash
   - Records navigation between screens
   - Monitors app state changes

## Configuration

The Sentry integration is configured in `src/utils/SentryConfig.js`. The main configuration points are:

- **DSN**: The Sentry project identifier (replace with your actual Sentry DSN)
- **Environment**: Automatically set based on the app's environment (development, preview, production)
- **Debug Mode**: Disabled by default, can be enabled for testing

## Usage

### Capturing Errors

To manually capture errors in your code:

```javascript
import { captureException } from '../utils/SentryConfig';

try {
  // Your code here
} catch (error) {
  captureException(error, { 
    context: 'FunctionName',
    additionalData: 'Any relevant information'
  });
}
```

### Adding Breadcrumbs

To add custom breadcrumbs for better debugging:

```javascript
import * as Sentry from '@sentry/react-native';

// Add a breadcrumb
Sentry.addBreadcrumb({
  category: 'user.action',
  message: 'User performed an action',
  level: Sentry.Severity.Info
});
```

### Setting User Context

To associate errors with a specific user:

```javascript
import { setUser } from '../utils/SentryConfig';

// When user logs in
setUser({
  id: 'user-id',
  username: 'username'
});

// When user logs out
setUser(null);
```

## Error Boundary Usage

The ErrorBoundary component can be used to wrap sections of your app:

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary componentName="MyComponent">
      {/* Your component content */}
    </ErrorBoundary>
  );
}
```

## Building with Sentry

To build the app with Sentry integration, use the provided build scripts:

```bash
# Default development build with Sentry
npm run build:sentry

# Specific profile builds
npm run build:sentry:dev     # Development build
npm run build:sentry:preview # Preview build
npm run build:sentry:prod    # Production build

# Custom build with options
./scripts/build-with-sentry.sh --profile preview --platform ios
```

These scripts will:
1. Set the appropriate Sentry environment variable
2. Run pre-build checks
3. Build the app with EAS Build
4. Configure Sentry for the specified environment

## Viewing Error Reports

Error reports can be viewed in the Sentry dashboard. You'll need to:

1. Create a Sentry account if you don't have one
2. Create a new project for GroundSchool-AI
3. Configure the environment variables in `.env`
4. Deploy the app with the updated configuration

## Testing Sentry Integration

We've implemented multiple ways to test Sentry integration, even if the app crashes during startup.

### Automatic Diagnostics

The app automatically runs Sentry diagnostics during initialization, before any potential crashes occur. This sends basic device and app information to Sentry, which can help diagnose startup crashes.

The diagnostic information includes:
- Device platform and version
- Screen dimensions
- JavaScript engine (Hermes or JSC)
- App startup timestamp
- Device manufacturer and brand
- Total memory and device year class
- Memory usage and performance metrics

These diagnostics are configured with high priority and will be sent to Sentry even if the app crashes immediately after startup. The app also implements multiple flush operations to ensure data is transmitted before a crash occurs.

### Command-Line Testing

You can test Sentry integration without even launching the app using the CLI test scripts:

```bash
# Basic Sentry test
npm run test:sentry

# Enhanced verification with detailed system info
npm run verify:sentry
```

These scripts initialize Sentry with the same configuration as the app and send test messages and errors to your Sentry dashboard. The `verify:sentry` script includes more detailed system information and is designed specifically to help diagnose connectivity issues.

### In-App Test Screen

If the app is running successfully, you can access a dedicated test screen at `/sentry-test` in the app. In development mode, there's a "Developer Tools" card on the home screen with a button to access this screen.

The test screen provides buttons to trigger various error scenarios:

- Send info, warning, and error messages to Sentry
- Trigger JavaScript errors
- Trigger unhandled promise rejections
- Add breadcrumbs for tracking user actions
- Trigger component errors to test the error boundary

### Test Utility

The test utility is located at `scripts/test-sentry.js` and can be imported into any component:

```javascript
import SentryTest from '../scripts/test-sentry';

// Trigger a JavaScript error
SentryTest.triggerJavaScriptError();

// Send a test message
SentryTest.sendTestMessage('warning');

// Run all tests
SentryTest.runAllTests();
```

## Local Debugging

For local debugging without Sentry:

1. Check the app's logs using the Logger utility
2. Use the error sharing feature in the ErrorBoundary to get detailed error reports from users
3. Enable debug mode in Sentry configuration during development

## Build Verification

We've added a build verification utility that can be integrated into your app to verify Sentry is working correctly in production builds. This utility is located at `scripts/verify-sentry-build.js` and provides:

- Comprehensive device and app information collection
- High-priority event sending with forced flush operations
- Test functions to deliberately cause crashes for verification

To use this utility in your app:

```javascript
import SentryBuildVerification from '../scripts/verify-sentry-build';

// Verify Sentry is working in the current build
SentryBuildVerification.verifySentryBuild();

// Deliberately cause a crash for testing
// SentryBuildVerification.causeCrash();
```

## Next Steps

1. **Set up a Sentry account** - Already done with DSN: `https://970b65bbe61c4ba1387688e5f27227c6@o4509000756559872.ingest.de.sentry.io/4509000767766608`
2. **Build and deploy the app** - Use the build scripts to create a new build with Sentry integration
3. **Test the crash reporting** by triggering known errors
4. **Monitor the Sentry dashboard** after releasing to users
5. **Iterate on error handling** based on the reports received

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Error Boundary Documentation](https://reactjs.org/docs/error-boundaries.html)
