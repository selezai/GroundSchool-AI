import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { generateQuestions } from '../lib/aiProcessing';
import { useNavigation } from '@react-navigation/native';

const UploadScreen = () => {
  const [file, setFile] = useState(null);
  const navigation = useNavigation();

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.type === 'success') {
      setFile(result);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('No file selected', 'Please select a file to upload.');
      return;
    }

    const { uri, name } = file;
    const fileExt = name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, { uri, type: 'application/pdf' });

    if (error) {
      Alert.alert('Upload Failed', error.message);
    } else {
      try {
        const questions = await generateQuestions(fileName);
        Alert.alert('Questions Generated', `Generated ${questions.length} questions.`);
        navigation.navigate('QuestionBank', { questions });
      } catch (error) {
        Alert.alert('AI Processing Failed', error.message);
      }
      setFile(null);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Upload a PDF or Image</Text>
      <Button title="Pick a Document" onPress={pickDocument} />
      <Button title="Upload" onPress={handleUpload} disabled={!file} />
    </View>
  );
};

export default UploadScreen;
