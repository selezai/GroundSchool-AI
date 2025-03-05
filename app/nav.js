import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom Tab Bar component
function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  
  // Define tab items with their routes and icons
  const tabItems = [
    { name: '(home)', route: '/', icon: 'home', activeIcon: 'home' },
    { name: 'recent-activity', route: '/recent-activity', icon: 'time-outline', activeIcon: 'time' },
    { name: 'upload', route: '/upload', icon: 'cloud-upload-outline', activeIcon: 'cloud-upload' },
    { name: 'profile', route: '/profile', icon: 'person-outline', activeIcon: 'person' },
  ];
  
  return (
    <View style={[
      styles.tabBarContainer, 
      { paddingBottom: Math.max(insets.bottom, 10) }
    ]}>
      {tabItems.map((item, index) => {
        const isFocused = pathname === item.route;
        
        const onPress = () => {
          navigation.navigate(item.name);
        };
        
        return (
          <TouchableOpacity
            key={item.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
            testID={`tab-${item.name}`}
          >
            <Ionicons
              name={isFocused ? item.activeIcon : item.icon}
              size={24}
              color={isFocused ? '#00FFCC' : '#FFFFFF'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  // Options for hiding the default tab bar
  const screenOptions = {
    headerShown: false,
    tabBarStyle: { display: 'none' },
  };
  
  return (
    <>
      <Tabs
        screenOptions={screenOptions}
        tabBar={props => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="recent-activity" />
        <Tabs.Screen name="upload" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 15, 36, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    height: 60,
    paddingTop: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
    // Add blur effect shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
