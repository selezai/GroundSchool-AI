/**
 * Verify Sentry Build Script
 * 
 * This script is designed to be included in your app build to verify that
 * Sentry is working correctly. It will send a test event to Sentry with
 * build-specific information that should help diagnose why errors aren't
 * being reported.
 */

import * as Sentry from '@sentry/react-native';
import { Platform, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * Verifies that Sentry is working correctly in the current build
 */
export const verifySentryBuild = async () => {
  try {
    console.log('Starting Sentry build verification...');
    
    // Collect as much information as possible about the build and environment
    const buildInfo = {
      // App information
      appName: DeviceInfo.getApplicationName(),
      bundleId: DeviceInfo.getBundleId(),
      buildNumber: DeviceInfo.getBuildNumber(),
      version: DeviceInfo.getVersion(),
      
      // Device information
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      deviceId: DeviceInfo.getDeviceId(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      
      // Additional info
      isEmulator: await DeviceInfo.isEmulator(),
      isTablet: DeviceInfo.isTablet(),
      hasNotch: DeviceInfo.hasNotch(),
      firstInstallTime: await DeviceInfo.getFirstInstallTime(),
      lastUpdateTime: await DeviceInfo.getLastUpdateTime(),
      
      // Memory info
      totalMemory: await DeviceInfo.getTotalMemory(),
      usedMemory: await DeviceInfo.getUsedMemory(),
      freeDiskStorage: await DeviceInfo.getFreeDiskStorage(),
      
      // Network info
      carrier: await DeviceInfo.getCarrier(),
      ipAddress: await DeviceInfo.getIpAddress(),
      
      // JS Engine
      jsEngine: typeof HermesInternal !== 'undefined' ? 'hermes' : 'jsc',
      
      // Timestamp
      timestamp: new Date().toISOString(),
    };
    
    // Add a breadcrumb for verification
    Sentry.addBreadcrumb({
      category: 'verification',
      message: 'Sentry build verification started',
      level: 'info',
      data: {
        timestamp: new Date().toISOString(),
        buildInfo: {
          version: buildInfo.version,
          buildNumber: buildInfo.buildNumber,
        }
      }
    });
    
    // Send a test message with all the build info
    Sentry.captureMessage('SENTRY BUILD VERIFICATION', {
      level: 'warning',
      tags: {
        verification: 'true',
        buildNumber: buildInfo.buildNumber,
        version: buildInfo.version,
        environment: process.env.SENTRY_ENVIRONMENT || 'unknown',
      },
      extra: {
        buildInfo,
      }
    });
    
    // Force flush to ensure the message is sent
    await Sentry.flush(5000);
    
    console.log('Sentry build verification complete');
    return true;
  } catch (error) {
    console.error('Sentry build verification failed:', error);
    
    // Try to capture the error
    try {
      Sentry.captureException(error, {
        tags: {
          verification_failed: 'true',
        },
        level: 'fatal',
      });
      
      // Force flush
      await Sentry.flush(5000);
    } catch (innerError) {
      console.error('Failed to report verification failure:', innerError);
    }
    
    return false;
  }
};

// Export a function that will deliberately cause a crash
export const causeCrash = () => {
  try {
    // This will cause a crash
    const obj = null;
    obj.nonExistentMethod();
  } catch (error) {
    // Capture the error
    Sentry.captureException(error, {
      tags: {
        deliberate_crash: 'true',
      },
      level: 'error',
    });
    
    // Force flush
    Sentry.flush(5000);
    
    // Re-throw to cause an actual crash
    throw error;
  }
};

export default {
  verifySentryBuild,
  causeCrash,
};
