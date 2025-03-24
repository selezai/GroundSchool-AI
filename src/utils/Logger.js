import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Maximum number of log entries to keep
const MAX_LOG_ENTRIES = 100;
const LOG_STORAGE_KEY = 'app_debug_logs';

class Logger {
  static logs = [];
  static initialized = false;
  static logFile = null;

  static async init() {
    if (this.initialized) return;
    
    try {
      // Handle web platform differently
      if (Platform.OS === 'web') {
        // On web, we don't use FileSystem
        this.logFile = null;
        
        // Try to load logs from localStorage instead of AsyncStorage on web
        try {
          // Check if localStorage is available in this environment
          if (typeof window !== 'undefined' && window.localStorage) {
            const storedLogs = window.localStorage.getItem(LOG_STORAGE_KEY);
            if (storedLogs) {
              this.logs = JSON.parse(storedLogs);
            }
          }
        } catch (storageError) {
          // localStorage might be unavailable in some contexts
          console.warn('Could not access localStorage:', storageError);
        }
      } else {
        // Native platform - use FileSystem
        this.logFile = `${FileSystem.documentDirectory}app_logs.txt`;
        const fileInfo = await FileSystem.getInfoAsync(this.logFile);
        
        if (!fileInfo.exists) {
          await FileSystem.writeAsStringAsync(this.logFile, '--- App Logs ---\n');
        }
        
        // Load previous logs from AsyncStorage
        const storedLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      }
      
      this.initialized = true;
      this.log('Logger initialized', 'INFO');
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  static async log(message, level = 'INFO', error = null) {
    try {
      // Initialize if not already done
      if (!this.initialized) {
        await this.init();
      }
      
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        error: error ? error.toString() : null,
        stack: error?.stack || null,
        // Add more context for better debugging
        context: {
          platform: Platform.OS,
          version: Platform.Version,
          appVersion: '1.0.0' // This should be dynamically fetched from app config
        }
      };
      
      // Add to memory logs
      this.logs.unshift(logEntry);
      
      // Keep only the most recent logs
      if (this.logs.length > MAX_LOG_ENTRIES) {
        this.logs = this.logs.slice(0, MAX_LOG_ENTRIES);
      }
      
      // Platform-specific storage
      if (Platform.OS === 'web') {
        try {
          // Use localStorage on web if available
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
          }
        } catch (_storageError) {
          // Silently fail if localStorage is not available
          console.warn('Could not write to localStorage');
        }
      } else {
        // Use AsyncStorage on native platforms
        await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        
        // Write to file on native platforms
        if (this.logFile) {
          const logLine = `${timestamp} [${level}] ${message}${error ? ' - ' + error.toString() : ''}\n`;
          // Use writeAsStringAsync with append option instead of appendAsStringAsync
          await FileSystem.writeAsStringAsync(this.logFile, logLine, { append: true });
        }
      }
      
      // Always log to console on all platforms
      if (level === 'ERROR') {
        console.error(message, error);
      } else if (level === 'WARN') {
        console.warn(message);
      } else {
        console.log(`[${level}] ${message}`);
      }
    } catch (e) {
      // Fallback to console if logging fails
      console.error('Logging failed:', e);
      console.log(`Original log: [${level}] ${message}`);
    }
  }

  static error(message, error = null) {
    // Ensure we always have an Error object for better stack traces
    const errorObj = error instanceof Error ? error : error ? new Error(error.toString()) : new Error(message);
    this.log(message, 'ERROR', errorObj);
    
    // Return the error for chaining
    return errorObj;
  }

  static warn(message) {
    this.log(message, 'WARN');
  }

  static info(message) {
    this.log(message, 'INFO');
  }

  static debug(message) {
    this.log(message, 'DEBUG');
  }

  static async getLogs() {
    if (!this.initialized) {
      await this.init();
    }
    return this.logs;
  }

  static async clearLogs() {
    try {
      this.logs = [];
      
      // Platform-specific storage clearing
      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(LOG_STORAGE_KEY);
          }
        } catch (_storageError) {
          console.warn('Could not clear localStorage');
        }
      } else {
        await AsyncStorage.removeItem(LOG_STORAGE_KEY);
        
        if (this.logFile) {
          await FileSystem.writeAsStringAsync(this.logFile, '--- Logs Cleared ---\n');
        }
      }
      
      this.log('Logs cleared', 'INFO');
      return true;
    } catch (e) {
      console.error('Failed to clear logs:', e);
      return false;
    }
  }

  // Helper method to get formatted logs for display
  static getFormattedLogs() {
    return this.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      return `${time} [${log.level}] ${log.message}${log.error ? ' - ' + log.error : ''}`;
    });
  }
  
  // Export logs to a file (useful for support)
  static async exportLogs() {
    try {
      const logContent = JSON.stringify(this.logs, null, 2);
      
      if (Platform.OS === 'web') {
        // For web, create a downloadable file
        try {
          // Check if we're in a browser environment
          if (typeof window !== 'undefined' && window.Blob && window.URL && window.document) {
            const blob = new window.Blob([logContent], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `app_logs_${new Date().toISOString()}.json`;
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            return true;
          } else {
            console.warn('Browser APIs not available for exporting logs');
            return false;
          }
        } catch (browserError) {
          console.error('Error using browser APIs:', browserError);
          return false;
        }
      } else if (FileSystem) {
        // For native, save to file system
        const fileUri = `${FileSystem.documentDirectory}app_logs_export.json`;
        await FileSystem.writeAsStringAsync(fileUri, logContent);
        return fileUri;
      }
      
      return false;
    } catch (e) {
      console.error('Failed to export logs:', e);
      return false;
    }
  }
}

export default Logger;
