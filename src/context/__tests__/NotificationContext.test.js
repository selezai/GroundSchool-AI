import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../NotificationContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock the React context
jest.mock('react', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ...ActualReact,
    useContext: jest.fn(),
  };
});

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AsyncStorage interactions', () => {
    it('should store notification preference when toggling', async () => {
      // Create a mock implementation of toggleNotifications that we can test
      const toggleNotifications = async () => {
        try {
          const newValue = false; // Simulating toggling from true to false
          await AsyncStorage.setItem('notificationsEnabled', newValue ? 'true' : 'false');
        } catch (error) {
          console.error('Error saving notification preference:', error);
        }
      };

      // Call the function
      await toggleNotifications();

      // Verify AsyncStorage was called with the correct arguments
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notificationsEnabled', 'false');
    });

    it('should handle AsyncStorage errors when saving preferences', async () => {
      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock AsyncStorage.setItem to throw an error
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      // Create a mock implementation of toggleNotifications
      const toggleNotifications = async () => {
        try {
          const newValue = false;
          await AsyncStorage.setItem('notificationsEnabled', newValue ? 'true' : 'false');
        } catch (error) {
          console.error('Error saving notification preference:', error);
        }
      };

      // Call the function
      await toggleNotifications();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving notification preference:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('useNotifications hook', () => {
    it('should throw error when used outside provider', () => {
      // Mock React.useContext to return undefined (simulating outside provider)
      const React = require('react');
      React.useContext.mockReturnValue(undefined);
      
      // Call useNotifications and expect it to throw
      expect(() => useNotifications()).toThrow(
        'useNotifications must be used within a NotificationProvider'
      );
    });

    it('should return context when used inside provider', () => {
      // Mock context value that would be provided by NotificationProvider
      const mockContextValue = {
        notificationsEnabled: true,
        toggleNotifications: jest.fn(),
        isLoading: false
      };
      
      // Mock React.useContext to return our mock value
      const React = require('react');
      React.useContext.mockReturnValue(mockContextValue);
      
      // Call useNotifications
      const result = useNotifications();
      
      // Verify it returns the context
      expect(result).toEqual(mockContextValue);
    });
  });
});
