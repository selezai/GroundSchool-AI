// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Metro configuration
const config = getDefaultConfig(__dirname);

// Add support for importing SVG files
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Add support for expo-router
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-router': require.resolve('expo-router'),
};

// Export the modified configuration
module.exports = config;
