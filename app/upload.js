import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Button from '../src/components/Button';

export default function UploadScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });
      
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          name: file.name,
          uri: file.uri,
          size: file.size,
          type: file.mimeType
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };
  
  const handleProcessFile = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first.');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Simulate API call to process document
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to quiz screen
      router.push('/quiz');
      
    } catch (error) {
      console.error('Error processing file:', error);
      Alert.alert('Error', 'Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="upload-screen">
      <Stack.Screen 
        options={{
          title: 'Upload Study Material',
        }} 
      />
    
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.uploadArea}>
          <Image 
            source={require('../assets/upload-icon.png')}
            style={styles.uploadIcon}
            resizeMode="contain"
          />
          
          <Text style={styles.uploadTitle}>Upload Document</Text>
          <Text style={styles.uploadDescription}>
            Select a PDF or image file containing your aviation study material to generate questions.
          </Text>
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleFilePicker}
            disabled={isUploading}
            testID="upload-screen-picker-btn"
          >
            <Text style={styles.uploadButtonText}>
              Select File
            </Text>
          </TouchableOpacity>
        </View>
        
        {selectedFile && (
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileInfoTitle}>Selected File</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                {selectedFile.name}
              </Text>
              <Text style={styles.fileSize}>
                {(selectedFile.size / 1024).toFixed(2)} KB
              </Text>
            </View>
          </View>
        )}
        
        <Button 
          title={isUploading ? 'Processing...' : 'Generate Questions'}
          onPress={handleProcessFile}
          disabled={!selectedFile || isUploading}
          variant="primary"
          size="large"
          style={styles.generateButton}
          testID="upload-screen-generate-btn"
        />
        
        {isUploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FFCC" />
            <Text style={styles.loadingText}>
              Processing document and generating questions...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  uploadArea: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    tintColor: '#00FFCC',
  },
  uploadTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  uploadDescription: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: 'rgba(0, 255, 204, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FFCC',
  },
  uploadButtonText: {
    color: '#00FFCC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileInfoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  fileInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  fileInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
  },
  fileName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  generateButton: {
    width: '100%',
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
  },
});
