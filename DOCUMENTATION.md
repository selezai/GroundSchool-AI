# GroundSchool-AI Project Documentation

This document maintains a record of key decisions, implementation details, and architecture choices for the GroundSchool-AI project.

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Testing Strategy](#testing-strategy)
- [Key Components](#key-components)
- [Development History](#development-history)

## Project Overview
GroundSchool-AI is an AI-powered aviation study app for pilots preparing for SACAA exams. The application provides interactive question-answer sessions, progress tracking, and personalized study recommendations.

## Tech Stack
- **Framework**: React Native with Expo
- **State Management**: Zustand
- **Styling**: StyleSheet (React Native built-in)
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **API Communication**: Axios
- **Icons**: Expo Vector Icons

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

## Development History

### March 5, 2025 (Evening): Dependency and Environment Fixes
- Updated package.json to use Expo SDK 47 which is compatible with Node.js v16
- Fixed dependency version conflicts and vulnerabilities using npm audit fix
- Corrected store import in ProfileScreen.js (changed from named import to default import)
- Ensured consistent store imports across all components
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
