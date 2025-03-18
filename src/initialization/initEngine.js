import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../utils/Logger';
import { getSupabase } from '../services/supabaseClient';
import PlatformService from '../services/PlatformService';

/**
 * Dependency graph for app services
 * Each key is a service, and its value is an array of dependencies
 */
const dependencyGraph = {
  logger: [],
  storage: ['logger'],
  auth: ['logger', 'storage'],
  navigation: ['logger'],
  analytics: ['logger', 'auth'],
  crashReporting: ['logger', 'auth']
};

/**
 * Service initialization functions
 */
const serviceInitializers = {
  /**
   * Initialize logger service
   */
  logger: async () => {
    try {
      if (!Logger.initialized) {
        await Logger.init();
      }
      return true;
    } catch (error) {
      console.warn('Logger initialization failed:', error);
      return false;
    }
  },

  /**
   * Initialize storage service
   */
  storage: async () => {
    try {
      // Test storage access
      if (Platform.OS === 'web') {
        localStorage.setItem('STORAGE_TEST', 'true');
        localStorage.removeItem('STORAGE_TEST');
      } else {
        await AsyncStorage.setItem('STORAGE_TEST', 'true');
        await AsyncStorage.removeItem('STORAGE_TEST');
      }
      Logger.info('Storage service initialized');
      return true;
    } catch (error) {
      Logger.error('Storage initialization failed:', error);
      return false;
    }
  },

  /**
   * Initialize auth service
   */
  auth: async () => {
    try {
      // Initialize Supabase auth
      await getSupabase().auth.initialize();
      Logger.info('Auth service initialized');
      return true;
    } catch (error) {
      Logger.error('Auth initialization failed:', error);
      return false;
    }
  },

  /**
   * Initialize navigation service
   */
  navigation: async () => {
    try {
      // Navigation initialization is mostly handled by NavigationController
      // This is just for any additional setup needed
      Logger.info('Navigation service initialized');
      return true;
    } catch (error) {
      Logger.error('Navigation initialization failed:', error);
      return false;
    }
  },

  /**
   * Initialize analytics service
   */
  analytics: async () => {
    try {
      // Placeholder for analytics initialization
      Logger.info('Analytics service initialized');
      return true;
    } catch (error) {
      Logger.error('Analytics initialization failed:', error);
      return false;
    }
  },

  /**
   * Initialize crash reporting service
   */
  crashReporting: async () => {
    try {
      // Placeholder for crash reporting initialization
      Logger.info('Crash reporting service initialized');
      return true;
    } catch (error) {
      Logger.error('Crash reporting initialization failed:', error);
      return false;
    }
  }
};

/**
 * Handle initialization error
 * @param {Error} error - The error that occurred
 */
const handleInitError = (error) => {
  try {
    Logger.error('Service initialization error:', error);
  } catch (e) {
    console.error('Failed to log initialization error:', e);
  }
};

/**
 * Enter safe mode due to critical initialization failure
 * @param {Error} error - The error that caused safe mode
 */
const enterSafeMode = async (error) => {
  try {
    console.warn('Entering safe mode due to initialization failure:', error);
    
    // Set safe mode flag
    if (Platform.OS === 'web') {
      localStorage.setItem('APP_SAFE_MODE', 'true');
    } else {
      await AsyncStorage.setItem('APP_SAFE_MODE', 'true');
    }
    
    // Log the error if possible
    try {
      Logger.error('Entering safe mode:', error);
    } catch (e) {
      // Logger might not be available
    }
  } catch (e) {
    console.error('Failed to enter safe mode:', e);
  }
};

/**
 * Initialize a specific service and its dependencies
 * @param {string} service - The service to initialize
 * @param {Set} initializedServices - Set of already initialized services
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
const initService = async (service, initializedServices) => {
  // Skip if already initialized
  if (initializedServices.has(service)) return true;
  
  try {
    // Initialize dependencies first
    const dependencies = dependencyGraph[service] || [];
    
    for (const dep of dependencies) {
      const success = await initService(dep, initializedServices);
      if (!success) {
        Logger.warn(`Dependency '${dep}' failed to initialize for service '${service}'`);
        // Continue anyway, the service might be able to handle missing dependencies
      }
    }
    
    // Initialize the service
    const initializer = serviceInitializers[service];
    if (!initializer) {
      Logger.warn(`No initializer found for service '${service}'`);
      return false;
    }
    
    const success = await initializer();
    if (success) {
      initializedServices.add(service);
      Logger.info(`Service '${service}' initialized successfully`);
      return true;
    } else {
      Logger.warn(`Service '${service}' failed to initialize`);
      return false;
    }
  } catch (error) {
    Logger.error(`Error initializing service '${service}':`, error);
    return false;
  }
};

/**
 * Initialize the app with dependency-aware service initialization
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export const initializeApp = async () => {
  const initializedServices = new Set();
  let criticalFailure = false;
  
  try {
    Logger.info('Starting app initialization');
    
    // Critical services that must be initialized
    const criticalServices = ['logger', 'storage', 'auth'];
    
    // Initialize critical services first
    for (const service of criticalServices) {
      const success = await initService(service, initializedServices)
        .catch(e => {
          handleInitError(e);
          return false;
        });
      
      if (!success && service !== 'logger') {
        // Logger failure is handled specially - we continue without it
        criticalFailure = true;
        Logger.error(`Critical service '${service}' failed to initialize`);
      }
    }
    
    if (criticalFailure) {
      Logger.warn('Critical service initialization failed, entering safe mode');
      await enterSafeMode(new Error('Critical service initialization failed'));
      return false;
    }
    
    // Initialize non-critical services in parallel
    const nonCriticalServices = Object.keys(dependencyGraph)
      .filter(service => !criticalServices.includes(service));
    
    await Promise.all(
      nonCriticalServices.map(service => 
        initService(service, initializedServices)
          .catch(e => {
            handleInitError(e);
            return false;
          })
      )
    );
    
    Logger.info('App initialization completed successfully');
    return true;
  } catch (error) {
    Logger.error('Fatal error during app initialization:', error);
    await enterSafeMode(error);
    return false;
  }
};

export default {
  initializeApp,
  dependencyGraph,
  serviceInitializers
};
