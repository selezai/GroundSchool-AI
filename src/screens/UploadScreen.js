import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import Button from '../components/Button';

/**
 * UploadScreen - Allows users to upload study materials (PDFs/images)
 * for AI-powered question generation
 */
const UploadScreen = ({ testID = 'upload-screen' }) => {
  const navigation = useNavigation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pick a document from the device
  const pickDocument = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        // Check file size (max 20MB)
        if (result.size > 20 * 1024 * 1024) {
          setError('File size exceeds 20MB limit. Please choose a smaller file.');
          return;
        }
        
        setFile(result);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to pick document. Please try again.');
    }
  };

  // Process the uploaded file to generate questions
  const processFile = async () => {
    if (!file) {
      Alert.alert('No File', 'Please select a file first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // TODO: This is where we would call the backend API to process the file
      // For now, we'll simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock questions (in real implementation, these would come from the Claude API)
      const questions = [
        {
          id: 'q1',
          question: 'What is the correct definition of altitude?',
          options: [
            'Distance above ground level',
            'Height above mean sea level',
            'Vertical distance from the standard datum plane',
            'Elevation above the highest terrain'
          ],
          correctAnswer: 'Vertical distance from the standard datum plane',
          category: 'Navigation',
          difficulty: 'Medium'
        },
        {
          id: 'q2',
          question: 'Which of the following is NOT a primary flight control surface?',
          options: [
            'Aileron',
            'Elevator',
            'Rudder',
            'Flap'
          ],
          correctAnswer: 'Flap',
          category: 'Aircraft Systems',
          difficulty: 'Easy'
        },
        {
          id: 'q3',
          question: 'What is the standard atmospheric pressure at sea level?',
          options: [
            '1003 hPa',
            '1013.25 hPa',
            '1023 hPa',
            '1033.25 hPa'
          ],
          correctAnswer: '1013.25 hPa',
          category: 'Meteorology',
          difficulty: 'Medium'
        }
      ];
      
      // Navigate to the QuizScreen with the generated questions
      navigation.navigate('Quiz', { questions });
      
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Study Material</Text>
        <Text style={styles.subtitle}>
          Upload a PDF or image (max 20MB) to generate SACAA-style questions
        </Text>
        
        <View style={styles.uploadArea}>
          {file ? (
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
              <Button 
                title="Change File" 
                onPress={pickDocument}
                variant="outline"
                size="small"
                testID={`${testID}-change-file-btn`}
              />
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={styles.uploadIconContainer}>
                <Text style={styles.plusIcon}>+</Text>
              </View>
              <Text style={styles.uploadText}>Tap to select a file</Text>
              <Button 
                title="Select File" 
                onPress={pickDocument}
                variant="outline"
                testID={`${testID}-select-file-btn`}
              />
            </View>
          )}
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Button 
          title={loading ? 'Processing...' : 'Generate Questions'} 
          onPress={processFile}
          disabled={!file || loading}
          style={styles.generateButton}
          testID={`${testID}-generate-btn`}
        />
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FFCC" />
            <Text style={styles.loadingText}>
              Analyzing document and generating questions...
            </Text>
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Note:</Text>
          <Text style={styles.infoText}>
            - Supported formats: PDF, JPG, PNG{'\n'}
            - Maximum file size: 20MB{'\n'}
            - Uploaded files are deleted after processing
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24', // Dark navy (aviation-themed)
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 24,
    textAlign: 'center',
  },
  uploadArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  plusIcon: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '200',
  },
  uploadText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  fileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 16,
  },
  errorText: {
    color: '#FC8181',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  generateButton: {
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#E2E8F0',
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
});

export default UploadScreen;
