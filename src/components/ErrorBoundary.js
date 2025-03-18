import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, Platform, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Logger from '../utils/Logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRecovering: false,
      errorCount: 0,
      lastErrorTimestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our Logger
    Logger.error('Error caught by ErrorBoundary', error);
    Logger.error(`Component stack: ${errorInfo?.componentStack || 'Not available'}`);
    
    // Track error frequency to detect crash loops
    const now = Date.now();
    const lastError = this.state.lastErrorTimestamp;
    const isFrequentError = lastError && (now - lastError < 60000); // Within a minute
    
    this.setState(prevState => ({ 
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastErrorTimestamp: now
    }));
    
    // Hide splash screen if it's still visible
    SplashScreen.hideAsync()
      .then(() => Logger.info('Splash screen hidden after error boundary caught error'))
      .catch(e => Logger.error('Failed to hide splash screen after error boundary caught error', e));
    
    // If we're getting frequent errors, store a flag to trigger safe mode on next app start
    if (isFrequentError && this.state.errorCount > 3) {
      Logger.warn('Frequent errors detected - marking app for safe mode on next start');
      AsyncStorage.setItem('APP_SAFE_MODE', 'true')
        .then(() => Logger.info('Safe mode flag set successfully'))
        .catch(e => Logger.error('Failed to set safe mode flag', e));
    }
  }

  resetError = () => {
    Logger.info('User attempted to reset error in ErrorBoundary');
    this.setState({ hasError: false, error: null, errorInfo: null, isRecovering: false });
  }
  
  recoverWithReset = async () => {
    try {
      Logger.info('Attempting recovery with data reset');
      this.setState({ isRecovering: true });
      
      // Clear non-critical app data
      await AsyncStorage.multiRemove([
        'app_state_cache',
        'recent_searches',
        'ui_preferences'
      ]);
      
      // Wait a moment before resetting the error state
      setTimeout(() => {
        this.resetError();
      }, 1000);
      
    } catch (e) {
      Logger.error('Recovery failed', e);
      this.setState({ isRecovering: false });
    }
  }
  
  restartApp = () => {
    Logger.info('User requested app restart');
    this.setState({ isRecovering: true });
    
    // Use router to navigate to the root
    setTimeout(() => {
      try {
        router.replace('/');
        setTimeout(() => this.resetError(), 500);
      } catch (e) {
        Logger.error('Failed to restart app', e);
        this.setState({ isRecovering: false });
      }
    }, 500);
  }
  
  shareErrorLogs = async () => {
    try {
      Logger.info('User attempting to share error logs');
      const logs = await Logger.getLogs();
      const errorText = `Error: ${this.state.error?.toString() || 'Unknown error'}\n\n` +
                       `Component Stack: ${this.state.errorInfo?.componentStack || 'Not available'}\n\n` +
                       `Device: ${Platform.OS} ${Platform.Version}\n\n` +
                       `Recent Logs:\n${logs.slice(0, 20).map(log => 
                          `${log.timestamp} [${log.level}] ${log.message} ${log.error ? '- ' + log.error : ''}`
                        ).join('\n')}`;
      
      await Share.share({
        message: errorText,
        title: 'App Error Logs'
      });
      
      Logger.info('Error logs shared successfully');
    } catch (e) {
      Logger.error('Failed to share error logs', e);
    }
  }

  render() {
    if (this.state.hasError) {
      // Show recovery UI
      if (this.state.isRecovering) {
        return (
          <View style={styles.container}>
            <ActivityIndicator size="large" color="#00FFCC" />
            <Text style={styles.message}>Recovering...</Text>
          </View>
        );
      }
      
      // Render fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error.
          </Text>
          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {this.state.error?.toString() || 'Unknown error'}
            </Text>
            {this.state.errorInfo && (
              <Text style={styles.errorStack}>
                {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={this.recoverWithReset}>
              <Text style={styles.buttonText}>Reset & Recover</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.linkButton} onPress={this.shareErrorLogs}>
            <Text style={styles.linkText}>Share Error Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton} onPress={this.restartApp}>
            <Text style={styles.linkText}>Restart App</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F24',
    padding: 20,
  },
  title: {
    color: '#FF6B6B',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 10,
  },
  errorStack: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00FFCC',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#4A5568',
  },
  buttonText: {
    color: '#0A0F24',
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 10,
    marginTop: 5,
  },
  linkText: {
    color: '#00FFCC',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default ErrorBoundary;
