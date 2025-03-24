/**
 * SentryDiagnostics.js
 * 
 * This module provides diagnostic functions for Sentry that run early in the app
 * initialization process, before any potential crashes occur.
 */

import * as Sentry from '@sentry/react-native';
import { Platform, Dimensions, NativeModules } from 'react-native';
import { captureMessage, captureException } from './SentryConfig';
import Logger from './Logger';

/**
 * Send basic device and app information to Sentry
 */
export const sendDiagnosticInfo = () => {
  try {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      isHermes: typeof global.HermesInternal !== 'undefined' && global.HermesInternal !== null,
      dimensions: { width, height, scale, fontScale },
      constants: Platform.constants || {},
      apiLevel: Platform.OS === 'android' ? Platform.constants.Release : undefined,
      model: Platform.OS === 'ios' ? Platform.constants.systemName : undefined,
      manufacturer: Platform.constants?.Manufacturer || 'unknown',
      brand: Platform.constants?.Brand || 'unknown',
      deviceYearClass: Platform.constants?.deviceYearClass || 'unknown',
      totalMemory: NativeModules.PlatformConstants?.totalMemory || 'unknown',
    };

    // Add breadcrumb for app start with high priority
    Sentry.addBreadcrumb({
      category: 'app.lifecycle',
      message: 'App started - CRITICAL DIAGNOSTIC',
      level: 'warning', // Higher priority than info
      data: {
        timestamp: new Date().toISOString(),
        diagnostic: 'true',
      }
    });

    // Force flush to ensure breadcrumb is sent
    Sentry.flush(2000);

    // Send diagnostic info with high priority
    captureMessage('App diagnostic info - CRITICAL', {
      level: 'warning', // Higher priority than info
      tags: { 
        diagnostic: 'startup',
        appStart: 'true',
        priority: 'high',
        environment: Platform.constants?.buildType || process.env.NODE_ENV || 'unknown',
      },
      extra: {
        deviceInfo,
        jsEngine: typeof HermesInternal !== 'undefined' ? 'hermes' : 'jsc',
        timestamp: new Date().toISOString(),
        memoryUsage: global.performance?.memory || {},
        timingInfo: global.performance?.timing || {},
      }
    });

    // Force flush to ensure message is sent
    Sentry.flush(2000);

    Logger.info('Sent diagnostic info to Sentry', { deviceInfo });
    return true;
  } catch (error) {
    Logger.error('Failed to send diagnostic info to Sentry', error);
    
    // Try to capture the error with maximum priority
    try {
      captureException(error, {
        tags: { 
          diagnostic: 'startup_failed',
          critical: 'true',
          priority: 'maximum'
        },
        level: 'fatal', // Highest priority
      });
      
      // Force flush
      Sentry.flush(2000);
    } catch (innerError) {
      console.error('Complete failure in diagnostic reporting:', innerError);
    }
    
    return false;
  }
};

/**
 * Test Sentry connection by sending a test message
 */
export const testSentryConnection = () => {
  try {
    captureMessage('Sentry connection test', {
      level: 'info',
      tags: { test: 'connection' },
    });
    
    Logger.info('Sent Sentry connection test');
    return true;
  } catch (error) {
    Logger.error('Failed to test Sentry connection', error);
    return false;
  }
};

/**
 * Run all diagnostic tests
 */
export const runDiagnostics = () => {
  try {
    Logger.info('Running Sentry diagnostics');
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'sentry.diagnostic',
      message: 'Running diagnostics',
      level: 'info' // Using string level instead of Sentry.Severity enum
    });
    
    // Run tests
    const diagnosticResult = sendDiagnosticInfo();
    const connectionResult = testSentryConnection();
    
    // Log results
    Logger.info('Sentry diagnostics complete', { 
      diagnosticResult, 
      connectionResult 
    });
    
    return {
      success: diagnosticResult && connectionResult,
      diagnosticResult,
      connectionResult
    };
  } catch (error) {
    Logger.error('Error running Sentry diagnostics', error);
    captureException(error, {
      tags: { diagnostic: 'all_failed' },
    });
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendDiagnosticInfo,
  testSentryConnection,
  runDiagnostics
};
