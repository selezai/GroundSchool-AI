module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated
      'react-native-reanimated/plugin',
      // Support for environment variables
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }]
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
