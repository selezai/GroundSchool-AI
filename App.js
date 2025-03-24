import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { initSentry, setUser as setSentryUser, captureMessage } from './src/utils/SentryConfig';
import SentryDiagnostics from './src/utils/SentryDiagnostics';
import useStore from './store';
import Logger from './src/utils/Logger';

// Initialize Sentry as early as possible
initSentry();

// Run Sentry diagnostics immediately
try {
  // Force a flush of any pending events
  Sentry.flush(2000);
  
  // Send a startup message to Sentry with high priority
  captureMessage('App starting - CRITICAL DIAGNOSTIC', { 
    level: 'warning', // Higher priority than info
    tags: { 
      lifecycle: 'startup',
      diagnostic: 'true',
      priority: 'high'
    }
  });
  
  // Add a global error handler as early as possible
  const originalErrorHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Capture the error with Sentry first
    Sentry.captureException(error, {
      tags: {
        fatal: isFatal ? 'true' : 'false',
        handled_by: 'global_error_handler'
      },
      level: isFatal ? 'fatal' : 'error'
    });
    
    // Force flush to ensure the error is sent immediately
    Sentry.flush(2000);
    
    // Then call the original handler
    originalErrorHandler(error, isFatal);
  });
  
  // Run diagnostics immediately, not asynchronously
  SentryDiagnostics.runDiagnostics();
  
  // Force another flush
  Sentry.flush(2000);
} catch (error) {
  // If even this fails, at least try to capture the error
  try {
    console.error('Failed to initialize Sentry diagnostics:', error);
    Sentry.captureException(error, {
      tags: { diagnostic_failure: 'true' },
      level: 'fatal'
    });
    Sentry.flush(2000);
  } catch (e) {
    // At this point, we can't do much more
    console.error('Complete Sentry failure:', e);
  }
}

// Wrap the app with Sentry's error monitoring
const SentryWrappedApp = Sentry.wrap(App);

export default function SentryApp() {
  return <SentryWrappedApp />;
}

function App() {
  const { setUser } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session on app start
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // Check if we need to start in safe mode due to previous crashes
        const safeMode = await AsyncStorage.getItem('APP_SAFE_MODE');
        if (safeMode === 'true') {
          Logger.warn('App starting in safe mode due to previous crashes');
          Sentry.captureMessage('App starting in safe mode', 'warning');
          // Clear the safe mode flag so we don't get stuck in it
          await AsyncStorage.setItem('APP_SAFE_MODE', 'false');
        }
        
        // Load user data
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Set user context in Sentry
          setSentryUser(parsedUser);
        }
      } catch (error) {
        Logger.error('Error checking user session:', error);
        Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
    
    // Set up unhandled promise rejection tracking
    const unhandledRejectionHandler = event => {
      Logger.error('Unhandled promise rejection:', event.reason);
      Sentry.captureException(event.reason);
    };
    
    // Add listener for unhandled promise rejections
    if (global.addEventListener) {
      global.addEventListener('unhandledrejection', unhandledRejectionHandler);
    }
    
    return () => {
      // Remove listener when component unmounts
      if (global.removeEventListener) {
        global.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      }
    };
  }, [setUser]); // Removed Sentry and Logger as they are stable references

  if (isLoading) {
    // You could add a splash screen or loading indicator here
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaProvider>
  );
}
