import React, { useState } from 'react';
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
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import useStore from '../../store';
import Button from '../components/Button';
import { supabase } from '../services/supabaseClient';

/**
 * SignupScreen - Handles new user registration
 * Collects user information and creates a new account
 */
const SignupScreen = ({ testID = 'signup-screen' }) => {
  const navigation = useNavigation();
  const { setUser } = useStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate form inputs
  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    // Password strength check
    if (password.length < 8) {
      Alert.alert('Error', 'Password should be at least 8 characters long');
      return false;
    }
    
    return true;
  };

  // Handle signup form submission
  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) throw error;
      
      // Create a user profile in the database
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: name,
            email: email,
            created_at: new Date().toISOString(),
          });
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue anyway as the auth record was created
        }
        
        // Set the user in our local state
        await setUser({
          id: data.user.id,
          name,
          email,
        });
        
        // Show confirmation message about email verification if needed
        Alert.alert(
          'Account Created', 
          'Your account has been created. Please check your email for verification instructions.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message || 'Failed to create account. Please try again.');
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Sign up to start your aviation study journey
              </Text>
            </View>
            
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#8896AB"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  testID={`${testID}-name-input`}
                />
              </View>
              
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
                  placeholder="Create a password"
                  placeholderTextColor="#8896AB"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  testID={`${testID}-password-input`}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#8896AB"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  testID={`${testID}-confirm-password-input`}
                />
              </View>
              
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By signing up, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
              
              <Button 
                title={loading ? 'Creating Account...' : 'Sign Up'} 
                onPress={handleSignup}
                disabled={loading}
                variant="primary"
                size="large"
                style={styles.signupButton}
                testID={`${testID}-signup-btn`}
              />
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                testID={`${testID}-login-link`}
              >
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 180,
    height: 70,
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
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
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#00FFCC',
  },
  signupButton: {
    marginBottom: 16,
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
  loginLink: {
    color: '#00FFCC',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
