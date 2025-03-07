import { useSegments, Slot } from 'expo-router';
import { useRouter } from './router-adapter';
import { RouterComponents } from './router-adapter';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useContext } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, ThemeContext } from '../src/context/ThemeContext';
import { NotificationProvider } from '../src/context/NotificationContext';

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

// Styles will be created dynamically based on theme

// AuthContext provider to manage authentication state
function Auth() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Load custom fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Add any custom fonts here if needed
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn('Error loading fonts', e);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    }
    
    loadFonts();
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    async function checkLoginStatus() {
      try {
        // Add small delay to ensure AsyncStorage has time to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const token = await AsyncStorage.getItem('userToken');
        console.log('Retrieved token:', token);
        setUserToken(token);
      } catch (e) {
        console.error('Error checking login status:', e);
      } finally {
        setIsLoading(false);
        // Hide splash screen once we've checked authentication
        SplashScreen.hideAsync().catch(error => {
          console.log('Error hiding splash screen:', error);
        });
      }
    }

    checkLoginStatus();
    
    // Set up event listener for auth state changes
    const handleStorageChange = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Error handling storage change:', e);
      }
    };
    
    // Poll for auth state changes every second
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Helper function to clear auth state (for testing/debugging)
  async function clearAuthState() {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUserToken(null);
      console.log('Auth state cleared');
    } catch (e) {
      console.error('Error clearing auth state:', e);
    }
  }

  // Handle routing based on authentication
  useEffect(() => {
    if (isLoading || !fontsLoaded) {
      // Still determining auth state or loading fonts
      return;
    }
    
    const inAuthGroup = segments[0] === 'auth';
    console.log('Auth state:', { 
      userToken: userToken ? 'exists' : 'null', 
      inAuthGroup, 
      segments: segments[0] 
    });
    
    if (!userToken && !inAuthGroup) {
      // If user isn't signed in and the initial segment isn't in the auth group
      console.log('Redirecting to login');
      // Use direct navigation instead of replace to avoid circular redirects
      router.push('/auth/login');
    } else if (userToken && inAuthGroup) {
      // If user is signed in and the initial segment is in the auth group
      console.log('Redirecting to home');
      // Use direct navigation instead of replace
      router.push('/');
    } else {
      // Hide the splash screen once we're done setting things up
      console.log('Keeping current screen, hiding splash screen');
      SplashScreen.hideAsync().catch(error => {
        console.log('Error hiding splash screen:', error);
      });
    }
  }, [userToken, segments, isLoading, fontsLoaded, router]);

  if (isLoading || !fontsLoaded) {
    // Get current theme from context or use default dark theme colors
    let themeColors;
    try {
      const themeContext = useContext(ThemeContext);
      themeColors = themeContext?.colors || {
        background: '#0A0F24',
        text: '#FFFFFF',
        primary: '#00FFCC'
      };
    } catch (e) {
      // Fallback to default colors if context is not available
      themeColors = {
        background: '#0A0F24',
        text: '#FFFFFF',
        primary: '#00FFCC'
      };
    }
    
    // Create dynamic styles based on theme
    const dynamicStyles = StyleSheet.create({
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: themeColors.background,
      },
      loadingText: {
        color: themeColors.text,
        marginTop: 16,
        fontSize: 16,
      },
    });
    
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={dynamicStyles.loadingText}>Loading GroundSchool-AI...</Text>
      </View>
    );
  }

  // Return the Slot for all routes - authentication will be handled in useEffect
  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          {(theme) => {
            // Using fixed dark theme based on our ThemeContext
            const paperTheme = {
              ...defaultTheme,
              dark: true, // Always dark
              colors: {
                primary: theme.colors.primary,
                background: theme.colors.background,
                text: theme.colors.text,
                accent: theme.colors.primary,
                error: '#FF6B6B',
                disabled: 'rgba(255, 255, 255, 0.3)',
                surface: 'rgba(255, 255, 255, 0.05)',
                onSurface: theme.colors.text,
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Add screenOptions for stack navigator compatibility in Router v3
export const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0A0F24' }
};
