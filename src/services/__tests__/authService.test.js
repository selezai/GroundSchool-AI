// Mock the modules before importing the service
jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(),
      signInWithIdToken: jest.fn()
    }
  }
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn()
}));

// Mock Expo modules
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn()
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 'full_name',
    EMAIL: 'email'
  }
}));

jest.mock('expo-auth-session/providers/google', () => ({
  // Empty mock implementation
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn()
}));

jest.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid'
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

// Import dependencies after mocking
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Keychain from 'react-native-keychain';

// Import the service to test
import authService from '../authService';



describe('AuthService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock successful login response
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'test-token' };
      
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      });

      const result = await authService.login('test@example.com', 'password');

      // Verify Supabase was called with correct params
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });

      // Verify token and user data were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userToken', 'test-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUser));

      // Verify correct result was returned
      expect(result).toEqual({
        user: mockUser,
        token: 'test-token'
      });
    });

    it('should throw error when login fails', async () => {
      // Mock login error
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid credentials')
      });

      await expect(authService.login('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid credentials');

      // Verify AsyncStorage was not called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock successful registration
      const mockUser = { id: '123', email: 'new@example.com' };
      const mockSession = { access_token: 'new-token' };
      
      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      });

      const userData = {
        email: 'new@example.com',
        password: 'newpassword',
        name: 'New User'
      };

      const result = await authService.register(userData);

      // Verify Supabase was called with correct params
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword',
        options: {
          data: { name: 'New User' }
        }
      });

      // Verify token and user data were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userToken', 'new-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUser));

      // Verify correct result was returned
      expect(result).toEqual({
        user: mockUser,
        token: 'new-token'
      });
    });

    it('should throw error when registration fails', async () => {
      // Mock registration error
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Email already exists')
      });

      const userData = {
        email: 'existing@example.com',
        password: 'password'
      };

      await expect(authService.register(userData))
        .rejects.toThrow('Email already exists');

      // Verify AsyncStorage was not called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Mock successful logout
      supabase.auth.signOut.mockResolvedValue({
        error: null
      });

      await authService.logout();

      // Verify Supabase was called
      expect(supabase.auth.signOut).toHaveBeenCalled();

      // Verify AsyncStorage items were removed
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userData');
    });

    it('should clear local storage even if API call fails', async () => {
      // Mock logout API error
      supabase.auth.signOut.mockResolvedValue({
        error: new Error('Network error')
      });

      await authService.logout();

      // Verify AsyncStorage items were still removed despite API error
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userData');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      // Mock token exists
      AsyncStorage.getItem.mockResolvedValue('existing-token');

      const result = await authService.isAuthenticated();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userToken');
      expect(result).toBe(true);
    });

    it('should return false when token does not exist', async () => {
      // Mock token doesn't exist
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await authService.isAuthenticated();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userToken');
      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when it exists', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      
      // Mock user data exists
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));

      const result = await authService.getCurrentUser();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userData');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user data does not exist', async () => {
      // Mock user data doesn't exist
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await authService.getCurrentUser();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userData');
      expect(result).toBeNull();
    });

    it('should return null when there is an error parsing user data', async () => {
      // Mock invalid JSON
      AsyncStorage.getItem.mockResolvedValue('invalid-json');

      const result = await authService.getCurrentUser();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('userData');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = { 
        id: '123', 
        email: 'test@example.com',
        user_metadata: { name: 'Updated Name' } 
      };
      
      // Mock successful profile update
      supabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const userData = { name: 'Updated Name' };
      const result = await authService.updateProfile(userData);

      // Verify Supabase was called with correct params
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: userData
      });

      // Verify user data was updated in storage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUser));

      // Verify correct result was returned
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw error when profile update fails', async () => {
      // Mock profile update error
      supabase.auth.updateUser.mockResolvedValue({
        data: null,
        error: new Error('Update failed')
      });

      await expect(authService.updateProfile({ name: 'New Name' }))
        .rejects.toThrow('Update failed');

      // Verify AsyncStorage was not called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      // Mock successful password reset request
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      const result = await authService.requestPasswordReset('test@example.com');

      // Verify Supabase was called with correct email
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');

      // Verify correct result was returned
      expect(result).toEqual({ success: true });
    });

    it('should throw error when password reset request fails', async () => {
      // Mock password reset request error
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      });

      await expect(authService.requestPasswordReset('unknown@example.com'))
        .rejects.toThrow('User not found');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      // Mock successful password reset
      supabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: null
      });

      const result = await authService.resetPassword('newpassword');

      // Verify Supabase was called with correct password
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword'
      });

      // Verify correct result was returned
      expect(result).toEqual({ success: true });
    });

    it('should throw error when password reset fails', async () => {
      // Mock password reset error
      supabase.auth.updateUser.mockResolvedValue({
        data: null,
        error: new Error('Invalid reset token')
      });

      await expect(authService.resetPassword('newpassword'))
        .rejects.toThrow('Invalid reset token');
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in with Google successfully', async () => {
      // Mock successful OAuth URL generation
      supabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth.google.com/auth' },
        error: null
      });

      // Mock successful web browser session
      WebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'success'
      });

      // Mock successful session retrieval
      const mockUser = { id: '123', email: 'google@example.com' };
      const mockSession = { 
        access_token: 'google-token',
        user: mockUser
      };
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.signInWithGoogle();

      // Verify Supabase was called with correct params
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'groundschoolai://auth/callback',
          skipBrowserRedirect: true
        }
      });

      // Verify web browser was opened with correct URL
      expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
        'https://oauth.google.com/auth',
        'groundschoolai://auth/callback'
      );

      // Verify session was retrieved
      expect(supabase.auth.getSession).toHaveBeenCalled();

      // Verify token and user data were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userToken', 'google-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUser));

      // Verify correct result was returned
      expect(result).toEqual({
        user: mockUser,
        token: 'google-token'
      });
    });

    it('should throw error when Google sign in fails', async () => {
      // Mock OAuth URL generation
      supabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth.google.com/auth' },
        error: null
      });

      // Mock web browser session failure
      WebBrowser.openAuthSessionAsync.mockResolvedValue({
        type: 'cancel'
      });

      await expect(authService.signInWithGoogle())
        .rejects.toThrow('Google sign in failed');

      // Verify AsyncStorage was not called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('signInWithApple', () => {
    it('should sign in with Apple successfully on iOS', async () => {
      // Mock Apple authentication availability
      AppleAuthentication.isAvailableAsync.mockResolvedValue(true);

      // Mock successful Apple authentication
      AppleAuthentication.signInAsync.mockResolvedValue({
        identityToken: 'apple-identity-token',
        fullName: { givenName: 'John', familyName: 'Doe' },
        email: 'apple@example.com'
      });

      // Mock successful Supabase sign in
      const mockUser = { id: '123', email: 'apple@example.com' };
      const mockSession = { access_token: 'apple-token' };
      
      supabase.auth.signInWithIdToken.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      });

      const result = await authService.signInWithApple();

      // Verify Apple authentication availability was checked
      expect(AppleAuthentication.isAvailableAsync).toHaveBeenCalled();

      // Verify Apple authentication was requested with correct scopes
      expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ]
      });

      // Verify Supabase was called with correct params
      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'apple',
        token: 'apple-identity-token'
      });

      // Verify token and user data were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userToken', 'apple-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUser));

      // Verify Apple credential was stored securely
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'apple_credential',
        expect.any(String)
      );

      // Verify correct result was returned
      expect(result).toEqual({
        user: mockUser,
        token: 'apple-token'
      });
    });

    it('should throw error when Apple authentication is not available', async () => {
      // Mock Apple authentication not available
      AppleAuthentication.isAvailableAsync.mockResolvedValue(false);

      await expect(authService.signInWithApple())
        .rejects.toThrow('Apple authentication is not available on this device');

      // Verify Apple authentication was not attempted
      expect(AppleAuthentication.signInAsync).not.toHaveBeenCalled();
      
      // Verify AsyncStorage was not called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('createGuestAccount', () => {
    it('should create a guest account successfully', async () => {
      // Mock successful guest registration
      const mockUser = { id: '123', email: 'guest_test-nanoid@groundschool.ai' };
      const mockSession = { access_token: 'guest-token' };
      
      supabase.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null
      });

      const result = await authService.createGuestAccount();

      // Verify Supabase was called with correct params
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'guest_test-nanoid@groundschool.ai',
        password: 'test-nanoid',
        options: {
          data: {
            name: 'Guest Pilot',
            is_guest: true
          }
        }
      });

      // Verify token and user data were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userToken', 'guest-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUser));

      // Verify credentials were stored securely
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'guest_test-nanoid@groundschool.ai',
        'test-nanoid'
      );

      // Verify correct result was returned
      expect(result).toEqual({
        user: mockUser,
        token: 'guest-token'
      });
    });

    it('should throw error when guest account creation fails', async () => {
      // Mock guest registration error
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Registration failed')
      });

      await expect(authService.createGuestAccount())
        .rejects.toThrow('Registration failed');

      // Verify AsyncStorage was not called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      
      // Verify Keychain was not called
      expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
    });
  });
});
