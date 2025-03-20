import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import SentryTest from '../scripts/test-sentry';
import { captureMessage } from '../src/utils/SentryConfig';
import Logger from '../src/utils/Logger';

const SentryTestScreen = () => {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (result) => {
    setTestResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const handleTest = async (testFn, name) => {
    try {
      setIsTesting(true);
      const result = await testFn();
      addResult({
        name,
        success: true,
        message: result.message || 'Test completed successfully',
        timestamp: new Date().toISOString()
      });
      
      // Log the test result
      Logger.info(`Sentry test "${name}" completed`, { result });
      
      // Add a breadcrumb
      Sentry.addBreadcrumb({
        category: 'sentry.test',
        message: `Test "${name}" completed`,
        level: Sentry.Severity.Info,
        data: { testName: name, success: true }
      });
      
    } catch (error) {
      addResult({
        name,
        success: false,
        message: error.message || 'Test failed',
        timestamp: new Date().toISOString()
      });
      
      // Log the error
      Logger.error(`Sentry test "${name}" failed`, error);
      
      // Add a breadcrumb
      Sentry.addBreadcrumb({
        category: 'sentry.test',
        message: `Test "${name}" failed`,
        level: Sentry.Severity.Error,
        data: { testName: name, error: error.message }
      });
      
    } finally {
      setIsTesting(false);
    }
  };

  const runAllTests = async () => {
    try {
      setIsTesting(true);
      clearResults();
      
      addResult({
        name: 'All Tests',
        success: true,
        message: 'Starting all tests...',
        timestamp: new Date().toISOString()
      });
      
      // Capture a message to mark the start of testing
      captureMessage('Starting Sentry integration tests', {
        level: 'info',
        tags: { test: 'all_tests' }
      });
      
      // Run all tests
      await SentryTest.runAllTests();
      
      addResult({
        name: 'All Tests',
        success: true,
        message: 'All tests completed',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      addResult({
        name: 'All Tests',
        success: false,
        message: `Tests failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      setIsTesting(false);
    }
  };

  const triggerComponentError = () => {
    Alert.alert(
      'Trigger Component Error',
      'This will crash the component. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Crash It',
          onPress: () => {
            // This will trigger the error boundary
            SentryTest.triggerComponentError();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Sentry Test', 
          headerStyle: { backgroundColor: '#0A0F24' },
          headerTintColor: '#fff'
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Sentry Integration Test</Text>
        <Text style={styles.description}>
          Use the buttons below to test various Sentry error reporting features.
          Check your Sentry dashboard to see if the errors are being reported correctly.
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleTest(SentryTest.sendTestMessage, 'Send Info Message')}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Send Info Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleTest(() => SentryTest.sendTestMessage('warning'), 'Send Warning Message')}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Send Warning Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleTest(() => SentryTest.sendTestMessage('error'), 'Send Error Message')}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Send Error Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleTest(SentryTest.triggerJavaScriptError, 'JavaScript Error')}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Trigger JavaScript Error</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleTest(SentryTest.triggerPromiseRejection, 'Promise Rejection')}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Trigger Promise Rejection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleTest(SentryTest.addTestBreadcrumbs, 'Add Breadcrumbs')}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Add Breadcrumbs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]} 
            onPress={triggerComponentError}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Trigger Component Error</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={runAllTests}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Run All Tests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={clearResults}
            disabled={isTesting}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No test results yet</Text>
          ) : (
            testResults.map((result, index) => (
              <View key={index} style={[
                styles.resultItem, 
                result.success ? styles.successResult : styles.errorResult
              ]}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
                <Text style={styles.resultTimestamp}>{result.timestamp}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2E3A59',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4C6EF5',
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  dangerButton: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  noResults: {
    color: '#ccc',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  resultItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  successResult: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  errorResult: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 8,
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
});

export default SentryTestScreen;
