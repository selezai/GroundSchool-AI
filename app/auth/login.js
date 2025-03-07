import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../src/components/Button';

/**
 * LoginScreen - Handles user authentication
 * Allows users to log in with email/password or continue as guest
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle login form submission
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      
      // In a real implementation, this would call an authentication API
      // For now, we'll simulate a login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const userData = {
        id: 'user123',
        email,
        name: email.split('@')[0], // Extract name from email for demo
      };
      
      // Store user token - explicitly using string for token (SDK 52 compatibility)
      const token = 'sample-auth-token';
      console.log('Setting user token:', token);
      
      // Use direct Promise.all for concurrent storage operations
      await Promise.all([
        AsyncStorage.setItem('userToken', token),
        AsyncStorage.setItem('userData', JSON.stringify(userData))
      ]);
      
      console.log('Login successful, navigating to home...');
      
      // Navigate to main app - use direct navigation without timeout
      router.replace('/');
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }
    
    Alert.alert(
      'Reset Password',
      `A password reset link would be sent to ${email} in a real app.`,
      [{ text: 'OK' }]
    );
  };
  
  // Handle guest login
  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      
      // Create a guest user account
      const guestUser = {
        id: `guest_${Date.now()}`,
        name: 'Guest User',
        email: 'guest@example.com',
        isGuest: true,
      };
      
      // Store guest token - explicitly using string for token (SDK 52 compatibility)
      const token = 'guest-token';
      console.log('Setting guest token:', token);
      
      // Use direct Promise.all for concurrent storage operations
      await Promise.all([
        AsyncStorage.setItem('userToken', token),
        AsyncStorage.setItem('userData', JSON.stringify(guestUser))
      ]);
      
      console.log('Guest login successful, navigating to home...');
      
      // Navigate to main app directly without timeout
      router.replace('/');
      
    } catch (error) {
      console.error('Guest login error:', error);
      Alert.alert('Error', 'Failed to login as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="login-screen">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <Image 
                source={require('../../assets/logo.png')}
                style={styles.logoOnly}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>
                Log in to access your study materials and track your progress
              </Text>
            </View>
            
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#8896AB"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="login-screen-email-input"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#8896AB"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  testID="login-screen-password-input"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                testID="login-screen-forgot-password-btn"
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              <Button 
                title={loading ? 'Logging in...' : 'Login'} 
                onPress={handleLogin}
                disabled={loading}
                variant="primary"
                size="large"
                style={styles.loginButton}
                testID="login-screen-login-btn"
              />
              
              <TouchableOpacity 
                style={styles.guestButton}
                onPress={handleGuestLogin}
                disabled={loading}
                testID="login-screen-guest-btn"
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
              
              <View style={styles.socialLoginContainer}>
                <Text style={styles.socialLoginText}>Or sign in with</Text>
                <View style={styles.socialButtonsRow}>
                  <TouchableOpacity 
                    style={styles.socialButton}
                    testID="login-screen-google-btn"
                    onPress={() => Alert.alert('Info', 'Google login would be implemented in a real app')}
                  >
                    <Ionicons name="logo-google" size={20} color="#FFFFFF" style={styles.socialIcon} />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.socialButton}
                    testID="login-screen-apple-btn"
                    onPress={() => Alert.alert('Info', 'Apple login would be implemented in a real app')}
                  >
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.socialIcon} />
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity 
                onPress={() => router.push('/auth/signup')}
                testID="login-screen-signup-link"
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24', // Dark navy (aviation-themed)
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoOnly: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#00FFCC',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 16,
  },
  guestButton: {
    alignItems: 'center',
    padding: 12,
  },
  guestButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    color: '#E2E8F0',
    fontSize: 16,
    marginRight: 4,
  },
  signupLink: {
    color: '#00FFCC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialLoginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  socialLoginText: {
    color: '#8896AB',
    fontSize: 14,
    marginBottom: 12,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
