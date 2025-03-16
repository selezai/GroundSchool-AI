// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

// Get the default Metro configuration
const config = getDefaultConfig(__dirname);

// Export the modified configuration
module.exports = config;
