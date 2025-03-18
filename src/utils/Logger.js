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
          const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
          if (storedLogs) {
            this.logs = JSON.parse(storedLogs);
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
        stack: error?.stack || null
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
          // Use localStorage on web
          localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (storageError) {
          // Silently fail if localStorage is not available
          console.warn('Could not write to localStorage');
        }
      } else {
        // Use AsyncStorage on native platforms
        await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        
        // Write to file on native platforms
        if (this.logFile) {
          const logLine = `${timestamp} [${level}] ${message}${error ? ' - ' + error.toString() : ''}\n`;
          await FileSystem.appendAsStringAsync(this.logFile, logLine);
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
    this.log(message, 'ERROR', error);
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
      await AsyncStorage.removeItem(LOG_STORAGE_KEY);
      
      if (this.logFile) {
        await FileSystem.writeAsStringAsync(this.logFile, '--- Logs Cleared ---\n');
      }
      
      this.log('Logs cleared', 'INFO');
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  }
}

export default Logger;
