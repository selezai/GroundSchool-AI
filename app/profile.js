import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Linking,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';
import { useNotifications } from '../src/context/NotificationContext';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useNotifications();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
    profileSection: {
      alignItems: 'center',
      marginVertical: 20,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarText: {
      fontSize: 40,
      fontWeight: 'bold',
      color: colors.primary,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: colors.subText,
      marginBottom: 16,
    },
    createAccountButton: {
      backgroundColor: colors.accent,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    createAccountText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    settingsSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    supportSection: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    supportItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    supportItemText: {
      fontSize: 16,
      color: colors.text,
    },
    logoutButton: {
      marginBottom: 24,
    },
    versionText: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.subText,
      marginBottom: 20,
    },
    chevronIcon: {
      color: colors.subText,
    },
  });

  // Load user data and settings
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        
        // In a real app, we would load saved settings from storage
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  

  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // Clear auth token and user data
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              
              // Navigate to login screen
              router.replace('/auth/login');
              
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  // Styles were moved to the beginning of the component
  
  return (
    <SafeAreaView style={styles.container} testID="profile-screen">
      <AppHeader title="Profile & Settings" withBack={true} />
    
      <ScrollView contentContainerStyle={styles.content}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'G'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.userName}>
            {user?.name || 'Guest User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'guest@example.com'}
          </Text>
          
          <TouchableOpacity 
            style={styles.createAccountButton}
            onPress={() => router.push('/edit-profile')}
            testID="profile-edit-profile-btn"
          >
            <Text style={styles.createAccountText}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {/* Dark mode toggle removed - using static dark theme */}
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
              testID="profile-notifications-toggle"
            />
          </View>
        </View>
        
        {/* Legal Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity 
            style={styles.supportItem}
            testID="profile-privacy-policy-btn"
            onPress={() => router.push('/privacy-policy')}
          >
            <Text style={styles.supportItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} style={styles.chevronIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportItem}
            testID="profile-terms-of-service-btn"
            onPress={() => router.push('/terms-of-service')}
          >
            <Text style={styles.supportItemText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>
        
        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.supportItem}
            testID="profile-contact-support-btn"
            onPress={() => {
              Linking.openURL('mailto:groundschoolai@gmail.com')
                .catch(err => {
                  Alert.alert('Error', 'Could not open email client');
                });
            }}
          >
            <Text style={styles.supportItemText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>
        
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="large"
          style={styles.logoutButton}
          testID="profile-logout-btn"
        />
        
        <Text style={styles.versionText}>
          GroundSchool-AI v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}


