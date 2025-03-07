import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './supabaseClient';

/**
 * Authentication Service for handling user authentication
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Store auth token and user data
      if (data.session) {
        await AsyncStorage.setItem('userToken', data.session.access_token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      }
      
      return {
        user: data.user,
        token: data.session?.access_token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true };
  }
  
  /**
   * Reset password with token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Response data
   */
  async resetPassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return { success: true };
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
