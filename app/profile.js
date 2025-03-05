import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../src/components/Button';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    soundEffects: true,
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
  
  // Handle setting toggle
  const handleToggleSetting = (key) => {
    setSettings({
      ...settings,
      [key]: !settings[key]
    });
    
    // In a real app, we would save this to storage/server
  };
  
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFCC" />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} testID="profile-screen">
      <Stack.Screen 
        options={{
          title: 'Profile & Settings',
        }} 
      />
    
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
          
          {user?.isGuest && (
            <TouchableOpacity 
              style={styles.createAccountButton}
              onPress={() => router.push('/auth/signup')}
              testID="profile-create-account-btn"
            >
              <Text style={styles.createAccountText}>
                Create a Full Account
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={settings.darkMode}
              onValueChange={() => handleToggleSetting('darkMode')}
              trackColor={{ false: '#767577', true: 'rgba(0, 255, 204, 0.3)' }}
              thumbColor={settings.darkMode ? '#00FFCC' : '#f4f3f4'}
              testID="profile-dark-mode-toggle"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={settings.notifications}
              onValueChange={() => handleToggleSetting('notifications')}
              trackColor={{ false: '#767577', true: 'rgba(0, 255, 204, 0.3)' }}
              thumbColor={settings.notifications ? '#00FFCC' : '#f4f3f4'}
              testID="profile-notifications-toggle"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Switch
              value={settings.soundEffects}
              onValueChange={() => handleToggleSetting('soundEffects')}
              trackColor={{ false: '#767577', true: 'rgba(0, 255, 204, 0.3)' }}
              thumbColor={settings.soundEffects ? '#00FFCC' : '#f4f3f4'}
              testID="profile-sound-toggle"
            />
          </View>
        </View>
        
        {/* Account Section */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.accountItem}
            testID="profile-edit-profile-btn"
          >
            <Text style={styles.accountItemText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.accountItem}
            testID="profile-change-password-btn"
          >
            <Text style={styles.accountItemText}>Change Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.accountItem}
            testID="profile-delete-account-btn"
          >
            <Text style={styles.accountItemText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.supportItem}
            testID="profile-contact-support-btn"
          >
            <Text style={styles.supportItemText}>Contact Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportItem}
            testID="profile-faq-btn"
          >
            <Text style={styles.supportItemText}>FAQ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportItem}
            testID="profile-privacy-policy-btn"
          >
            <Text style={styles.supportItemText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportItem}
            testID="profile-terms-btn"
          >
            <Text style={styles.supportItemText}>Terms of Service</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
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
    backgroundColor: 'rgba(0, 255, 204, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFCC',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#00FFCC',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 16,
  },
  createAccountButton: {
    backgroundColor: 'rgba(0, 255, 204, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FFCC',
  },
  createAccountText: {
    color: '#00FFCC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  accountSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  accountItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  supportSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  supportItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  supportItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  logoutButton: {
    marginBottom: 24,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8896AB',
    marginBottom: 20,
  },
});
