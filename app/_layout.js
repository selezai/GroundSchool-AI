import { useSegments, Stack, Slot } from 'expo-router';
import { useRouter, usePathname } from 'expo-router';
// RouterComponents now imported directly from expo-router
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useContext } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, ErrorUtils, Platform, Alert, Linking, AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, ThemeContext } from '../src/context/ThemeContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import ErrorBoundary from '../src/components/ErrorBoundary';
import Logger from '../src/utils/Logger';
import * as FileSystem from 'expo-file-system';
import safeNavigation from '../src/services/SafeNavigationService';

// Import our new components and services
import { NavigationProvider } from '../src/navigation/NavigationController';
import PlatformService from '../src/services/PlatformService';
import { initializeApp } from '../src/initialization/initEngine';
import { useSafeState, useSafeEffect } from '../src/hooks/useSafeState';
import RuntimeGuard from '../src/errorHandling/RuntimeGuard';

// Make SafeNavigationService available globally to avoid import issues
global.safeNavigation = safeNavigation;
import { getSupabase } from '../src/services/supabaseClient';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Default app theme (will be overridden by ThemeContext)
const defaultTheme = {
  colors: {
    primary: '#00FFCC',
    background: '#0A0F24',
    text: '#FFFFFF',
    accent: '#00FFCC',
    error: '#FF6B6B',
    disabled: 'rgba(255, 255, 255, 0.3)',
    surface: 'rgba(255, 255, 255, 0.05)',
    onSurface: '#FFFFFF',
  },
};

// Initialize logger as early as possible with platform-specific handling
try {
  Logger.init().catch(e => console.error('Failed to initialize logger:', e));
  
  // Log app start with device info
  Logger.info(`App starting - Platform: ${Platform.OS}, Version: ${Platform.Version}`);
  
  // Initialize app with dependency-aware service initialization
  initializeApp().catch(e => {
    console.error('Failed to initialize app:', e);
    Logger.error('App initialization failed:', e);
  });
} catch (e) {
  console.error('Failed to log app start:', e);
}

// Styles will be created dynamically based on theme

// AppLoadingSkeleton component for showing during initialization
const AppLoadingSkeleton = () => {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0A0F24',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <ActivityIndicator size="large" color="#00FFCC" />
      <Text style={{ color: '#FFFFFF', marginTop: 20 }}>Loading app...</Text>
    </View>
  );
};

// FatalErrorScreen component for showing when initialization fails
const FatalErrorScreen = ({ error }) => {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0A0F24',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    }}>
      <Text style={{ color: '#FF6B6B', fontSize: 20, marginBottom: 10 }}>Critical Error</Text>
      <Text style={{ color: '#FFFFFF', textAlign: 'center', marginBottom: 20 }}>
        The app encountered a critical error during startup.
      </Text>
      <Text style={{ color: '#E2E8F0', fontSize: 12, marginBottom: 20 }}>
        {error?.message || 'Unknown error'}
      </Text>
      <TouchableOpacity 
        style={{
          backgroundColor: '#00FFCC',
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8
        }}
        onPress={() => {
          try {
            // Clear app data and restart
            AsyncStorage.clear().then(() => {
              router.replace('/');
            });
          } catch (e) {
            console.error('Failed to reset app:', e);
          }
        }}
      >
        <Text style={{ color: '#0A0F24', fontWeight: 'bold' }}>Reset App</Text>
      </TouchableOpacity>
    </View>
  );
};

