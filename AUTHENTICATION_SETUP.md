# Authentication Setup Guide

This document outlines the steps required to configure authentication for the GroundSchool-AI application in a production environment.

## Overview

The app supports the following authentication methods:
- Google Sign-In
- Apple Sign-In (iOS only)
- Email/Password
- Guest Login

## Prerequisites

Before setting up authentication, ensure you have:
- A Google Cloud Platform account (for Google Sign-In)
- An Apple Developer account (for Apple Sign-In)
- A Supabase account and project set up

## Google Authentication Setup

1. **Create a Google Cloud Platform (GCP) Project**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Configure the consent screen (External or Internal)
   - Add necessary scopes (email, profile)

2. **Create OAuth Credentials**:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select application type "iOS" for iOS app
   - Enter your Bundle ID (com.groundschoolai.app)
   - For Android, create another OAuth client ID with application type "Android"
   - Enter your package name and SHA-1 certificate fingerprint

3. **Update app.json**:
   - Replace `GOOGLE_CLIENT_ID` in the reservedClientId field with your actual Google Client ID
   ```json
   "config": {
     "googleSignIn": {
       "reservedClientId": "com.googleusercontent.apps.YOUR_ACTUAL_CLIENT_ID"
     }
   }
   ```

4. **Update Environment Variables**:
   - Add your web client ID to the environment variables (for Expo auth session):
   ```
   GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   ```

## Apple Authentication Setup

1. **Register an App ID**:
   - Go to the [Apple Developer Portal](https://developer.apple.com/)
   - Navigate to "Certificates, IDs & Profiles"
   - Select "Identifiers" and register a new App ID if needed
   - Enable "Sign In with Apple" capability

2. **Create a Service ID**:
   - Still in "Identifiers", create a new "Services ID"
   - Enable "Sign In with Apple" capability
   - Configure the domain and return URL for your app
   - Domain should be your app's domain or a Supabase URL
   - Return URL should match your app's URL scheme (groundschoolai://)

3. **Generate Private Key**:
   - In the Apple Developer Portal, go to "Keys"
   - Create a new key with "Sign In with Apple" enabled
   - Download the private key and save it securely
   - Note the Key ID for configuration

4. **Update Environment Variables**:
   - For Supabase Apple Auth:
   ```
   APPLE_TEAM_ID=your-team-id
   APPLE_KEY_ID=your-key-id
   APPLE_PRIVATE_KEY=path-to-private-key-file
   ```

## Supabase Configuration

1. **Enable Auth Providers**:
   - Go to your Supabase project dashboard
   - Navigate to "Authentication" > "Providers"
   - Enable Google and Apple providers
   - For Google: Add your Google Client ID and Secret
   - For Apple: Add your Service ID, Team ID, Key ID, and Private Key

2. **Configure Redirect URLs**:
   - In Supabase Auth settings, add redirect URLs:
   - For web: `https://your-app-domain/auth/callback`
   - For mobile: `io.supabase.groundschoolai://auth-callback` and `groundschoolai://`

3. **Update Environment Variables**:
   - Ensure Supabase URL and Key are in your environment:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-key
   ```

## Testing Authentication

After configuration, use the built-in diagnostic tools to verify your setup:

1. **Profile > DeepSeek API Diagnostics**:
   - This screen allows you to test API key validity
   - Run API key checks and direct API tests
   - Verify document processing for question generation
   
2. **Authentication Testing**:
   - Try logging in with each method (Google, Apple, Email)
   - Verify that tokens are stored correctly
   - Test token refresh and session persistence

## Troubleshooting

### Common Issues:

1. **Google Sign-In Fails**:
   - Verify OAuth credentials match your app's bundle ID/package name
   - Check SHA-1 fingerprint for Android
   - Verify redirect URI configuration

2. **Apple Sign-In Fails**:
   - Check Service ID and redirect URI configuration
   - Verify private key is valid and not expired
   - Make sure Sign in with Apple capability is enabled

3. **API Integration Issues**:
   - Use the DeepSeek API Diagnostics tool to check for errors
   - Verify API keys are correctly set in environment variables
   - Check network connectivity and request/response logs

### Support Resources:

- [Google Identity Documentation](https://developers.google.com/identity/sign-in/ios)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Supabase Authentication Docs](https://supabase.com/docs/guides/auth)
- [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
