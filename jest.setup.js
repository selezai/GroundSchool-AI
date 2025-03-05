// Import Jest's globals first
const { expect } = require('@jest/globals');

// Import the testing libraries for setup
require('@testing-library/jest-native/extend-expect');

// Mock React Native components properly
jest.mock('react-native', () => {
  return {
    Platform: { OS: 'ios', select: jest.fn(obj => obj.ios) },
    NativeModules: {
      StatusBarManager: { getHeight: jest.fn() },
      RNGestureHandlerModule: { attachGestureHandler: jest.fn(), createGestureHandler: jest.fn(), dropGestureHandler: jest.fn() },
      SettingsManager: { settings: { AppleLocale: 'en_US' } }
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    },
    StyleSheet: {
      create: styles => styles,
    },
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    Image: 'Image',
    ScrollView: 'ScrollView',
    Animated: {
      View: 'Animated.View',
      createAnimatedComponent: jest.fn(component => component),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      Value: jest.fn(() => ({
        interpolate: jest.fn(),
        setValue: jest.fn(),
      })),
    },
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));
