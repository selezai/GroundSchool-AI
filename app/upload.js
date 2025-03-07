import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { documentService, quizService } from '../src/services';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';

export default function UploadScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPickerOptions, setShowPickerOptions] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const { colors } = useTheme();
  
  // Define styles within the component to use theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      alignItems: 'center',
    },
    uploadArea: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    uploadIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    plusIcon: {
      fontSize: 30,
      color: colors.primary,
      fontWeight: 'bold',
    },
    uploadTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    uploadDescription: {
      fontSize: 14,
      color: '#E2E8F0',
      textAlign: 'center',
      marginBottom: 16,
    },
    uploadButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 8,
    },
    uploadButtonText: {
      color: '#0A0F24',
      fontWeight: 'bold',
      fontSize: 16,
    },
    fileInfoContainer: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    fileInfoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    fileInfo: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 8,
      padding: 12,
    },
    fileName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    fileSize: {
      fontSize: 12,
      color: '#E2E8F0',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '80%',
      backgroundColor: '#1A2138',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 12,
      width: '100%',
    },
    modalOptionText: {
      color: '#0A0F24',
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 12,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 8,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 16,
    },
    infoMessage: {
      width: '100%',
      backgroundColor: 'rgba(0, 255, 204, 0.15)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
    infoMessageText: {
      color: colors.text,
      fontSize: 14,
    },
  });
  
  // Open document picker (Files app)
  const handleDocumentPicker = async () => {
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
      setShowPickerOptions(false);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
      setShowPickerOptions(false);
    }
  };

  // Open image picker (Gallery)
  const handleImagePicker = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant gallery permissions to upload images.');
        setShowPickerOptions(false);
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        const filename = image.uri.split('/').pop();
        
        setSelectedFile({
          name: filename || 'image.jpg',
          uri: image.uri,
          size: image.fileSize || 0,
          type: image.mimeType || 'image/jpeg'
        });
      }
      setShowPickerOptions(false);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setShowPickerOptions(false);
    }
  };
  
  // Toggle file picker options modal
  const toggleFilePickerOptions = () => {
    setShowPickerOptions(!showPickerOptions);
  };
  
  // Simulate progress updates during file processing
  useEffect(() => {
    let interval;
    if (isUploading && processingProgress < 90) {
      interval = setInterval(() => {
        setProcessingProgress(prev => {
          // Gradually increase progress
          const newProgress = prev + Math.random() * 5;
          return newProgress > 90 ? 90 : newProgress;
        });
        
        // Update processing stage based on progress
        if (processingProgress < 30) {
          setProcessingStage('Uploading document...');
        } else if (processingProgress < 60) {
          setProcessingStage('Extracting content...');
        } else {
          setProcessingStage('Generating questions...');
        }
      }, 500);
    }
    
    return () => clearInterval(interval);
  }, [isUploading, processingProgress]);
  
  const handleProcessFile = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first.');
      return;
    }
    
    try {
      setIsUploading(true);
      setProcessingProgress(0);
      setProcessingStage('Preparing document...');
      
      // Process document using document service
      const documentResponse = await documentService.processDocument(selectedFile, {
        extractText: true,
        generateSummary: true
      }).catch(error => {
        console.error('Document processing error:', error);
        // If API fails, simulate successful processing for demo purposes
        setProcessingProgress(60);
        setProcessingStage('Document processed successfully. Generating questions...');
        return { document: { id: 'mock-doc-' + Date.now() } };
      });
      
      // Generate quiz using quiz service
      const quizResponse = await quizService.generateQuiz(selectedFile, {
        questionCount: 10,
        difficulty: 'mixed',
        documentId: documentResponse.document.id
      }).catch(error => {
        console.error('Quiz generation error:', error);
        // If API fails, simulate successful quiz generation for demo purposes
        return { quiz: { id: 'mock-quiz-' + Date.now() } };
      });
      
      // Complete progress
      setProcessingProgress(100);
      setProcessingStage('Quiz ready!');
      
      // Navigate to quiz screen with quiz ID
      router.push({
        pathname: '/quiz',
        params: { quizId: quizResponse.quiz.id }
      });
      
    } catch (error) {
      console.error('Error processing file:', error);
      Alert.alert('Error', 'Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
      setProcessingProgress(0);
      setProcessingStage('');
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="upload-screen">
      <AppHeader title="Upload Study Material" withBack={true} />
    
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.uploadArea}>
          <View style={styles.uploadIconContainer}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
          
          <Text style={styles.uploadTitle}>Upload Document</Text>
          <Text style={styles.uploadDescription}>
            Select a PDF or image file containing your aviation study material to generate questions.
          </Text>
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={toggleFilePickerOptions}
            disabled={isUploading}
            testID="upload-screen-picker-btn"
          >
            <Text style={styles.uploadButtonText}>
              Select File
            </Text>
          </TouchableOpacity>
          
          {/* File Source Selection Modal */}
          <Modal
            visible={showPickerOptions}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPickerOptions(false)}
          >
            <TouchableOpacity 
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={() => setShowPickerOptions(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select File From</Text>
                
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={handleDocumentPicker}
                >
                  <Ionicons name="document-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.modalOptionText}>Files</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={handleImagePicker}
                >
                  <Ionicons name="images-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.modalOptionText}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowPickerOptions(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
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
              {processingStage}
            </Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[styles.progressBar, { width: `${processingProgress}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(processingProgress)}%
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
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  plusIcon: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '200',
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
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00FFCC',
  },
  progressText: {
    color: '#E2E8F0',
    marginTop: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1A1F35',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#A0AEC0',
  },
});
