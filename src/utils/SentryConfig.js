import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Logger from './Logger';
import { SENTRY_DSN, SENTRY_ENVIRONMENT } from '@env';

/**
 * Initialize Sentry for crash reporting
 * @returns {boolean} - Whether Sentry was successfully initialized
 */
export const initSentry = () => {
  try {
    // Get Sentry DSN from environment variables or use the hardcoded value as fallback
    const dsn = SENTRY_DSN || 'https://970b65bbe61c4ba1387688e5f27227c6@o4509000756559872.ingest.de.sentry.io/4509000767766608';
    
    // Get environment from env variables or from Constants
    const environment = SENTRY_ENVIRONMENT || Constants.expoConfig?.extra?.ENVIRONMENT || 'development';
    // Enable Sentry in all environments for now to capture crash data
    const shouldEnableSentry = true;
    
    if (shouldEnableSentry) {
      Sentry.init({
        dsn,
        debug: false, // Set to true to see debugging logs
        environment,
        enableAutoSessionTracking: true,
        // Session expires after 30 seconds of inactivity
        sessionTrackingIntervalMillis: 30000,
        // Always send events regardless of environment
        beforeSend(event) {
          // Add additional context to help with debugging
          if (!event.tags) event.tags = {};
          event.tags['app.environment'] = environment;
          event.tags['crash.reported'] = 'true';
          return event;
        },
        // Add additional context information
        integrations: [
          // Use proper tracing integration for React Native
          // Using direct string names instead of specific classes to avoid import issues
          // This is a common pattern for Sentry configuration
        ],
      });

      // Set user-agent tag
      Sentry.setTag('device.platform', Platform.OS);
      Sentry.setTag('app.version', Constants.expoConfig?.version || 'unknown');
      Sentry.setTag('app.build', Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'unknown');

      Logger.info('Sentry initialized successfully');
      return true;
    } else {
      Logger.info('Sentry not initialized in development environment');
      return false;
    }
  } catch (error) {
    Logger.error('Failed to initialize Sentry:', error);
    return false;
  }
};

/**
 * Capture an exception with Sentry
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context information
 */
export const captureException = (error, context = {}) => {
  try {
    Logger.error('Capturing exception with Sentry:', error);
    
    if (context) {
      Sentry.setContext('additional', context);
    }
    
    Sentry.captureException(error);
  } catch (sentryError) {
    Logger.error('Failed to capture exception with Sentry:', sentryError);
  }
};

/**
 * Capture a message with Sentry
 * @param {string} message - The message to capture
 * @param {Object} context - Additional context information
 * @param {string} level - The level of the message (info, warning, error)
 */
export const captureMessage = (message, context = {}, level = 'info') => {
  try {
    if (context) {
      Sentry.setContext('additional', context);
    }
    
    Sentry.captureMessage(message, level);
  } catch (error) {
    Logger.error('Failed to capture message with Sentry:', error);
  }
};

/**
 * Set user information for Sentry
 * @param {Object} user - User information
 */
export const setUser = (user) => {
  try {
    if (!user) {
      Sentry.setUser(null);
      return;
    }
    
    // Only include non-sensitive user information
    Sentry.setUser({
      id: user.id,
      username: user.username || user.email,
    });
  } catch (error) {
    Logger.error('Failed to set user for Sentry:', error);
  }
};

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
};
