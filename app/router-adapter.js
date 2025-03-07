/**
 * Router Adapter
 * 
 * This file provides compatibility between different Expo Router versions
 * to make the migration process smoother between SDK versions.
 * It exports the appropriate router functions based on the current SDK version.
 */

import { useRouter as useExpoRouter, useNavigation as useExpoNavigation, useLocalSearchParams, Slot, Stack } from 'expo-router';
import Constants from 'expo-constants';

// SDK version detection (basic version)
const SDK_VERSION = Constants.expoConfig?.sdkVersion || '52.0.0';
const MAJOR_VERSION = parseInt(SDK_VERSION.split('.')[0], 10);

// Use appropriate router functions based on SDK version
export const useRouter = () => {
  const router = useExpoRouter();

  // Common interface that works across Expo Router v2, v3, and v4
  return {
    ...router,
    // Add any version-specific adaptations here
    navigate: (route, params) => {
      if (typeof router.navigate === 'function') {
        return router.navigate(route, params);
      } else if (typeof router.push === 'function') {
        return router.push({
          pathname: route,
          params,
        });
      }
    },
    // Add additional helper methods for compatibility
    back: () => {
      if (typeof router.back === 'function') {
        return router.back();
      } else if (typeof router.pop === 'function') {
        return router.pop();
      }
    },
    // Router v3 uses replace more commonly
    replace: (route, params) => {
      if (typeof router.replace === 'function') {
        return router.replace(route, params);
      } else {
        // Fallback for Router v2
        return router.navigate(route, params);
      }
    }
  };
};

// Export layout components for different router versions with gesture support
export const RouterComponents = {
  // For all router versions
  Slot,
  // For v2/v3/v4 with gesture navigation enabled
  Stack: {
    ...Stack,
    Screen: {
      ...Stack.Screen,
      defaultProps: {
        ...Stack.Screen?.defaultProps,
        options: {
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationEnabled: true,
          animation: 'slide_from_right',
          customAnimationOnGesture: true
        }
      }
    }
  }
};

// Navigation adapter
export const useNavigation = () => {
  return useExpoNavigation();
};

// Params adapter - works with all router versions
export const useParams = () => {
  return useLocalSearchParams();
};

// Helper to create navigation links
export const createLink = (path, params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add params to query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};

// Default export of the adapter for Expo Router v4 compatibility
const RouterAdapter = {
  useRouter,
  useNavigation,
  useParams,
  createLink,
  RouterComponents
};

export default RouterAdapter;
