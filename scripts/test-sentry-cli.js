/**
 * Command-line script to test Sentry integration
 * 
 * This script can be run directly from the command line to test
 * Sentry integration without launching the full app.
 * 
 * Usage:
 *   node scripts/test-sentry-cli.js
 */

// Load environment variables
require('dotenv').config();

const Sentry = require('@sentry/node');

// Initialize Sentry with the same DSN as the app
const dsn = process.env.SENTRY_DSN || 'https://970b65bbe61c4ba1387688e5f27227c6@o4509000756559872.ingest.de.sentry.io/4509000767766608';
const environment = process.env.SENTRY_ENVIRONMENT || 'development';

console.log(`Initializing Sentry with DSN: ${dsn}`);
console.log(`Environment: ${environment}`);

Sentry.init({
  dsn,
  environment,
  debug: true,
  tracesSampleRate: 1.0,
});

// Add context
Sentry.setContext('cli', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  testTime: new Date().toISOString(),
});

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'test',
  message: 'CLI test started',
  level: 'info',
});

// Send a test message
console.log('Sending test message to Sentry...');
Sentry.captureMessage('Test message from CLI', {
  level: 'info',
  tags: { test: 'cli' },
});

// Send a test error
console.log('Sending test error to Sentry...');
try {
  throw new Error('Test error from CLI');
} catch (error) {
  Sentry.captureException(error, {
    tags: { test: 'cli_error' },
    extra: { source: 'test-sentry-cli.js' },
  });
}

// Wait for events to be sent
console.log('Waiting for events to be sent...');
setTimeout(() => {
  console.log('Test complete. Check your Sentry dashboard for events.');
  process.exit(0);
}, 2000);
