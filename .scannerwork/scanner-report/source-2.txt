import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the notification context
const NotificationContext = createContext();

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Default to enabled
  const [isLoading, setIsLoading] = useState(true);

  // Load saved notification preference on mount
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('notificationsEnabled');
        if (savedPreference !== null) {
          setNotificationsEnabled(savedPreference === 'true');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading notification preference:', error);
        setIsLoading(false);
      }
    };

    loadNotificationPreference();
  }, []);

  // Toggle notifications function
  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem('notificationsEnabled', newValue ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notificationsEnabled, toggleNotifications, isLoading }}>
      {!isLoading && (typeof children === 'function' ? children({ notificationsEnabled, toggleNotifications }) : children)}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
