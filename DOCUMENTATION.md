# GroundSchool-AI Project Documentation

This document maintains a record of key decisions, implementation details, and architecture choices for the GroundSchool-AI project.

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Testing Strategy](#testing-strategy)
- [Key Components](#key-components)
- [Development History](#development-history)

## Project Overview
GroundSchool-AI is an AI-powered aviation study app for pilots preparing for SACAA exams. The application provides interactive question-answer sessions, progress tracking, and personalized study recommendations.

## Tech Stack
- **Framework**: React Native with Expo SDK 52
- **State Management**: Zustand
- **Styling**: StyleSheet (React Native built-in)
- **Navigation**: Expo Router v4
- **Storage**: AsyncStorage
- **API Communication**: Axios
- **Icons**: Expo Vector Icons
- **Node.js**: v18.20.7
- **npm**: v10.8.2

## Testing Strategy
### Setup (Updated March 4, 2025)
- **Testing Framework**: Jest (v29.2.1) with Jest-Expo (v49.0.0)
- **Testing Libraries**: 
  - react-test-renderer (v18.2.0)
  - @testing-library/react-native (v12.3.0) 
  - @testing-library/jest-native (v5.4.2)

### Approach
- **Component Testing**: Primarily using react-test-renderer for consistent results
- **Mock Strategy**: Simplified component mocking in jest.setup.js
- **Test Patterns**:
  - Snapshot testing for UI verification
  - Interaction testing using renderer.root.findByProps
  - State change testing using act()

### Key Decisions for Testing (March 4, 2025)
1. **Mock Implementation**: 
   - Simplified React Native component mocks to avoid issues with complex element creation
   - Used string-based component mocks instead of function-based mocks to improve reliability

2. **Renderer Choice**:
   - Selected react-test-renderer over @testing-library/react-native for more consistent results
   - This approach avoids issues with the testing library's internal implementation details

3. **Test Structure**:
   - Component rendering tests focus on structure verification
   - Interaction tests use the component tree to find elements by props (especially testID)
   - Each component has dedicated test files with focused, atomic test cases

4. **Mocked Native Modules**:
   - StatusBarManager
   - RNGestureHandlerModule
   - SettingsManager
   - Dimensions

## Key Components
- **Input**: Customizable text input with label, error state, and password visibility toggle
- **Button**: Enhanced button with multiple variants (primary, secondary, outline, danger), sizes (small, medium, large), and support for disabled state and custom styling
- **AnswerOption**: Interactive option for quiz questions with different visual states
- **QuestionCard**: Card displaying a question with answer options
- **ProgressBar**: Visual indicator of progress through a quiz or course
- **ScoreDisplay**: Component showing quiz results and statistics

## Architecture

### Routing Structure
The application uses Expo Router v3, which implements file-based routing similar to Next.js:

```
app/
├─ _layout.js         # Root layout with initialization and authentication check
├─ index.js           # Home screen (dashboard)
├─ upload.js          # Document upload screen
├─ quiz.js            # Quiz screen
├─ quiz-results.js    # Quiz results screen
├─ recent-activity.js # Recent activity history screen
├─ profile.js         # User profile and settings screen
├─ auth/
│  ├─ _layout.js      # Authentication layout
│  ├─ login.js        # Login screen
│  └─ signup.js       # Registration screen
```

### Authentication Flow
- Users can log in with email/password or as a guest
- Authentication state is stored in AsyncStorage
- Protected routes redirect unauthenticated users to login
- Token-based authentication with JWT implementation

### Theme System
- Dark mode by default with aviation-inspired colors
- Primary color palette:
  - Background: Navy blue (#0A0F24)
  - Accent color: Neon blue-green (#00FFCC)
  - Text: White (#FFFFFF) and light gray (#E2E8F0)
  - UI elements: Various opacity levels of white

### State Management
- Local component state for UI interactions
- Zustand for global application state
- AsyncStorage for persistent data

## Development History

### March 6, 2025: Expo SDK 52 Migration
- Migrated project from older Expo SDK to the latest SDK 52
- Updated package.json with latest dependencies and configurations
- Implemented new Expo Router v3 navigation system
- Created a new file-based routing structure
- Updated app.json with Expo 52 configuration
- Key tasks completed:
  - Created root layout with authentication flow
  - Implemented new auth screens (login, signup)
  - Migrated and enhanced existing screens
  - Added new screens: recent activity, profile
  - Maintained dark mode theme and branding
  - Implemented comprehensive error handling

### March 5, 2025 (Evening): Dependency and Environment Fixes
- Updated package.json to use Expo SDK 47 which is compatible with Node.js v16
- Fixed dependency version conflicts and vulnerabilities using npm audit fix
- Corrected store import in ProfileScreen.js (changed from named import to default import)
- Ensured consistent store imports across all components

### March 5, 2025 (Late Evening): Incremental Migration to Expo SDK 49
- Created migration plan with incremental SDK version upgrades (47 → 49 → 51 → 52)
- Updated package.json dependencies to Expo SDK 49 compatibility
- Modified app/_layout.js to be compatible with Expo Router v2
- Created router-adapter.js to maintain consistent navigation API across router versions
- Utilized a clean installation approach with removal of node_modules and package-lock.json
- Successfully launched development server with Expo SDK 49
- Updated babel.config.js for Expo Router v2 compatibility
- Created verification and development utility scripts
- Fixed react-native version to match recommended 0.72.10 for SDK 49

### March 5, 2025 (Late Evening): Incremental Migration to Expo SDK 51
- Updated package.json dependencies to Expo SDK 51 compatibility
- Enhanced router-adapter.js to support Expo Router v3 features
- Updated app/_layout.js to use Slot component from Expo Router v3
- Modified navigation structure in nav.js for Router v3 compatibility
- Added screenOptions for proper navigation configuration
- Updated app.json to target SDK 51
- Updated React Native from 0.72.10 to 0.73.2

### March 5, 2025 (Late Evening): Final Migration to Expo SDK 52
- Updated package.json dependencies to Expo SDK 52
- Updated app.json to target SDK 52
- Enhanced router-adapter.js to support Expo Router v4
- Updated babel.config.js for Expo Router v4 compatibility
- Updated React Native from 0.73.2 to 0.74.5
- Upgraded Node.js from v16.20.2 to v18.20.7 for SDK 52 compatibility
- Added .nvmrc file to enforce project-specific Node.js version
- Created compatibility scripts for dependency and Node.js version verification
- Successfully ran the application with SDK 52

### March 6, 2025 (Morning): Expo Router v4 Fixes
- Fixed router-adapter.js to properly work with Expo Router v4
- Removed incorrect import for Slot from 'expo-router/layouts'
- Updated Auth component in _layout.js to use Slot directly from expo-router
- Removed deprecated 'expo-router/babel' plugin from babel.config.js
- Fixed empty upload-icon.png file issue
- Added explicit 'newArchEnabled: true' to app.json to support React Native's New Architecture
- Successfully ran the application with the Expo development server
- Fixed compatibility issues between React Native, Expo, and Node.js versions

### March 5, 2025 (Afternoon): Logo Integration
- Replaced text title headers with the app logo in multiple screens:
  - LoginScreen: Added logo to the top of the authentication form
  - SignupScreen: Added logo above the registration form
  - HomeScreen: Replaced text header with logo in the main app screen
- Applied consistent styling for the logo across all screens
- Maintained proper aspect ratio with resizeMode="contain"
- Ensured appropriate spacing and layout around the logo

### March 5, 2025: Full Application Structure Implementation
- Implemented comprehensive navigation system with tab and stack navigators
- Created the following new screens:
  - HomeScreen: Central hub for accessing app features
  - ProfileScreen: User profile, statistics, and settings
  - RecentActivityScreen: Tracking past quiz attempts and uploads
  - UploadScreen: Material upload and AI-powered question generation
  - LoginScreen: User authentication with email/password
  - SignupScreen: New user registration
  - QuizResultsScreen: Detailed quiz outcome analysis and review
- Added authentication flow with user session persistence
- Implemented material upload functionality with mock processing
- Added dark theme with aviation-inspired color scheme
- Completed file upload and processing UI with error handling
- Implemented comprehensive profile screen with statistics and settings

### March 5, 2025 (Morning): Component and Feature Updates
- Enhanced the Button component with multiple variants, sizes, and improved styling
- Removed the Timer component from the QuizScreen as timed quizzes are no longer required
- Updated the AI provider from DeepSeek R1 to Claude (free version) for question generation
- Updated test files to match component changes

### March 5, 2025 (Afternoon): Dependency and Environment Fixes
- Updated package.json to use Expo SDK 47 (compatible with Node.js v16)
- Fixed store import inconsistency in ProfileScreen.js
- Resolved npm audit vulnerabilities
- Standardized import statements for store
- Ensured compatibility between React Native packages
- Created app.json configuration file to fix manifest parsing issues
- Added required asset files for Expo (icon.png, splash.png, etc.)
- Fixed "Failed to parse manifest JSON" error in Expo Go app

### March 4, 2025: Testing Configuration Update
- Fixed React Native component mocking in jest.setup.js
- Simplified test approach using react-test-renderer
- Updated component tests to use tree traversal for assertions
- Fixed issues with module mocking for React Native components
- Successfully enabled all 38 tests across 10 test suites to pass

### Initial Setup
- Configured basic React Native project with Expo
- Set up navigation structure
- Implemented core UI components
- Added initial Jest configuration
