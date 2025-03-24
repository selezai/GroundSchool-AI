import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Define styles at the beginning of the component
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      fontSize: 16,
    },
    buttonContainer: {
      marginTop: 16,
    },
    deleteAccountButton: {
      marginTop: 32,
      marginBottom: 16,
      alignItems: 'center',
    },
    deleteAccountText: {
      color: '#FF3B30',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setName(parsedUser.name || '');
          setEmail(parsedUser.email || '');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Update profile information
  const handleUpdateProfile = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Simulate API call
      await new Promise(resolve => global.setTimeout(resolve, 1000));
      
      const updatedUser = {
        ...user,
        name,
        email
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      Alert.alert('Success', 'Profile updated successfully.');
      setIsSaving(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      setIsSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Simulate API call
      await new Promise(resolve => global.setTimeout(resolve, 1000));
      
      // In a real app, we would verify the current password and update it on the server
      
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSaving(false);
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
      setIsSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              
              // Simulate API call
              await new Promise(resolve => global.setTimeout(resolve, 1000));
              
              // Clear all user data
              await AsyncStorage.multiRemove(['userToken', 'userData']);
              
              setIsSaving(false);
              
              // Navigate to login screen
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  // Email validation helper
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Edit Profile" withBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Styles were moved to the beginning of the component

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Edit Profile" withBack={true} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={colors.isDarkMode ? '#8896AB' : '#A0AEC0'}
                value={name}
                onChangeText={setName}
                testID="edit-profile-name-input"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.isDarkMode ? '#8896AB' : '#A0AEC0'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="edit-profile-email-input"
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title={isSaving ? 'Saving...' : 'Save Changes'}
                onPress={handleUpdateProfile}
                disabled={isSaving}
                variant="primary"
                size="large"
                testID="edit-profile-save-btn"
              />
            </View>
          </View>
          
          {/* Change Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={colors.isDarkMode ? '#8896AB' : '#A0AEC0'}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                testID="edit-profile-current-password-input"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={colors.isDarkMode ? '#8896AB' : '#A0AEC0'}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                testID="edit-profile-new-password-input"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={colors.isDarkMode ? '#8896AB' : '#A0AEC0'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                testID="edit-profile-confirm-password-input"
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title={isSaving ? 'Changing...' : 'Change Password'}
                onPress={handleChangePassword}
                disabled={isSaving}
                variant="primary"
                size="large"
                testID="edit-profile-change-password-btn"
              />
            </View>
          </View>
          
          {/* Delete Account Section */}
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            disabled={isSaving}
            testID="edit-profile-delete-account-btn"
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
