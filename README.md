# GroundSchool-AI

A comprehensive aviation study app that helps users prepare for aviation exams through AI-generated quizzes based on uploaded study materials.

## Features

- **Document Upload**: Upload aviation study materials in various formats
- **AI-Generated Quizzes**: DeepSeek API integration for generating relevant quiz questions
- **User Authentication**: Google, Apple, Email/Password, and Guest login options
- **Progress Tracking**: Track quiz performance and study time
- **Settings & Preferences**: Customize your learning experience
- **Crash Reporting**: Integrated Sentry for robust error tracking and diagnostics

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- A DeepSeek API key
- Supabase account
- Google/Apple developer accounts (for auth)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/groundschool-ai.git
   cd groundschool-ai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   
   # DeepSeek API
   DEEPSEEK_API_KEY=your_deepseek_api_key
   
   # Authentication
   GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
   ```

4. Configure app.json for authentication
   Update the `app.json` file with your actual Google credentials:
   - Replace `REPLACE_WITH_ACTUAL_CLIENT_ID` with your Google Client ID

5. Run the application
   ```
   npx expo start
   ```

## Production Setup

For a production-ready application, follow these additional steps:

1. Follow the detailed instructions in `AUTHENTICATION_SETUP.md` to configure Google and Apple authentication
2. Generate a production build for iOS and Android:
   ```
   eas build --platform ios
   eas build --platform android
   ```
3. Submit your app to the respective app stores

## Testing DeepSeek API Integration

The app includes a diagnostic tool to verify the DeepSeek API integration:

1. Navigate to Profile > DeepSeek API Diagnostics
2. Run the diagnostic tests to ensure proper API connectivity
3. View detailed logs of API interactions

For direct API testing, use the provided test script:

```
node scripts/test-deepseek-direct.js path/to/document.txt
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
