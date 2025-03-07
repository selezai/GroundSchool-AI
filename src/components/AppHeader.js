import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  Image,
  Alert,
  Pressable,
  Animated
} from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// We'll use the built-in navigation gestures instead of custom PanGestureHandler

const AppHeader = ({ title = 'GroundSchool-AI', withBack = false }) => {
  const navigation = useNavigation();
  
  // Enable swipe back gesture for screens with back buttons
  useEffect(() => {
    if (withBack && navigation) {
      // Configure the screen for gesture navigation
      navigation.setOptions({
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'default',
        animationEnabled: true,
        presentation: 'card',
        fullScreenGestureEnabled: true
      });
    }
  }, [withBack, navigation]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const slideAnim = useRef(new Animated.Value(-400)).current; // Start off-screen to the left
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  // Using a try-catch block to safely handle logo loading
  useEffect(() => {
    try {
      // This will ensure the logo path is valid
      const logoPath = require('../../assets/logo.png');
      console.log('Logo successfully required');
      setLogoLoaded(true);
    } catch (error) {
      console.error('Error loading logo:', error);
      setLogoLoaded(false);
    }
  }, []);
  
  const toggleMenu = () => {
    if (menuVisible) {
      // Animate slide out to the left
      Animated.timing(slideAnim, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setMenuVisible(false);
      });
    } else {
      // Show menu and animate slide in from the left
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };
  
  const navigateTo = (route) => {
    // Close menu first
    setMenuVisible(false);
    
    // Use requestAnimationFrame instead of setTimeout for more reliable timing
    requestAnimationFrame(() => {
      try {
        router.push(route);
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        setTimeout(() => router.push(route), 50);
      }
    });
  };
  
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
              setMenuVisible(false);
              
              // Use the correct path based on app structure
              router.replace('/');
              
              // Force reload to reset authentication state
              setTimeout(() => {
                router.setParams({reset: Date.now()});
              }, 100);
              
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleBack = () => {
    try {
      // Use router adapter for more consistent behavior
      if (typeof router.back === 'function') {
        router.back();
      } else if (typeof router.pop === 'function') {
        router.pop();
      } else {
        // Fallback to window history API if router methods fail
        if (window && window.history && typeof window.history.back === 'function') {
          window.history.back();
        } else {
          // Last resort: navigate to home
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error navigating back:', error);
      // Try to navigate to home as a fallback
      setTimeout(() => router.push('/'), 50);
    }
  };
  
  return (
    <>
      <View style={styles.header}>
        <View style={styles.leftContainer}>
          {withBack ? (
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.backButton}
              testID="header-back-button"
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={toggleMenu}
              style={styles.menuButton}
              testID="header-menu-button"
            >
              <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.titleContainer}>
          {/* Only show logo on home screen */}
          {(pathname === '/' || pathname === '/index') && (() => {
            try {
              // Attempt to load the logo
              return (
                <Image 
                  source={require('../../assets/logo.png')}
                  style={styles.headerLogo}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('Failed to load logo image:', error.nativeEvent.error);
                    setLogoLoaded(false);
                  }}
                  onLoad={() => {
                    console.log('Logo image loaded successfully on home screen');
                    setLogoLoaded(true);
                  }}
                />
              );
            } catch (error) {
              console.error('Error rendering logo:', error);
              return null;
            }
          })()}
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.rightContainer}>
          {/* Right side header content (if needed in the future) */}
        </View>
      </View>
      
      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="none" // Using our custom animation instead
        transparent={true}
        onRequestClose={toggleMenu}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={toggleMenu}
        >
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}>
            <View style={[styles.menuContent, { paddingTop: 0 }]}>
              {/* Menu Header */}
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Menu</Text>
                <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              {/* Navigation Items - With Logout */}
              <View style={styles.navigationGroup}>
                {/* Home */}
                <TouchableOpacity 
                  style={[styles.navItem, pathname === '/' && styles.activeMenuItem]}
                  onPress={() => navigateTo('/')}
                  activeOpacity={0.7}
                >
                  <Ionicons name={pathname === '/' ? "home" : "home-outline"} size={24} color={pathname === '/' ? "#00FFCC" : "#FFFFFF"} />
                  <Text style={[styles.navItemText, pathname === '/' && styles.activeMenuItemText]}>Home</Text>
                </TouchableOpacity>
                
                {/* Profile & Settings */}
                <TouchableOpacity 
                  style={[styles.navItem, pathname === '/profile' && styles.activeMenuItem]}
                  onPress={() => navigateTo('/profile')}
                  activeOpacity={0.7}
                >
                  <Ionicons name={pathname === '/profile' ? "person" : "person-outline"} size={24} color={pathname === '/profile' ? "#00FFCC" : "#FFFFFF"} />
                  <Text style={[styles.navItemText, pathname === '/profile' && styles.activeMenuItemText]}>Profile & Settings</Text>
                </TouchableOpacity>
                
                {/* Recent Activity */}
                <TouchableOpacity 
                  style={[styles.navItem, pathname === '/recent-activity' && styles.activeMenuItem]}
                  onPress={() => navigateTo('/recent-activity')}
                  activeOpacity={0.7}
                >
                  <Ionicons name={pathname === '/recent-activity' ? "time" : "time-outline"} size={24} color={pathname === '/recent-activity' ? "#00FFCC" : "#FFFFFF"} />
                  <Text style={[styles.navItemText, pathname === '/recent-activity' && styles.activeMenuItemText]}>Recent Activity</Text>
                </TouchableOpacity>
                
                {/* Logout - Now part of main navigation */}
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
              
              {/* Footer Info */}
              <View style={styles.menuFooter}>
                <Text style={styles.footerText}>GroundSchool-AI v1.0</Text>
                <Text style={styles.contactText}>groundschoolai@gmail.com</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    backgroundColor: '#0A0F24',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
    opacity: 1, // Ensuring full opacity
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  backButton: {
    marginRight: 8,
  },
  menuButton: {
    paddingHorizontal: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 0,
  },
  rightContainer: {
    width: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: '80%',
    maxWidth: 360,
    height: '100%',
    backgroundColor: '#0A0F24',
    shadowColor: "#000",
    shadowOffset: {
      width: 5,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 20,
    overflow: 'hidden', // Prevent content from overflowing
  },
  menuContent: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#0A0F24',
    paddingTop: 0,
  },

  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40, // Ensure space for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  logo: {
    width: 170,
    height: 68,
  },
  closeButton: {
    padding: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navigationGroup: {
    marginTop: 0,
    paddingTop: 0,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 0,
  },
  navItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 16,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#00FFCC',
  },
  activeMenuItemText: {
    color: '#00FFCC',
    fontWeight: '500',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 50, 50, 0.1)',
    marginTop: 12,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginLeft: 16,
  },
  menuFooter: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    marginTop: 24,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  footerText: {
    color: '#FFFFFF',
    opacity: 0.5,
    fontSize: 12,
    textAlign: 'center',
  },
  contactText: {
    color: '#FFFFFF',
    opacity: 0.5,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AppHeader;
