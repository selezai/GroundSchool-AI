import React from 'react';
import { View, StyleSheet, Text, Alert, Pressable, ScrollView } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Slot, router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator();

// Completely custom drawer content implementation
function CustomDrawerContent(props) {
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
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

  // Manual route detection for highlighting the active route
  const getActiveRouteName = () => {
    if (props.state && props.state.routes && props.state.index >= 0) {
      return props.state.routes[props.state.index].name;
    }
    return 'home';
  };

  const activeRoute = getActiveRouteName();

  // Render direct to the screen with absolutely no margin
  return (
    <View style={{ flex: 1, paddingTop: 0, marginTop: 0 }}>
      {/* HEADER - hard-coded with no margins, directly at top */}
      <View style={{
        backgroundColor: '#0A0F24',
        padding: 16,
        paddingTop: 0,
        marginTop: 0,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 10
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFFFFF',
          marginBottom: 4,
        }}>GroundSchool-AI</Text>
        <Text style={{
          fontSize: 14,
          color: '#FFFFFF',
          opacity: 0.7,
          textAlign: 'center',
        }}>AI-powered aviation study app for pilots</Text>
      </View>
      
      {/* MENU ITEMS - directly below header with no space */}
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: activeRoute === 'home' ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderLeftWidth: activeRoute === 'home' ? 3 : 0,
          borderLeftColor: '#00FFCC',
        }}
        onPress={() => props.navigation.navigate('home')}
      >
        <Ionicons 
          name="home-outline" 
          size={24} 
          color={activeRoute === 'home' ? '#00FFCC' : '#FFFFFF'} 
        />
        <Text style={{
          color: activeRoute === 'home' ? '#00FFCC' : '#FFFFFF',
          fontWeight: activeRoute === 'home' ? 'bold' : 'normal',
          fontSize: 16,
          marginLeft: 32,
        }}>Home</Text>
      </Pressable>
      
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: activeRoute === 'profile' ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderLeftWidth: activeRoute === 'profile' ? 3 : 0,
          borderLeftColor: '#00FFCC',
        }}
        onPress={() => props.navigation.navigate('profile')}
      >
        <Ionicons 
          name="person-outline" 
          size={24} 
          color={activeRoute === 'profile' ? '#00FFCC' : '#FFFFFF'} 
        />
        <Text style={{
          color: activeRoute === 'profile' ? '#00FFCC' : '#FFFFFF',
          fontWeight: activeRoute === 'profile' ? 'bold' : 'normal',
          fontSize: 16,
          marginLeft: 32,
        }}>Profile</Text>
      </Pressable>
      
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: activeRoute === 'recent-activity' ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderLeftWidth: activeRoute === 'recent-activity' ? 3 : 0,
          borderLeftColor: '#00FFCC',
        }}
        onPress={() => props.navigation.navigate('recent-activity')}
      >
        <Ionicons 
          name="time-outline" 
          size={24} 
          color={activeRoute === 'recent-activity' ? '#00FFCC' : '#FFFFFF'} 
        />
        <Text style={{
          color: activeRoute === 'recent-activity' ? '#00FFCC' : '#FFFFFF',
          fontWeight: activeRoute === 'recent-activity' ? 'bold' : 'normal',
          fontSize: 16,
          marginLeft: 32,
        }}>Recent Activity</Text>
      </Pressable>
      
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16,
          marginLeft: 32,
        }}>Logout</Text>
      </Pressable>
      
      {/* FOOTER */}
      <View style={{
        marginTop: 'auto',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
      }}>
        <Text style={{
          color: '#FFFFFF',
          opacity: 0.5,
          fontSize: 12,
          textAlign: 'center',
        }}>GroundSchool-AI v1.0</Text>
        <Text style={{
          color: '#FFFFFF',
          opacity: 0.5,
          fontSize: 12,
          textAlign: 'center',
          marginTop: 4,
        }}>groundschoolai@gmail.com</Text>
      </View>
    </View>
  );
}

// Extracted MenuItem component for cleaner code
function MenuItem({ label, icon, isActive = false, onPress }) {
  return (
    <Pressable
      style={({pressed}) => [
        styles.menuItem,
        isActive && styles.activeMenuItem,
        pressed && styles.pressedMenuItem
      ]}
      onPress={onPress}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={isActive ? '#00FFCC' : '#FFFFFF'} 
      />
      <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Header component with menu button
function HeaderLeft() {
  const navigation = useNavigation();
  
  return (
    <Pressable
      onPress={() => navigation.openDrawer()}
      style={{ marginLeft: 16 }}
    >
      <Ionicons 
        name="menu-outline" 
        size={24} 
        color="#FFFFFF"
      />
    </Pressable>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0A0F24',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        drawerStyle: {
          backgroundColor: '#0A0F24',
          width: 280,
          padding: 0,
          margin: 0,
          paddingTop: 0,
          marginTop: 0,
        },
        // These options override React Navigation's default container styling
        drawerContentOptions: {
          contentContainerStyle: {
            padding: 0,
            margin: 0,
            paddingTop: 0,
            marginTop: 0,
          },
        },
        // Forcing zero spacing everywhere
        sceneContainerStyle: {
          padding: 0,
          margin: 0,
          paddingTop: 0,
          marginTop: 0,
        },
        drawerContentStyle: {
          paddingTop: 0,
          marginTop: 0,
        },
        headerLeft: ({ tintColor }) => {
          const navigation = useNavigation();
          return (
            <Pressable
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 16 }}
            >
              <Ionicons 
                name="menu-outline" 
                size={24} 
                color={tintColor}
              />
            </Pressable>
          );
        },
      }}
    >
      {/* Use a single screen with a Slot to let Expo Router handle the actual screens */}
      <Drawer.Screen
        name="home"
        options={{
          title: 'GroundSchool-AI',
        }}
      >
        {() => <Slot />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  /* No longer using StyleSheet styles as we've switched to inline styles in the component */
});
