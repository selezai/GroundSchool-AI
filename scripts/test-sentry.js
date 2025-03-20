/**
 * Test script for Sentry integration
 * 
 * This script can be imported into your app to test various error scenarios
 * and verify that Sentry is capturing them correctly.
 */

import * as Sentry from '@sentry/react-native';
import { captureException, captureMessage } from '../src/utils/SentryConfig';
import Logger from '../src/utils/Logger';

/**
 * Trigger a JavaScript error to test Sentry error reporting
 */
export const triggerJavaScriptError = () => {
  try {
    // Deliberately cause an error
    const obj = null;
    obj.nonExistentMethod();
  } catch (error) {
    Logger.error('Test error triggered', error);
    captureException(error, { 
      tags: { test: 'javascript_error' },
      extra: { source: 'test-sentry.js' }
    });
    return { success: true, message: 'JavaScript error triggered and reported to Sentry' };
  }
};

/**
 * Trigger a promise rejection to test unhandled promise error reporting
 */
export const triggerPromiseRejection = () => {
  // This will cause an unhandled promise rejection
  new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Test promise rejection'));
    }, 100);
  });
  
  captureMessage('Promise rejection test triggered', {
    level: 'warning',
    tags: { test: 'promise_rejection' }
  });
  
  return { success: true, message: 'Promise rejection triggered' };
};

/**
 * Trigger a component error to test error boundary
 */
export const triggerComponentError = () => {
  // This should be called from within a component's render method
  throw new Error('Test component error');
};

/**
 * Send a test message to Sentry with different severity levels
 */
export const sendTestMessage = (level = 'info') => {
  const validLevels = ['debug', 'info', 'warning', 'error', 'fatal'];
  const messageLevel = validLevels.includes(level) ? level : 'info';
  
  captureMessage(`Test message with ${messageLevel} level`, {
    level: messageLevel,
    tags: { test: 'message', level: messageLevel },
    extra: { timestamp: new Date().toISOString() }
  });
  
  return { 
    success: true, 
    message: `Test message with ${messageLevel} level sent to Sentry` 
  };
};

/**
 * Add breadcrumbs to test breadcrumb tracking
 */
export const addTestBreadcrumbs = () => {
  // Add a series of breadcrumbs to test tracking
  Sentry.addBreadcrumb({
    category: 'test',
    message: 'Test breadcrumb 1',
    level: Sentry.Severity.Info
  });
  
  setTimeout(() => {
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb 2',
      level: Sentry.Severity.Warning
    });
  }, 500);
  
  setTimeout(() => {
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb 3',
      level: Sentry.Severity.Error,
      data: {
        action: 'button_press',
        screen: 'test_screen'
      }
    });
  }, 1000);
  
  return { 
    success: true, 
    message: 'Test breadcrumbs added' 
  };
};

/**
 * Run all tests
 */
export const runAllTests = async () => {
  const results = [];
  
  // Add breadcrumbs first
  results.push(addTestBreadcrumbs());
  
  // Send test messages with different levels
  results.push(sendTestMessage('info'));
  results.push(sendTestMessage('warning'));
  results.push(sendTestMessage('error'));
  
  // Trigger JS error
  results.push(triggerJavaScriptError());
  
  // Trigger promise rejection last
  results.push(triggerPromiseRejection());
  
  return {
    success: true,
    results
  };
};

export default {
  triggerJavaScriptError,
  triggerPromiseRejection,
  triggerComponentError,
  sendTestMessage,
  addTestBreadcrumbs,
  runAllTests
};
