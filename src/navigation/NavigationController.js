import React, { useState, useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ErrorBoundary from '../components/ErrorBoundary';
import Logger from '../utils/Logger';

// Navigation skeleton component for loading state
const NavigationSkeleton = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24' }}>
    <ActivityIndicator size="large" color="#00FFCC" />
    <Text style={{ color: '#FFFFFF', marginTop: 16 }}>
      Initializing navigation...
    </Text>
  </View>
);

// Fallback component for navigation errors
const SafeNavigationFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24', padding: 20 }}>
    <Text style={{ color: '#FF6B6B', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Navigation Error</Text>
    <Text style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
      There was a problem with the navigation system.
    </Text>
    <Text style={{ color: '#E2E8F0', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
      Please try restarting the app.
    </Text>
  </View>
);

// Safe wrapper for async operations
const safeAsync = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    Logger.error('Navigation async operation failed', error);
    return fallback;
  }
};

// Preload navigation assets function with better error handling
const preloadNavigationAssets = async () => {
  try {
    Logger.info('Preloading navigation assets');
    // Simulate asset loading (replace with actual asset loading if needed)
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    Logger.error('Failed to preload navigation assets', error);
    // Don't throw, return false to indicate failure but allow continuation
    return false;
  }
};

// Platform-specific navigation core with proper implementation
let NavigationCore;

if (Platform.OS === 'web') {
  // Web-specific navigation using expo-router
  NavigationCore = ({ children }) => {
    return children;
  };
} else {
  // Native-specific navigation using drawer
  const Drawer = createDrawerNavigator();
  
  // Create a minimal drawer for native platforms
  NavigationCore = ({ children }) => {
    // For compatibility with expo-router, we don't actually use the drawer
    // but we ensure the navigation structure is properly initialized
    return (
      <NavigationContainer independent={true}>
        {children}
      </NavigationContainer>
    );
  };
}

// Main navigation provider component with improved error handling
export const NavigationProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        Logger.info('Initializing navigation system');
        
        // Safely preload assets
        const assetsLoaded = await safeAsync(preloadNavigationAssets, false);
        
        if (!assetsLoaded) {
          Logger.warn('Navigation assets failed to load, continuing with degraded experience');
        }
        
        // Only update state if the component is still mounted
        if (isMounted) {
          setIsReady(true);
          Logger.info('Navigation system initialized successfully');
        }
      } catch (error) {
        Logger.error('Navigation initialization error', error);
        
        // Only update state if the component is still mounted
        if (isMounted) {
          setHasError(true);
          setIsReady(true); // Still set ready to true to show the fallback
        }
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return <NavigationSkeleton />;
  }

  if (hasError) {
    return <SafeNavigationFallback />;
  }

  return (
    <ErrorBoundary fallback={<SafeNavigationFallback />}>
      <NavigationCore>{children}</NavigationCore>
    </ErrorBoundary>
  );
};

export default {
  NavigationProvider,
  // Export any navigation utilities here
  isWeb: Platform.OS === 'web',
  isNative: Platform.OS !== 'web'
};
