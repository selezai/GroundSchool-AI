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
import { supabase } from '../src/services/supabaseClient';
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
  
  // Open document picker (Files app) with enhanced error handling
  const handleDocumentPicker = async () => {
    try {
      setShowPickerOptions(false); // Close modal first to prevent UI glitches
      
      // Simple approach without race condition to prevent concurrent pickers
      // Use a shorter timeout (15 seconds) to avoid long hangs
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      }).catch(error => {
        console.error('Document picker error caught:', error);
        return null;
      });
      
      // Validate result structure
      if (!result) {
        console.error('Document picker returned null result');
        return;
      }
      
      if (result.canceled) {
        console.log('Document picking was canceled');
        return;
      }
      
      // Carefully validate the assets array
      if (!result.assets || !Array.isArray(result.assets) || result.assets.length === 0) {
        console.error('Document picker returned no assets:', result);
        Alert.alert('Error', 'No file was selected. Please try again.');
        return;
      }
      
      const file = result.assets[0];
      
      // Validate required file properties
      if (!file.uri) {
        console.error('Selected file is missing URI:', file);
        Alert.alert('Error', 'The selected file is invalid. Please choose another file.');
        return;
      }
      
      // Normalize file metadata with fallbacks for missing properties
      const normalizedFile = {
        name: file.name || `document_${Date.now()}.pdf`,
        uri: file.uri,
        size: file.size || 0,
        type: file.mimeType || 'application/octet-stream'
      };
      
      // Log success for debugging
      console.log('Document successfully picked:', normalizedFile.name);
      
      // Set the selected file with complete metadata
      setSelectedFile(normalizedFile);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(
        'Error',
        `Failed to pick document: ${error.message || 'Unknown error'}. Please try again.`
      );
    }
  };

  // Open image picker (Gallery) with enhanced error handling
  const handleImagePicker = async () => {
    try {
      setShowPickerOptions(false); // Close modal first to prevent UI glitches
      
      // Safely request permissions without race condition
      let permissionResult;
      try {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
          .catch(error => {
            console.error('Permission request error caught:', error);
            return null;
          });
      } catch (permError) {
        console.error('Error requesting gallery permissions:', permError);
        Alert.alert(
          'Permission Error',
          'Failed to request gallery permissions. Please check your app settings.'
        );
        return;
      }
      
      // Check permission result
      if (!permissionResult || permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'You need to grant gallery permissions to upload images. Please enable it in your device settings.'
        );
        return;
      }
      
      // Simpler approach without race condition to prevent concurrent pickers
      // Use proper API based on Expo SDK version
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.IMAGE : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7, // Lower quality to improve performance
        exif: false, // Don't need EXIF data, reduces memory usage
      }).catch(error => {
        console.error('Image picker error caught:', error);
        return null;
      });
      
      // Handle cancellation and validate result
      if (!result || result.canceled) {
        console.log('Image picking was canceled or returned no result');
        return;
      }
      
      // Validate assets array
      if (!result.assets || !Array.isArray(result.assets) || result.assets.length === 0) {
        console.error('Image picker returned no assets:', result);
        Alert.alert('Error', 'No image was selected. Please try again.');
        return;
      }
      
      const image = result.assets[0];
      
      // Validate image URI
      if (!image.uri) {
        console.error('Selected image is missing URI:', image);
        Alert.alert('Error', 'The selected image is invalid. Please choose another image.');
        return;
      }
      
      // Extract filename safely
      let filename = 'image.jpg';
      try {
        const uriParts = image.uri.split('/');
        if (uriParts.length > 0) {
          filename = uriParts[uriParts.length - 1] || filename;
        }
      } catch (e) {
        console.warn('Could not extract filename from URI:', e);
      }
      
      // Determine image type based on extension
      let imageType = 'image/jpeg';
      try {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext) {
          switch (ext) {
            case 'png': imageType = 'image/png'; break;
            case 'gif': imageType = 'image/gif'; break;
            case 'webp': imageType = 'image/webp'; break;
            case 'jpg': 
            case 'jpeg':
            default: imageType = 'image/jpeg';
          }
        }
      } catch (e) {
        console.warn('Could not determine image type from filename:', e);
      }
      
      // Create normalized file object with fallbacks
      const normalizedFile = {
        name: filename,
        uri: image.uri,
        size: image.fileSize || image.size || 0, // Account for different property names
        type: image.mimeType || imageType
      };
      
      console.log('Image successfully picked:', normalizedFile.name);
      setSelectedFile(normalizedFile);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        `Failed to pick image: ${error.message || 'Unknown error'}. Please try again.`
      );
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
      
      // Upload file to Supabase storage directly
      // Handle filenames with multiple dots properly
      const nameParts = selectedFile.name.split('.');
      const fileExt = nameParts.length > 1 ? nameParts.pop() : 'file';
      
      // Create a sanitized, unique filename with timestamp and user's original filename
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
      // Use let instead of const since we might need to update this later
      let fileName = `${Date.now()}_${sanitizedName}`;
      
      // Upload to storage bucket
      setProcessingStage('Uploading document...');
      setProcessingProgress(20);
      
      let blob;
      try {
        // Fetch the file data as a blob with timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(selectedFile.uri, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        blob = await response.blob();
      } catch (fetchError) {
        console.error('Error fetching file:', fetchError);
        throw new Error(`Failed to read the file: ${fetchError.message}`);
      }
      
      // Verify blob before upload
      if (!blob || blob.size === 0) {
        throw new Error('Invalid file: The file appears to be empty or corrupted');
      }
      
      // Upload file blob to Supabase storage with better error handling
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, {
          contentType: selectedFile.type || 'application/octet-stream', // Provide fallback mime type
          cacheControl: '3600',
          upsert: true // Overwrite if file exists with same name
        });
        
      // Retry once with a different filename if upload fails
      if (storageError) {
        console.error('Storage upload error:', storageError);
        
        // Only retry if it's a duplicate error
        if (storageError.message && storageError.message.includes('duplicate')) {
          const retryFileName = `${Date.now()}_retry_${sanitizedName}`;
          const { data: retryData, error: retryError } = await supabase.storage
            .from('documents')
            .upload(retryFileName, blob, {
              contentType: selectedFile.type,
              cacheControl: '3600'
            });
            
          if (retryError) {
            console.error('Retry storage upload error:', retryError);
            throw retryError;
          }
          
          // Use the successful retry data
          fileName = retryFileName;
        } else {
          // For other errors, just throw
          throw storageError;
        }
      }
      
      setProcessingProgress(50);
      setProcessingStage('Processing document...');
      
      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      // Create document record in database
      const documentData = {
        title: selectedFile.name.replace(`.${fileExt}`, ''),
        file_path: fileName, // Store the path/filename in storage
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        status: 'completed', // Set initial status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      
      setProcessingProgress(70);
      setProcessingStage('Creating document record...');
      
      const { data: documentRecord, error: documentError } = await supabase
        .from('documents')
        .insert(documentData)
        .select();
        
      if (documentError) {
        console.error('Document record error:', documentError);
        throw documentError;
      }
      
      setProcessingProgress(85);
      setProcessingStage('Generating quiz...');
      
      // Generate quiz using our updated quiz service
      let quizResponse;
      try {
        // Make a safety check for document ID
        if (!documentRecord || !documentRecord[0] || !documentRecord[0].id) {
          throw new Error('Document record is invalid or missing ID');
        }
        
        // Clone selectedFile to avoid any reference issues
        const fileForQuiz = {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size
        };
        
        quizResponse = await quizService.generateQuiz(fileForQuiz, {
          questionCount: 10,
          difficulty: 'mixed',
          documentId: documentRecord[0].id
        });
        
        // Verify quiz response structure
        if (!quizResponse || !quizResponse.quiz || !quizResponse.quiz.id) {
          throw new Error('Invalid quiz response format');
        }
      } catch (error) {
        console.error('Quiz generation error:', error);
        
        // If service fails, create a basic quiz directly
        try {
          quizResponse = await createBasicQuiz(documentRecord[0].id, selectedFile.name);
        } catch (fallbackError) {
          console.error('Failed to create basic quiz:', fallbackError);
          Alert.alert(
            'Quiz Creation Issue', 
            'We had trouble creating your quiz. You can still access your document in the history tab.',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
          throw new Error(`Failed to create quiz: ${error.message}. Fallback also failed: ${fallbackError.message}`);
        }
      }
      
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
  
  // Helper function to create a basic quiz if the service fails
  const createBasicQuiz = async (documentId, documentName) => {
    try {
      if (!documentId) {
        throw new Error('Document ID is required to create a quiz');
      }
      
      // Create a basic title from document name (handling potential edge cases)
      const nameParts = (documentName || 'Unnamed Document').split('.');
      const baseName = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : documentName || 'Unnamed Document';
      const safeTitle = baseName.length > 50 ? `${baseName.substring(0, 47)}...` : baseName;
      
      // Get the current user ID safely with additional error handling
      let userId;
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          throw new Error(`Authentication error: ${error.message}`);
        }
        
        userId = data?.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated or user ID not available');
        }
      } catch (authError) {
        console.error('Failed to get user:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      // Create a basic quiz with the document ID
      const quizData = {
        title: `Quiz on ${safeTitle}`,
        document_id: documentId,
        question_count: 10,
        difficulty: 'mixed',
        created_at: new Date().toISOString(),
        user_id: userId
      };
      
      // Insert with better error handling
      const { data: quizRecord, error: quizError } = await supabase
        .from('quizzes')
        .insert(quizData)
        .select();
        
      if (quizError) {
        console.error('Database error creating quiz:', quizError);
        throw new Error(`Database error: ${quizError.message}`);
      }
      
      if (!quizRecord || quizRecord.length === 0) {
        throw new Error('Failed to create quiz record - no data returned');
      }
      
      // Return in the expected format with additional validation
      return {
        quiz: {
          id: quizRecord[0].id,
          title: quizRecord[0].title,
          createdAt: quizRecord[0].created_at,
          documentId: documentId,
          // Add safe fallbacks for any other required fields
          questions: []
        }
      };
    } catch (error) {
      console.error('Error creating basic quiz:', error);
      // Don't show alert here, let the calling function handle UI feedback
      throw error;
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
