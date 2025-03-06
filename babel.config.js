module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // React Native Reanimated plugin must come last
      'react-native-reanimated/plugin'
    ],
    env: {
      test: {
        plugins: ['@babel/plugin-transform-runtime']
      },
      production: {
        // Optimization for production builds
        plugins: ['transform-remove-console']
      }
    }
  };
};