// Web-specific Auth component without drawer navigation
function WebAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [initializationError, setInitializationError] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [startupError, setStartupError] = useState(null);
  
  // Simplified initialization for web platform
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting web app initialization');
        
        // Initialize Logger for web
        if (!Logger.initialized) {
          try {
            await Logger.init();
            console.log('Logger initialized successfully for web');
          } catch (loggerError) {
            console.warn('Logger initialization failed on web:', loggerError);
          }
        }
        
        // Set fonts as loaded immediately for web
        setFontsLoaded(true);
        setIsAppReady(true);
        
        // Get token from localStorage
        try {
          const token = localStorage.getItem('userToken');
          console.log(`Token retrieved from localStorage: ${token ? 'exists' : 'null'}`);
          setUserToken(token);
        } catch (storageError) {
          console.warn('Could not access localStorage for token retrieval');
          setUserToken(null);
        } finally {
          setIsLoading(false);
        }
        
      } catch (e) {
        console.error('Error in web app initialization', e);
        setInitializationError(e);
        setFontsLoaded(true);
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  // Handle navigation for web
  useEffect(() => {
    if (isLoading) return;
    
    try {
      console.log('Web navigation effect triggered');
      
      // Simple navigation logic for web
      const inAuthGroup = segments?.[0] === 'auth';
      console.log(`Current web navigation state: userToken=${!!userToken}, inAuthGroup=${inAuthGroup}`);
      
      if (!userToken && !inAuthGroup) {
        console.log('Redirecting to login screen (web)');
        setTimeout(() => router.replace('/auth/login'), 100);
      } else if (userToken && inAuthGroup) {
        console.log('Redirecting to home screen (web)');
        setTimeout(() => router.replace('/'), 100);
      } else {
        console.log('No navigation redirect needed (web)');
      }
    } catch (e) {
      console.error('Web navigation effect error', e);
      setStartupError(e.message);
    }
  }, [isLoading, userToken, segments, router]);
  
  // Show initialization error screen
  if (initializationError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24', padding: 20 }}>
        <Text style={{ color: '#FF6B6B', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Critical Error</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
          The app could not initialize properly.
        </Text>
        <Text style={{ color: '#E2E8F0', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
          {initializationError?.message || 'Unknown initialization error'}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#00FFCC', padding: 15, borderRadius: 8 }}
          onPress={() => window.location.reload()}
        >
          <Text style={{ color: '#0A0F24', fontWeight: 'bold' }}>Reload App</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show startup error screen
  if (startupError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24', padding: 20 }}>
        <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Startup Error</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
          {startupError}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#00FFCC', padding: 15, borderRadius: 8 }}
          onPress={() => window.location.reload()}
        >
          <Text style={{ color: '#0A0F24', fontWeight: 'bold' }}>Reload App</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Loading screen
  if (isLoading || !isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24' }}>
        <ActivityIndicator size="large" color="#00FFCC" />
        <Text style={{ color: '#FFFFFF', marginTop: 16 }}>
          {isAppReady ? 'Finalizing...' : 'Initializing GroundSchool-AI...'}
        </Text>
      </View>
    );
  }
  
  // Main app navigation for web - simplified without drawer
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0F24' },
        animation: 'default',
        animationEnabled: true
      }}
    />
  );
}

// AuthContext provider to manage authentication state for native
function Auth() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [initializationError, setInitializationError] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [startupError, setStartupError] = useState(null);
  
  // Phased app initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        Logger.info('Starting phased app initialization');
        
        // Phase 1: Initialize Logger first (if not already)
        if (!Logger.initialized) {
          try {
            await Logger.init();
            Logger.info('Logger initialized successfully');
          } catch (loggerError) {
            console.warn('Logger initialization failed, continuing without logging:', loggerError);
            // Continue without logging - don't throw error to prevent app crash
          }
        }
        
        // Phase 2: Check for safe mode - with platform-specific handling
        try {
          let safeMode = null;
          
          if (Platform.OS === 'web') {
            // Use localStorage on web
            try {
              safeMode = localStorage.getItem('APP_SAFE_MODE');
            } catch (storageError) {
              console.warn('Could not access localStorage for safe mode check');
            }
          } else {
            // Use AsyncStorage on native
            safeMode = await AsyncStorage.getItem('APP_SAFE_MODE');
          }
          
          if (safeMode === 'true') {
            console.warn('App starting in SAFE MODE due to previous crashes');
            // Clear the flag for next start
            if (Platform.OS === 'web') {
              try {
                localStorage.setItem('APP_SAFE_MODE', 'false');
              } catch (storageError) {
                console.warn('Could not write to localStorage');
              }
            } else {
              await AsyncStorage.setItem('APP_SAFE_MODE', 'false');
            }
          }
        } catch (safeModeError) {
          console.warn('Error checking safe mode, continuing anyway:', safeModeError);
          // Continue without safe mode - don't throw error to prevent app crash
        }
        
        // Set fonts as loaded immediately to avoid hanging
        setFontsLoaded(true);
        
        // Phase 3: Initialize critical services
        try {
          // Initialize Supabase in the background
          getSupabase();
          Logger.info('Supabase client initialized');
        } catch (serviceError) {
          Logger.error('Non-critical service initialization error', serviceError);
          // Continue even if services fail
        }
        
        // Phase 4: Load fonts in the background
        Font.loadAsync({
          'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Medium': require('../assets/fonts/Roboto-Medium.ttf'),
          'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
        }).then(() => {
          Logger.info('Fonts loaded successfully');
        }).catch(e => {
          Logger.error('Background font loading failed', e);
        });
        
        // Phase 5: Mark app as ready
        setIsAppReady(true);
        Logger.info('App initialization completed successfully');
        
      } catch (e) {
        Logger.error('Error in app initialization', e);
        setInitializationError(e);
        // Set fonts as loaded anyway to avoid hanging
        setFontsLoaded(true);
      }
    };
    
    initializeApp();
  }, []);

  // Safe auth check - only runs after app is ready
  useEffect(() => {
    // Only proceed if app initialization is complete
    if (!isAppReady) return;
    
    try {
      Logger.info('Starting authentication check');
      
      // Set a short timeout to ensure we don't get stuck
      setTimeout(() => {
        try {
          // Try to get token but don't wait for it - with platform-specific handling
          Logger.info('Retrieving token from storage');
          
          if (Platform.OS === 'web') {
            // Use localStorage on web
            try {
              const token = localStorage.getItem('userToken');
              Logger.info(`Token retrieved from localStorage: ${token ? 'exists' : 'null'}`);
              setUserToken(token);
            } catch (storageError) {
              console.warn('Could not access localStorage for token retrieval');
              setUserToken(null);
            } finally {
              // Always finish loading for web
              Logger.info('Auth check completed for web, hiding splash screen');
              setIsLoading(false);
              // Hide splash screen
              SplashScreen.hideAsync()
                .then(() => Logger.info('Splash screen hidden successfully'))
                .catch(e => Logger.error('Failed to hide splash screen', e));
            }
          } else {
            // Use AsyncStorage on native
            AsyncStorage.getItem('userToken')
              .then(token => {
                Logger.info(`Token retrieved from AsyncStorage: ${token ? 'exists' : 'null'}`);
                setUserToken(token);
              })
              .catch(e => {
                Logger.error('AsyncStorage error during token retrieval', e);
                setUserToken(null);
              })
              .finally(() => {
                // Always finish loading for native
                Logger.info('Auth check completed for native, hiding splash screen');
                setIsLoading(false);
                // Hide splash screen
                SplashScreen.hideAsync()
                  .then(() => Logger.info('Splash screen hidden successfully'))
                  .catch(e => Logger.error('Failed to hide splash screen', e));
              });
          }
        } catch (e) {
          Logger.error('Error in auth check', e);
          setUserToken(null);
          setIsLoading(false);
          SplashScreen.hideAsync().catch(() => {});
        }
      }, 300); // Shorter delay since we're already waiting for app to be ready
    } catch (e) {
      Logger.error('Fatal error in auth setup', e);
      setStartupError(e.message);
      setIsLoading(false);
      SplashScreen.hideAsync()
        .then(() => Logger.info('Splash screen hidden after fatal error'))
        .catch(e => Logger.error('Failed to hide splash screen after fatal error', e));
    }
  }, [isAppReady]); // Only run when app becomes ready
  
  // Safety timeout - force app to continue after 2 seconds no matter what
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        Logger.warn('Safety timeout triggered - forcing app to continue after timeout');
        setIsLoading(false);
        SplashScreen.hideAsync()
          .then(() => Logger.info('Splash screen hidden after safety timeout'))
          .catch(e => Logger.error('Failed to hide splash screen after safety timeout', e));
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Handle navigation only after loading is complete - using SafeNavigationService
  useEffect(() => {
    if (isLoading) return;
    
    try {
      Logger.info('Navigation effect triggered - loading complete');
      // Always hide splash screen first
      SplashScreen.hideAsync()
        .then(() => Logger.info('Splash screen hidden before navigation'))
        .catch(e => Logger.error('Failed to hide splash screen before navigation', e));
      
      // Simple navigation logic using SafeNavigationService
      const inAuthGroup = segments?.[0] === 'auth';
      Logger.info(`Current navigation state: userToken=${!!userToken}, inAuthGroup=${inAuthGroup}`);
      
      if (!userToken && !inAuthGroup) {
        Logger.info('Redirecting to login screen');
        setTimeout(() => safeNavigation.navigate('/auth/login'), 100);
      } else if (userToken && inAuthGroup) {
        Logger.info('Redirecting to home screen');
        setTimeout(() => safeNavigation.navigate('/'), 100);
      } else {
        Logger.info('No navigation redirect needed');
      }
    } catch (e) {
      Logger.error('Navigation effect error', e);
      setStartupError(e.message);
    }
  }, [isLoading, userToken, segments]);

  // Show initialization error screen
  if (initializationError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24', padding: 20 }}>
        <Text style={{ color: '#FF6B6B', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Critical Error</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
          The app could not initialize properly.
        </Text>
        <Text style={{ color: '#E2E8F0', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
          {initializationError?.message || 'Unknown initialization error'}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#00FFCC', padding: 15, borderRadius: 8, marginBottom: 15 }}
          onPress={() => {
            setInitializationError(null);
            setIsLoading(true);
            // Try again
            setTimeout(() => setIsLoading(false), 1000);
          }}
        >
          <Text style={{ color: '#0A0F24', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ backgroundColor: '#4A5568', padding: 15, borderRadius: 8 }}
          onPress={async () => {
            try {
              // Clear app data and restart
              await AsyncStorage.clear();
              setInitializationError(null);
              setIsLoading(true);
            } catch (e) {
              Logger.error('Failed to reset app data', e);
            }
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Reset App Data</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show startup error screen
  if (startupError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24', padding: 20 }}>
        <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Startup Error</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
          {startupError}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#00FFCC', padding: 15, borderRadius: 8 }}
          onPress={() => {
            setStartupError(null);
            setIsLoading(true);
            // Try again
            setTimeout(() => setIsLoading(false), 1000);
          }}
        >
          <Text style={{ color: '#0A0F24', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading screen with app state information
  if (isLoading || !isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F24' }}>
        <ActivityIndicator size="large" color="#00FFCC" />
        <Text style={{ color: '#FFFFFF', marginTop: 16 }}>
          {isAppReady ? 'Finalizing...' : 'Initializing GroundSchool-AI...'}
        </Text>
        <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 5 }}>
          <Text style={{ color: '#FFF', fontSize: 10 }}>SDK Version: 52</Text>
          <Text style={{ color: '#FFF', fontSize: 10 }}>Build: {new Date().toISOString()}</Text>
          <Text style={{ color: '#FFF', fontSize: 10 }}>
            Status: {isAppReady ? 'Ready' : 'Initializing'} | Fonts: {fontsLoaded ? 'Loaded' : 'Loading'}
          </Text>
        </View>
      </View>
    );
  }

  // Main app navigation
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0F24' },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'default',
        animationEnabled: true
      }}
    />
  );
}

export default function RootLayout() {
  // Add global error handler for non-React errors
  useEffect(() => {
    Logger.info('Setting up global error handler in RootLayout');
    
    const handleError = (error) => {
      Logger.error('Global error caught in RootLayout', error);
      // Always hide splash screen on error
      SplashScreen.hideAsync()
        .then(() => Logger.info('Splash screen hidden after global error'))
        .catch(e => Logger.error('Failed to hide splash screen after global error', e));
    };

    // Set up global error handler
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      Logger.error(`Global JS error caught (isFatal: ${isFatal})`, error);
      handleError(error);
      originalErrorHandler(error, isFatal);
    });

    return () => {
      Logger.info('Restoring original error handler');
      ErrorUtils.setGlobalHandler(originalErrorHandler);
    };
  }, []);

  // Platform-specific layout to handle web vs native differences
  if (Platform.OS === 'web') {
    // Web-specific layout without GestureHandlerRootView to avoid errors
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <NavigationProvider>
            <ThemeProvider>
              {(theme) => {
                // Using fixed dark theme based on our ThemeContext with fallbacks
                const paperTheme = {
                  ...defaultTheme,
                  dark: true, // Always dark
                  colors: {
                    primary: theme?.colors?.primary || '#00FFCC',
                    background: theme?.colors?.background || '#0A0F24',
                    text: theme?.colors?.text || '#FFFFFF',
                    accent: theme?.colors?.primary || '#00FFCC',
                    error: '#FF6B6B',
                    disabled: 'rgba(255, 255, 255, 0.3)',
                    surface: 'rgba(255, 255, 255, 0.05)',
                    onSurface: theme?.colors?.text || '#FFFFFF',
                  },
                };
                
                return (
                  <PaperProvider theme={paperTheme}>
                    <NotificationProvider>
                      <StatusBar style="light" />
                      <WebAuth />
                    </NotificationProvider>
                  </PaperProvider>
                );
              }}
            </ThemeProvider>
          </NavigationProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }
  
  // Native-specific layout with GestureHandlerRootView
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationProvider>
            <ThemeProvider>
              {(theme) => {
                // Using fixed dark theme based on our ThemeContext with fallbacks
                const paperTheme = {
                  ...defaultTheme,
                  dark: true, // Always dark
                  colors: {
                    primary: theme?.colors?.primary || '#00FFCC',
                    background: theme?.colors?.background || '#0A0F24',
                    text: theme?.colors?.text || '#FFFFFF',
                    accent: theme?.colors?.primary || '#00FFCC',
                    error: '#FF6B6B',
                    disabled: 'rgba(255, 255, 255, 0.3)',
                    surface: 'rgba(255, 255, 255, 0.05)',
                    onSurface: theme?.colors?.text || '#FFFFFF',
                  },
                };
                
                return (
                  <PaperProvider theme={paperTheme}>
                    <NotificationProvider>
                      <StatusBar style="light" />
                      <Auth />
                    </NotificationProvider>
                  </PaperProvider>
                );
              }}
            </ThemeProvider>
          </NavigationProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Add screenOptions for stack navigator compatibility in Router v3
export const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0A0F24' },
  // Enable swipe to go back on screens with back arrow
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animation: 'slide_from_right',
  animationDuration: 300,
  presentation: 'card',
  animationTypeForReplace: 'push',
  fullScreenGestureEnabled: true
};
