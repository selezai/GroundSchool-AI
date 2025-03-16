import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../store';
import AuthStack from './AuthStack';

// Import screens
import HomeScreen from '../src/screens/HomeScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import RecentActivityScreen from '../src/screens/RecentActivityScreen';
import UploadScreen from '../src/screens/UploadScreen';
import QuizScreen from '../src/screens/QuizScreen';
import QuizResultsScreen from '../src/screens/QuizResultsScreen';
import DiagnoseScreen from '../src/screens/DiagnoseScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const ActivityStack = createStackNavigator();

// Home stack navigator
const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#0A0F24',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <HomeStack.Screen 
      name="HomeScreen" 
      component={HomeScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="Upload" 
      component={UploadScreen} 
      options={{ title: 'Upload Study Material' }}
    />
    <HomeStack.Screen 
      name="Quiz" 
      component={QuizScreen} 
      options={{ 
        title: 'Quiz',
        headerLeft: null, // Prevent going back during quiz
      }}
    />
    <HomeStack.Screen 
      name="QuizResults" 
      component={QuizResultsScreen} 
      options={{ 
        title: 'Quiz Results',
        headerLeft: null, // Prevent going back from results
      }}
    />
  </HomeStack.Navigator>
);

// Profile stack navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#0A0F24',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ProfileStack.Screen 
      name="ProfileScreen" 
      component={ProfileScreen} 
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="DiagnoseScreen" 
      component={DiagnoseScreen} 
      options={{ title: 'DeepSeek API Diagnostics' }}
    />
  </ProfileStack.Navigator>
);

// Recent Activity stack navigator
const ActivityStackNavigator = () => (
  <ActivityStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#0A0F24',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ActivityStack.Screen 
      name="ActivityScreen" 
      component={RecentActivityScreen} 
      options={{ headerShown: false }}
    />
    <ActivityStack.Screen 
      name="QuizResults" 
      component={QuizResultsScreen} 
      options={{ title: 'Quiz Results' }}
    />
  </ActivityStack.Navigator>
);

// Main tab navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else if (route.name === 'Activity') {
          iconName = focused ? 'time' : 'time-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#00FFCC',
      tabBarInactiveTintColor: '#8896AB',
      tabBarStyle: {
        backgroundColor: '#0A0F24',
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 5,
        paddingTop: 5,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeStackNavigator} />
    <Tab.Screen name="Activity" component={ActivityStackNavigator} />
    <Tab.Screen name="Profile" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const { user } = useStore();

  return user ? <TabNavigator /> : <AuthStack />;
};

export default AppNavigator;
