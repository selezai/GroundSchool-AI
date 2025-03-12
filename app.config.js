// This is the recommended approach to work with both app.json and app.config.js in Expo SDK 52
import 'dotenv/config';

// The function will receive the base config from app.json as 'config' parameter
export default ({ config }) => {
  // Determine the environment
  const environment = process.env.ENVIRONMENT || 'development';
  console.log(`Building for environment: ${environment}`);
  
  // Start with the base config from app.json
  return {
    ...config,  // This ensures all values from app.json are included
    
    // Keep key properties from app.json
    name: config.name,
    slug: config.slug,
    version: config.version,
    
    // Ensure we preserve all config structures
    ios: config.ios,
    android: config.android,
    web: config.web,
    plugins: config.plugins,
    
    // Note: Hooks are defined in app.json or as plugins
    // We're not using Sentry in this project yet
    
    // Add environment-specific variables to extra
    extra: {
      // Include existing extra values from app.json if any
      ...(config.extra || {}),
      
      // Add environment indicator
      environment,
      
      // Add our environment variables
      apiBaseUrl: process.env.API_BASE_URL || "https://jqkzgtytsaphudyidcxk.supabase.co/rest/v1",
      supabaseUrl: process.env.SUPABASE_URL || "https://jqkzgtytsaphudyidcxk.supabase.co",
      supabaseKey: process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3pndHl0c2FwaHVkeWlkY3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNjIyNTcsImV4cCI6MjA1NjkzODI1N30.dr2SAy2P4JqPdQ8WpOexz57kIYS-B2eYO2mApzelcio",
      claudeApiKey: process.env.CLAUDE_API_KEY,
      
      // Set build-specific flags
      isProductionBuild: environment === 'production',
      isPreviewBuild: environment === 'preview',
      isDevelopmentBuild: environment === 'development',
      isExpoGo: false, // Will be true only in Expo Go
    }
  };
};

