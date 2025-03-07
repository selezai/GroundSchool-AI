import 'dotenv/config';

export default {
  name: 'GroundSchool-AI',
  slug: 'groundschool-ai',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0F24'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.groundschoolai.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0F24'
    },
    package: 'com.groundschoolai.app'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    apiBaseUrl: process.env.API_BASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY,
    eas: {
      projectId: 'your-project-id'
    }
  },
  plugins: [
    'expo-router'
  ]
};
