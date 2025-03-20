/**
 * Verify Sentry Node.js Script
 * 
 * This script is a Node.js version of the verification tool that can be run
 * from the command line to test Sentry connectivity.
 */

require('dotenv').config();
const Sentry = require('@sentry/node');

// Get DSN from environment variables
const dsn = process.env.SENTRY_DSN || 'https://970b65bbe61c4ba1387688e5f27227c6@o4509000756559872.ingest.de.sentry.io/4509000767766608';
const environment = process.env.SENTRY_ENVIRONMENT || 'development';

console.log(`Initializing Sentry with DSN: ${dsn}`);
console.log(`Environment: ${environment}`);

// Initialize Sentry
Sentry.init({
  dsn,
  environment,
  debug: true, // Enable debug mode to see more logs
  tracesSampleRate: 1.0,
});

// Collect system information
const os = require('os');
const systemInfo = {
  platform: os.platform(),
  release: os.release(),
  type: os.type(),
  arch: os.arch(),
  cpus: os.cpus().length,
  totalMemory: os.totalmem(),
  freeMemory: os.freemem(),
  uptime: os.uptime(),
  hostname: os.hostname(),
  networkInterfaces: Object.keys(os.networkInterfaces()),
  nodeVersion: process.version,
  timestamp: new Date().toISOString(),
};

// Function to send a verification message
async function verifyConnection() {
  try {
    console.log('Sending verification message to Sentry...');
    
    // Add a breadcrumb
    Sentry.addBreadcrumb({
      category: 'verification',
      message: 'Sentry verification started',
      level: 'info',
      data: {
        timestamp: new Date().toISOString(),
      }
    });
    
    // Send a test message with system info
    Sentry.captureMessage('SENTRY VERIFICATION - HIGH PRIORITY', {
      level: 'warning',
      tags: {
        verification: 'true',
        environment,
        nodeVersion: process.version,
      },
      extra: {
        systemInfo,
        env: process.env,
      }
    });
    
    // Force flush to ensure the message is sent
    await Sentry.flush(5000);
    
    console.log('Verification message sent successfully');
    
    // Now try to cause an error
    console.log('Sending test error to Sentry...');
    try {
      // This will cause an error
      const obj = null;
      obj.nonExistentMethod();
    } catch (error) {
      // Capture the error
      Sentry.captureException(error, {
        tags: {
          deliberate_error: 'true',
          verification: 'true',
        },
        level: 'error',
      });
      
      // Force flush
      await Sentry.flush(5000);
      
      console.log('Test error sent successfully');
    }
    
    console.log('Verification complete. Check your Sentry dashboard for events.');
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

// Run the verification
verifyConnection().then(() => {
  // Wait a bit to ensure events are sent
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});
