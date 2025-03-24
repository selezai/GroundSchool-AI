import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import Logger from '../utils/Logger';

/**
 * Platform Service - Provides platform-specific implementations for common functionality
 * This service abstracts away platform differences to provide a consistent API
 */
const PlatformService = {
  /**
   * Platform-specific navigation methods
   */
  navigation: {
    /**
     * Navigate to a new screen
     * @param {object} router - The router object
     * @param {string} path - The path to navigate to
     */
    push: Platform.select({
      web: (router, path) => {
        try {
          router.push(path);
        } catch (error) {
          Logger.error('Web navigation push error', error);
          // Fallback to window.location if router fails
          window.location.href = path;
        }
      },
      default: (router, path) => {
        try {
          router.push(path);
        } catch (error) {
          Logger.error('Native navigation push error', error);
        }
      }
    }),

    /**
     * Replace the current screen
     * @param {object} router - The router object
     * @param {string} path - The path to navigate to
     */
    replace: Platform.select({
      web: (router, path) => {
        try {
          router.replace(path);
        } catch (error) {
          Logger.error('Web navigation replace error', error);
          // Fallback to window.location if router fails
          window.location.replace(path);
        }
      },
      default: (router, path) => {
        try {
          router.replace(path);
        } catch (error) {
          Logger.error('Native navigation replace error', error);
        }
      }
    }),

    /**
     * Go back to the previous screen
     * @param {object} router - The router object
     */
    goBack: Platform.select({
      web: (router) => {
        try {
          router.back();
        } catch (error) {
          Logger.error('Web navigation back error', error);
          // Fallback to window.history if router fails
          window.history.back();
        }
      },
      default: (router) => {
        try {
          router.back();
        } catch (error) {
          Logger.error('Native navigation back error', error);
        }
      }
    })
  },

  /**
   * Platform-specific storage methods
   */
  storage: Platform.select({
    web: {
      /**
       * Get an item from storage
       * @param {string} key - The key to get
       * @returns {Promise<string|null>} The value or null if not found
       */
      getItem: async (key) => {
        try {
          // Check if localStorage is available in this environment
          if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem(key);
          }
          return null;
        } catch (error) {
          Logger.error('Web storage getItem error', error);
          return null;
        }
      },

      /**
       * Set an item in storage
       * @param {string} key - The key to set
       * @param {string} value - The value to set
       * @returns {Promise<void>}
       */
      setItem: async (key, value) => {
        try {
          // Check if localStorage is available in this environment
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch (error) {
          Logger.error('Web storage setItem error', error);
        }
      },

      /**
       * Remove an item from storage
       * @param {string} key - The key to remove
       * @returns {Promise<void>}
       */
      removeItem: async (key) => {
        try {
          // Check if localStorage is available in this environment
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch (error) {
          Logger.error('Web storage removeItem error', error);
        }
      },

      /**
       * Clear all items from storage
       * @returns {Promise<void>}
       */
      clear: async () => {
        try {
          // Check if localStorage is available in this environment
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
          }
        } catch (error) {
          Logger.error('Web storage clear error', error);
        }
      }
    },
    default: {
      /**
       * Get an item from storage
       * @param {string} key - The key to get
       * @returns {Promise<string|null>} The value or null if not found
       */
      getItem: async (key) => {
        try {
          return await AsyncStorage.getItem(key);
        } catch (error) {
          Logger.error('Native storage getItem error', error);
          return null;
        }
      },

      /**
       * Set an item in storage
       * @param {string} key - The key to set
       * @param {string} value - The value to set
       * @returns {Promise<void>}
       */
      setItem: async (key, value) => {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          Logger.error('Native storage setItem error', error);
        }
      },

      /**
       * Remove an item from storage
       * @param {string} key - The key to remove
       * @returns {Promise<void>}
       */
      removeItem: async (key) => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          Logger.error('Native storage removeItem error', error);
        }
      },

      /**
       * Clear all items from storage
       * @returns {Promise<void>}
       */
      clear: async () => {
        try {
          await AsyncStorage.clear();
        } catch (error) {
          Logger.error('Native storage clear error', error);
        }
      }
    }
  }),

  /**
   * Platform-specific file system methods
   */
  fileSystem: Platform.select({
    web: {
      /**
       * Read a file as text
       * @param {string} path - The path to read
       * @returns {Promise<string|null>} The file contents or null if error
       */
      readAsText: async (path) => {
        try {
          const response = await fetch(path);
          return await response.text();
        } catch (error) {
          Logger.error('Web fileSystem readAsText error', error);
          return null;
        }
      },

      /**
       * Write text to a file (not fully supported on web)
       * @param {string} path - The path to write to
       * @param {string} content - The content to write
       * @returns {Promise<boolean>} Success status
       */
      writeAsText: async (path, content) => {
        Logger.warn('File writing not fully supported on web platform');
        return false;
      }
    },
    default: {
      /**
       * Read a file as text
       * @param {string} path - The path to read
       * @returns {Promise<string|null>} The file contents or null if error
       */
      readAsText: async (path) => {
        try {
          return await FileSystem.readAsStringAsync(path);
        } catch (error) {
          Logger.error('Native fileSystem readAsText error', error);
          return null;
        }
      },

      /**
       * Write text to a file
       * @param {string} path - The path to write to
       * @param {string} content - The content to write
       * @returns {Promise<boolean>} Success status
       */
      writeAsText: async (path, content) => {
        try {
          await FileSystem.writeAsStringAsync(path, content);
          return true;
        } catch (error) {
          Logger.error('Native fileSystem writeAsText error', error);
          return false;
        }
      }
    }
  })
};

export default PlatformService;
