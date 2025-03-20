# GroundSchool-AI Scripts

This directory contains utility scripts for building, testing, and maintaining the GroundSchool-AI application.

## Build Scripts

### build-with-sentry.sh

A build script for creating app builds with Sentry integration for crash reporting.

**Usage:**

```bash
# Default usage (development profile, all platforms)
./scripts/build-with-sentry.sh

# With specific profile and platform
./scripts/build-with-sentry.sh --profile preview --platform ios

# Available options
./scripts/build-with-sentry.sh --help
```

**Options:**

- `-p, --profile`: Build profile (development, preview, production) [default: development]
- `-t, --platform`: Platform to build for (android, ios, all) [default: all]
- `-h, --help`: Show help message

**NPM Scripts:**

These scripts are also available as npm commands:

```bash
# Default development build with Sentry
npm run build:sentry

# Specific profile builds
npm run build:sentry:dev     # Development build
npm run build:sentry:preview # Preview build
npm run build:sentry:prod    # Production build
```

## Test Scripts

### test-sentry.js

A utility for testing the Sentry crash reporting integration.

**Usage:**

```javascript
import SentryTest from '../scripts/test-sentry';

// Trigger a JavaScript error
SentryTest.triggerJavaScriptError();

// Send a test message with a specific level
SentryTest.sendTestMessage('warning');

// Add test breadcrumbs
SentryTest.addTestBreadcrumbs();

// Run all tests
SentryTest.runAllTests();
```

**Available Functions:**

- `triggerJavaScriptError()`: Trigger a JavaScript error to test Sentry error reporting
- `triggerPromiseRejection()`: Trigger a promise rejection to test unhandled promise error reporting
- `triggerComponentError()`: Trigger a component error to test error boundary
- `sendTestMessage(level)`: Send a test message to Sentry with different severity levels
- `addTestBreadcrumbs()`: Add breadcrumbs to test breadcrumb tracking
- `runAllTests()`: Run all tests

## Other Scripts

### ensure-node-version.js

Ensures that the correct Node.js version is being used for the project.

### pre-build-checks.js

Performs pre-build validation checks to ensure the app is ready for building.
