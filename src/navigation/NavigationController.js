import React, { useState, useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
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

// Preload navigation assets function
const preloadNavigationAssets = async () => {
  try {
    Logger.info('Preloading navigation assets');
    // Simulate asset loading (replace with actual asset loading if needed)
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    Logger.error('Failed to preload navigation assets', error);
    return false;
  }
};

// Platform-specific navigation core
let NavigationCore;

if (Platform.OS === 'web') {
  // Web-specific navigation using expo-router
  NavigationCore = ({ children }) => {
    return children;
  };
} else {
  // Native-specific navigation using drawer
  const Drawer = createDrawerNavigator();
  NavigationCore = ({ children }) => {
    return children;
  };
}

// Main navigation provider component
export const NavigationProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      try {
        await preloadNavigationAssets();
        setIsReady(true);
        Logger.info('Navigation system initialized successfully');
      } catch (error) {
        Logger.error('Navigation initialization error', error);
        // Degrade gracefully
        setIsReady(true);
      }
    };
    
    init();
  }, []);

  if (!isReady) {
    return <NavigationSkeleton />;
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
