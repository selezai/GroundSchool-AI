import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import useStore from '../../store';
import Button from '../components/Button';
import authService from '../services/authService';

/**
 * LoginScreen - Handles user authentication
 * Allows users to log in with email/password, Google, Apple, or continue as guest
 */
const LoginScreen = ({ testID = 'login-screen' }) => {
  const navigation = useNavigation();
  const { setUser } = useStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  
  // Check if Apple Authentication is available on this device
  useEffect(() => {
    const checkAppleAuthAvailability = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setAppleAuthAvailable(isAvailable);
      }
    };
    
    checkAppleAuthAvailability();
  }, []);

  // Handle login form submission with email and password
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      
      // Use the authService to log in with email and password
      const { user } = await authService.login(email, password);
      
      // Update the global state
      await setUser(user);
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle guest login - creates a temporary account
  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      
      // Use authService to create a guest account
      const { user } = await authService.createGuestAccount();
      
      // Update global state
      await setUser(user);
      
    } catch (error) {
      console.error('Guest login error:', error);
      Alert.alert('Error', 'Failed to login as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      // Use authService to sign in with Google
      const { user } = await authService.signInWithGoogle();
      
      // Update global state
      await setUser(user);
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Google Sign-In Failed', error.message || 'Could not sign in with Google');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      
      // Use authService to sign in with Apple
      const { user } = await authService.signInWithApple();
      
      // Update global state
      await setUser(user);
      
    } catch (error) {
      console.error('Apple sign-in error:', error);
      Alert.alert('Apple Sign-In Failed', error.message || 'Could not sign in with Apple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo}
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
                  testID={`${testID}-email-input`}
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
                  testID={`${testID}-password-input`}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.forgotPassword}
                testID={`${testID}-forgot-password-btn`}
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
                testID={`${testID}-login-btn`}
              />
              
              {/* Social sign-in options */}
              <View style={styles.socialSignInContainer}>
                <Text style={styles.socialSignInText}>Or sign in with</Text>
                
                {/* Google Sign In */}
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  testID={`${testID}-google-btn`}
                >
                  <View style={styles.socialButtonContent}>
                    <Image 
                      source={require('../../assets/google-icon.png')} 
                      style={styles.socialIcon}
                    />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </View>
                </TouchableOpacity>
                
                {/* Apple Sign In - Only shown on iOS if available */}
                {Platform.OS === 'ios' && appleAuthAvailable && (
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    testID={`${testID}-apple-btn`}
                  >
                    <View style={styles.socialButtonContent}>
                      <Ionicons name="logo-apple" size={22} color="#FFF" style={styles.appleIcon} />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Guest Login */}
              <TouchableOpacity 
                style={styles.guestButton}
                onPress={handleGuestLogin}
                disabled={loading}
                testID={`${testID}-guest-btn`}
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Signup')}
                testID={`${testID}-signup-link`}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  logo: {
    width: 200,
    height: 80,
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
    fontWeight: '500',
  },
  socialSignInContainer: {
    marginVertical: 16,
    width: '100%',
  },
  socialSignInText: {
    color: '#8896AB',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButton: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  appleIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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
});

export default LoginScreen;
