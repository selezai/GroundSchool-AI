import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Define the app theme
const theme = {
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F24',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
});

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
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Error checking login status:', e);
      } finally {
        setIsLoading(false);
      }
    }

    checkLoginStatus();
  }, []);

  // Handle routing based on authentication
  useEffect(() => {
    if (isLoading || !fontsLoaded) {
      // Still determining auth state or loading fonts
      return;
    }
    
    const inAuthGroup = segments[0] === 'auth';
    
    if (!userToken && !inAuthGroup) {
      // If user isn't signed in and the initial segment isn't in the auth group
      router.replace('/auth/login');
    } else if (userToken && inAuthGroup) {
      // If user is signed in and the initial segment is in the auth group
      router.replace('/');
    } else {
      // Hide the splash screen once we're done setting things up
      SplashScreen.hideAsync();
    }
  }, [userToken, segments, isLoading, fontsLoaded, router]);

  if (isLoading || !fontsLoaded) {
    // We can show a loading screen here if needed instead of keeping the splash screen
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FFCC" />
        <Text style={styles.loadingText}>Loading GroundSchool-AI...</Text>
      </View>
    );
  }

  // Return the children components with the authentication setup complete
  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <Auth />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
