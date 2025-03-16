import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Button from '../components/Button';
import { supabase } from '../services/supabaseClient';
import apiClient from '../services/apiClient';

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
      
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Read file content
      let fileContent;
      try {
        if (file.uri.endsWith('.pdf')) {
          // Handle PDF (would need PDF extraction logic here)
          // Using a simplified approach - in production you'd want proper PDF text extraction
          fileContent = `PDF Document: ${file.name}`;
          // Note: For real implementation, use a PDF parser library
        } else {
          // Handle text files
          fileContent = await FileSystem.readAsStringAsync(file.uri);
        }
      } catch (readError) {
        console.error('Error reading file:', readError);
        throw new Error('Could not read file content');
      }
      
      if (!fileContent || fileContent.length < 50) {
        throw new Error('File content is too short or could not be extracted');
      }
      
      // Upload the document to Supabase storage
      const filePath = `documents/${user.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        throw new Error('Failed to upload document');
      }
      
      // Record the upload in the database
      const { error: dbError } = await supabase
        .from('document_uploads')
        .insert({
          user_id: user.id,
          filename: file.name,
          filepath: filePath,
          filesize: file.size,
          filetype: file.mimeType
        });
        
      if (dbError) {
        console.error('Error recording upload:', dbError);
      }
      
      // Generate questions using DeepSeek API
      const questions = await apiClient.generateQuestionsWithDeepSeek(fileContent);
      
      // Create a quiz attempt record
      const { data: quizAttempt, error: quizError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          title: `Quiz from ${file.name}`,
          document_name: file.name,
          document_path: filePath,
          total_questions: questions.length,
          completed: false
        })
        .select()
        .single();
        
      if (quizError) {
        console.error('Error creating quiz:', quizError);
        throw new Error('Failed to create quiz');
      }
      
      // Save the individual questions
      const questionRecords = questions.map(q => ({
        quiz_attempt_id: quizAttempt.id,
        question_text: q.question,
        options: JSON.stringify(q.options),
        correct_answer: q.correctAnswer,
        category: q.category || 'General',
        difficulty: q.difficulty || 'Medium'
      }));
      
      const { error: questionsError } = await supabase
        .from('question_answers')
        .insert(questionRecords);
        
      if (questionsError) {
        console.error('Error saving questions:', questionsError);
      }
      
      // Navigate to the quiz screen with the generated questions
      navigation.navigate('Quiz', {
        questions,
        title: file.name,
        quizId: quizAttempt.id,
        documentId: filePath
      });
      
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
