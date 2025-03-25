import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';
import { nanoid } from 'nanoid';
import * as Keychain from 'react-native-keychain';

// Ensure WebBrowser is prepared for Google auth flow
WebBrowser.maybeCompleteAuthSession();

/**
 * Authentication Service for handling user authentication
 * Fully implemented with Google and Apple sign-in options
 */
class AuthService {
  /**
   * Login a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data and token
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Validate response data
      if (!data || !data.user) {
        throw new Error('Invalid response from authentication service');
      }
      
      // Store auth token and user data
      if (data.session) {
        try {
          await AsyncStorage.setItem('userToken', data.session.access_token);
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        } catch (storageError) {
          console.error('Failed to store auth data:', storageError);
          // Continue despite storage error - user is still authenticated
        }
      } else {
        console.warn('Login successful but no session was returned');
      }
      
      return {
        user: data.user,
        token: data.session?.access_token || null
      };
    } catch (error) {
      console.error('Login error:', error);
      // Rethrow with a more user-friendly message but preserve original error
      const userMessage = 'Failed to sign in. Please check your credentials and try again.';
      const enhancedError = new Error(userMessage);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - User data and token
   */
  async register({ email, password, ...otherData }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: otherData
        }
      });
      
      if (error) throw error;
      
      // Store auth token and user data if registration includes login
      if (data.session) {
        await AsyncStorage.setItem('userToken', data.session.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      }
      
      return {
        user: data.user,
        token: data.session?.access_token
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Logout the current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Call Supabase logout to invalidate session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    }
    
    // Clear local storage
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  }
  
  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('userToken');
    return !!token;
  }
  
  /**
   * Get current user data
   * @returns {Promise<Object|null>}
   */
  async getCurrentUser() {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!userDataString) {
        return null;
      }
      
      return JSON.parse(userDataString);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Updated user data
   */
  async updateProfile(userData) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: userData
      });
      
      if (error) throw error;
      
      // Update stored user data
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      return {
        user: data.user
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Response data
   */
  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true };
  }
  
  /**
   * Reset password with token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Response data
   */
  async resetPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return { success: true };
  }
  
  /**
   * Sign in with Google
   * @returns {Promise<Object>} - User data and token
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'groundschoolai://auth/callback',
          skipBrowserRedirect: true
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // Open OAuth URL in browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'groundschoolai://auth/callback'
        );
        
        if (result.type === 'success') {
          // Check the current session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) throw sessionError;
          
          if (sessionData?.session) {
            // Store auth token and user data
            await AsyncStorage.setItem('userToken', sessionData.session.access_token);
            await AsyncStorage.setItem('userData', JSON.stringify(sessionData.session.user));
            
            return {
              user: sessionData.session.user,
              token: sessionData.session.access_token
            };
          }
        }
      }
      
      throw new Error('Google sign in failed');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }
  
  /**
   * Sign in with Apple
   * @returns {Promise<Object>} - User data and token
   */
  async signInWithApple() {
    try {
      // Skip on Android
      if (Platform.OS === 'android') {
        throw new Error('Apple sign in is not available on Android');
      }
      
      // Check if Apple authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple authentication is not available on this device');
      }
      
      // Perform Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Use the credential to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      
      if (error) throw error;
      
      // Store auth token and user data
      if (data?.session) {
        await AsyncStorage.setItem('userToken', data.session.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        // Store Apple credential securely using Keychain
        await Keychain.setGenericPassword(
          'apple_credential', 
          JSON.stringify(credential)
        );
        
        return {
          user: data.user,
          token: data.session?.access_token
        };
      }
      
      throw new Error('Apple sign in failed');
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  }
  
  /**
   * Create a guest account
   * @returns {Promise<Object>} - Guest user data and token
   */
  async createGuestAccount() {
    try {
      // Generate unique email and password for guest account
      const guestId = nanoid(8);
      const email = `guest_${guestId}@groundschool.ai`;
      const password = nanoid(16);
      
      // Register guest user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Guest Pilot',
            is_guest: true
          }
        }
      });
      
      if (error) throw error;
      
      // Store auth token and user data
      if (data.session) {
        await AsyncStorage.setItem('userToken', data.session.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        // Store credentials securely using Keychain for future auto-login
        await Keychain.setGenericPassword(email, password);
      }
      
      return {
        user: data.user,
        token: data.session?.access_token
      };
    } catch (error) {
      console.error('Guest account creation error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
