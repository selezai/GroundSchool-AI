import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import Logger from '../src/utils/Logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DebugScreen() {
  const [logs, setLogs] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [storageInfo, setStorageInfo] = useState({});

  useEffect(() => {
    loadLogs();
    loadDeviceInfo();
    loadStorageInfo();
  }, []);

  async function loadLogs() {
    try {
      const appLogs = await Logger.getLogs();
      setLogs(appLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  async function loadDeviceInfo() {
    try {
      // Get basic device info
      const info = {
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        version: Platform.Version,
        // Add any other device info you need
      };
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  }

  async function loadStorageInfo() {
    try {
      // Get all keys in AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const result = {};
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          // Truncate long values
          result[key] = value && value.length > 100 ? value.substring(0, 100) + '...' : value;
        } catch (e) {
          result[key] = 'Error reading value';
        }
      }
      
      setStorageInfo(result);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  }

  async function clearAllLogs() {
    try {
      await Logger.clearLogs();
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  async function shareLogs() {
    try {
      const logFile = `${FileSystem.documentDirectory}app_logs.txt`;
      const fileExists = await FileSystem.getInfoAsync(logFile);
      
      if (fileExists.exists) {
        await Share.share({
          title: 'App Logs',
          message: 'App debug logs',
          url: logFile,
        });
      } else {
        // Create a temporary file with logs
        const tempFile = `${FileSystem.cacheDirectory}temp_logs.txt`;
        let logContent = '--- App Logs ---\n';
        
        logs.forEach(log => {
          logContent += `${log.timestamp} [${log.level}] ${log.message}\n`;
          if (log.error) {
            logContent += `Error: ${log.error}\n`;
          }
          if (log.stack) {
            logContent += `Stack: ${log.stack}\n`;
          }
          logContent += '\n';
        });
        
        await FileSystem.writeAsStringAsync(tempFile, logContent);
        
        await Share.share({
          title: 'App Logs',
          message: 'App debug logs',
          url: tempFile,
        });
      }
    } catch (error) {
      console.error('Failed to share logs:', error);
    }
  }

  async function resetApp() {
    try {
      // Clear all AsyncStorage
      await AsyncStorage.clear();
      // Clear logs
      await Logger.clearLogs();
      // Reload the app
      alert('App data cleared. Please restart the app.');
    } catch (error) {
      console.error('Failed to reset app:', error);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Debug Information</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={loadLogs}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={shareLogs}>
          <Text style={styles.buttonText}>Share Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={resetApp}>
          <Text style={styles.buttonText}>Reset App</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Device Info</Text>
      <ScrollView style={styles.infoContainer}>
        {Object.entries(deviceInfo).map(([key, value]) => (
          <Text key={key} style={styles.infoText}>
            <Text style={styles.infoLabel}>{key}: </Text>
            {value}
          </Text>
        ))}
      </ScrollView>
      
      <Text style={styles.sectionTitle}>Storage Info</Text>
      <ScrollView style={styles.infoContainer}>
        {Object.entries(storageInfo).map(([key, value]) => (
          <Text key={key} style={styles.infoText}>
            <Text style={styles.infoLabel}>{key}: </Text>
            {value}
          </Text>
        ))}
      </ScrollView>
      
      <Text style={styles.sectionTitle}>Logs ({logs.length})</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
            <Text style={[styles.logLevel, getLogLevelStyle(log.level)]}>{log.level}</Text>
            <Text style={styles.logMessage}>{log.message}</Text>
            {log.error && <Text style={styles.logError}>{log.error}</Text>}
            {log.stack && <Text style={styles.logStack}>{log.stack}</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getLogLevelStyle(level) {
  switch (level) {
    case 'ERROR':
      return styles.logLevelError;
    case 'WARN':
      return styles.logLevelWarn;
    case 'INFO':
      return styles.logLevelInfo;
    case 'DEBUG':
      return styles.logLevelDebug;
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#00FFCC',
    padding: 8,
    borderRadius: 4,
    margin: 4,
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#0A0F24',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    padding: 8,
    maxHeight: 100,
    marginBottom: 8,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#00FFCC',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    padding: 8,
  },
  logEntry: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  logTime: {
    color: '#AAAAAA',
    fontSize: 10,
  },
  logLevel: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
  },
  logLevelError: {
    color: '#FF6B6B',
  },
  logLevelWarn: {
    color: '#FFD166',
  },
  logLevelInfo: {
    color: '#00FFCC',
  },
  logLevelDebug: {
    color: '#AAAAAA',
  },
  logMessage: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 2,
  },
  logError: {
    color: '#FF6B6B',
    fontSize: 10,
    marginTop: 2,
  },
  logStack: {
    color: '#AAAAAA',
    fontSize: 8,
    marginTop: 2,
  },
});
