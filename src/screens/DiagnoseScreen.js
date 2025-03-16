import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import apiClient from '../services/apiClient';
import { generateQuestions } from '../../lib/aiProcessing';
import { supabase } from '../services/supabaseClient';



const DiagnoseScreen = () => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const addLogEntry = (type, message, details = null) => {
    const timestamp = new Date().toISOString().split('T')[1].substr(0, 8);
    setResults(prev => [
      ...prev, 
      { 
        id: Date.now().toString(), 
        type, 
        message, 
        details, 
        timestamp 
      }
    ]);
  };
  
  const clearLogs = () => {
    setResults([]);
  };
  
  const saveLogs = async () => {
    try {
      addLogEntry('info', 'Saving diagnostic logs...');
      
      const logData = JSON.stringify(results, null, 2);
      const logFilePath = `${FileSystem.documentDirectory}deepseek-diagnostics-${Date.now()}.json`;
      
      await FileSystem.writeAsStringAsync(logFilePath, logData);
      
      addLogEntry('success', `Logs saved to ${logFilePath}`);
    } catch (error) {
      addLogEntry('error', `Failed to save logs: ${error.message}`);
    }
  };
  
  const runApiKeyDiagnostic = async () => {
    addLogEntry('header', '🔑 DeepSeek API Key Diagnostic');
    
    try {
      // Check environment variable
      const envApiKey = process.env.DEEPSEEK_API_KEY;
      if (envApiKey) {
        addLogEntry('success', 'API key found in environment variables', 
          { keyPreview: `${envApiKey.substring(0, 3)}...${envApiKey.substring(envApiKey.length - 3)}` });
      } else {
        addLogEntry('warning', 'API key not found in environment variables');
      }
      
      // Check AsyncStorage
      try {
        const asyncStorageKey = await AsyncStorage.getItem('deepseek_api_key');
        if (asyncStorageKey) {
          addLogEntry('success', 'API key found in AsyncStorage', 
            { keyPreview: `${asyncStorageKey.substring(0, 3)}...${asyncStorageKey.substring(asyncStorageKey.length - 3)}` });
        } else {
          addLogEntry('error', 'API key not found in AsyncStorage');
        }
      } catch (asyncError) {
        addLogEntry('error', `Failed to access AsyncStorage: ${asyncError.message}`);
      }
      
      // Verify key format
      const apiKey = envApiKey || await AsyncStorage.getItem('deepseek_api_key');
      if (apiKey) {
        if (apiKey.startsWith('sk-')) {
          addLogEntry('success', 'API key format is valid');
        } else {
          addLogEntry('error', 'API key format is invalid - should start with "sk-"');
        }
      } else {
        addLogEntry('error', 'No API key found in any location');
      }
    } catch (error) {
      addLogEntry('error', `API key diagnostic failed: ${error.message}`);
    }
  };
  
  const runDirectApiTest = async () => {
    addLogEntry('header', '🧪 Direct DeepSeek API Test');
    
    try {
      addLogEntry('info', 'Making direct API call with standard prompt...');
      
      // Get the API key 
      const apiKey = process.env.DEEPSEEK_API_KEY || await AsyncStorage.getItem('deepseek_api_key');
      
      if (!apiKey) {
        addLogEntry('error', 'No API key available for test');
        return;
      }
      
      // Simple test prompt
      const testPrompt = 'Create 1 multiple-choice question about aviation.';
      
      // Log the start of the request
      addLogEntry('info', 'Sending request to DeepSeek API', { promptLength: testPrompt.length });
      
      // Make a direct API call
      const startTime = Date.now();
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          max_tokens: 1000,
          messages: [
            { role: "user", content: testPrompt }
          ]
        })
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Check the response status
      if (!response.ok) {
        const errorText = await response.text();
        addLogEntry('error', `API request failed with status ${response.status}`, { 
          responseTime: `${duration}s`,
          error: errorText 
        });
        return;
      }
      
      // Parse the JSON response
      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const content = data.choices[0].message.content;
        addLogEntry('success', `API request successful (${duration}s)`, { 
          responsePreview: content.substring(0, 100) + '...',
          model: data.model,
          tokens: data.usage?.total_tokens || 'unknown'
        });
      } else {
        addLogEntry('error', 'Unexpected API response format', { response: JSON.stringify(data) });
      }
    } catch (error) {
      addLogEntry('error', `Direct API test failed: ${error.message}`, { stack: error.stack });
    }
  };
  
  const runDocumentTest = async () => {
    addLogEntry('header', '📄 Document Processing Test');
    
    try {
      // Fetch user documents from Supabase storage
      addLogEntry('info', 'Fetching user documents from storage...');
      
      const { data: files, error: listError } = await supabase.storage
        .from('documents')
        .list('', {
          limit: 5,
          sortBy: { column: 'created_at', order: 'desc' },
        });
      
      if (listError) {
        throw listError;
      }
      
      if (!files || files.length === 0) {
        addLogEntry('warning', 'No documents found in storage');
        return;
      }
      
      // Select the most recent document
      const recentFile = files[0];
      const filePath = recentFile.name;
      
      addLogEntry('info', `Selected document for testing: ${filePath}`);
      
      // Generate questions from the real document
      addLogEntry('info', `Generating questions from document...`);
      const questions = await generateQuestions(filePath, { questionCount: 3 });
      
      if (questions && questions.length > 0) {
        addLogEntry('success', `Successfully generated ${questions.length} questions`);
        
        // Check if they are fallback questions
        const fallbackCount = questions.filter(q => q.id.startsWith('fallback')).length;
        
        if (fallbackCount === questions.length) {
          addLogEntry('error', 'All generated questions are fallbacks', { 
            questionCount: questions.length,
            sampleQuestion: questions[0].question
          });
        } else if (fallbackCount > 0) {
          addLogEntry('warning', `${fallbackCount} of ${questions.length} questions are fallbacks`);
        } else {
          addLogEntry('success', 'All questions are document-specific!');
        }
        
        // Show sample questions
        questions.forEach((question, index) => {
          addLogEntry(
            question.id.startsWith('fallback') ? 'warning' : 'info',
            `Question ${index + 1}: ${question.question.substring(0, 50)}...`,
            { isFallback: question.id.startsWith('fallback') }
          );
        });
      } else {
        addLogEntry('error', 'Failed to generate any questions');
      }
    } catch (error) {
      addLogEntry('error', `Document test failed: ${error.message}`, { stack: error.stack });
    }
  };
  
  const runFullDiagnostic = async () => {
    try {
      setIsRunning(true);
      clearLogs();
      
      addLogEntry('header', '🚀 DeepSeek API Integration Diagnostic');
      addLogEntry('info', `Starting diagnostic at ${new Date().toLocaleString()}`);
      
      await runApiKeyDiagnostic();
      await runDirectApiTest();
      await runDocumentTest();
      
      addLogEntry('header', '📊 Diagnostic Summary');
      
      // Check if any errors occurred
      const errors = results.filter(entry => entry.type === 'error');
      
      if (errors.length === 0) {
        addLogEntry('success', 'All diagnostics passed successfully!');
        addLogEntry('info', 'Recommendation: Your DeepSeek integration is working properly. If you are still experiencing issues, please check for errors in the app logs.');
      } else {
        addLogEntry('error', `${errors.length} issues detected during diagnostics`);
        
        // Make recommendations based on the errors
        if (results.some(r => r.message.includes('API key not found'))) {
          addLogEntry('info', 'Recommendation: Add your DeepSeek API key to the .env file or store it in AsyncStorage.');
        }
        
        if (results.some(r => r.message.includes('API request failed'))) {
          addLogEntry('info', 'Recommendation: Check your internet connection and verify the DeepSeek API key is valid.');
        }
        
        if (results.some(r => r.message.includes('fallbacks'))) {
          addLogEntry('info', 'Recommendation: The DeepSeek API is working but not generating document-specific questions. Review the prompt used for question generation.');
        }
      }
    } catch (error) {
      addLogEntry('error', `Diagnostic failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>DeepSeek API Diagnostics</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isRunning ? styles.buttonDisabled : null]} 
          onPress={runFullDiagnostic}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostic'}
          </Text>
          {isRunning && <ActivityIndicator color="#fff" style={styles.spinner} />}
        </TouchableOpacity>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.smallButton, isRunning ? styles.buttonDisabled : null]} 
            onPress={clearLogs}
            disabled={isRunning}
          >
            <Text style={styles.smallButtonText}>Clear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.smallButton, styles.saveButton, isRunning ? styles.buttonDisabled : null]} 
            onPress={saveLogs}
            disabled={isRunning}
          >
            <Text style={styles.smallButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {results.map(entry => (
          <View 
            key={entry.id} 
            style={[
              styles.logEntry, 
              entry.type === 'error' && styles.errorEntry,
              entry.type === 'warning' && styles.warningEntry,
              entry.type === 'success' && styles.successEntry,
              entry.type === 'header' && styles.headerEntry,
            ]}
          >
            <View style={styles.logHeader}>
              <Text style={styles.logTimestamp}>{entry.timestamp}</Text>
              {entry.type === 'error' && <Text style={styles.logType}>ERROR</Text>}
              {entry.type === 'warning' && <Text style={styles.logType}>WARNING</Text>}
              {entry.type === 'success' && <Text style={styles.logType}>SUCCESS</Text>}
              {entry.type === 'info' && <Text style={styles.logType}>INFO</Text>}
            </View>
            
            <Text style={[
              styles.logMessage,
              entry.type === 'header' && styles.headerText
            ]}>
              {entry.message}
            </Text>
            
            {entry.details && (
              <View style={styles.detailsContainer}>
                {Object.entries(entry.details).map(([key, value]) => (
                  <Text key={key} style={styles.detailText}>
                    <Text style={styles.detailKey}>{key}: </Text>
                    {typeof value === 'object' ? JSON.stringify(value) : value}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
        
        {results.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Run the diagnostic to see results here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 50,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  spinner: {
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButton: {
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: '#444444',
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 8,
  },
  logEntry: {
    padding: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#444444',
    backgroundColor: '#1A1A1A',
    marginBottom: 8,
    borderRadius: 4,
  },
  headerEntry: {
    borderLeftWidth: 0,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  errorEntry: {
    borderLeftColor: '#FF3B30',
  },
  warningEntry: {
    borderLeftColor: '#FFCC00',
  },
  successEntry: {
    borderLeftColor: '#34C759',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logTimestamp: {
    color: '#888888',
    fontSize: 12,
  },
  logType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888888',
  },
  logMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#242424',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  detailText: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 2,
  },
  detailKey: {
    fontWeight: 'bold',
    color: '#999999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DiagnoseScreen;
