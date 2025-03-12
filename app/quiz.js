import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import QuestionCard from '../src/components/QuestionCard';
import ProgressBar from '../src/components/ProgressBar';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';
import { quizService } from '../src/services';

// Questions will be fetched from the API
export default function QuizScreen() {
  // Get URL parameters using useLocalSearchParams instead of route.params
  const params = useLocalSearchParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Get parameters from URL using useLocalSearchParams
  const initialQuizId = params.quizId;
  const documentTitle = params.documentTitle || '';
  const isExpoGoSimulation = params.isExpoGoSimulation === 'true';
  
  // Convert quizId to state so React can track and update it properly
  const [quizId, setQuizId] = useState(initialQuizId);
  const { colors, isDarkMode } = useTheme();
  
  // Add debug logging for quizId
  console.log('DEBUG: Initial quizId from route params:', quizId);
  
  // Define a UUID regex pattern that follows PostgreSQL's strict format (exactly 12 chars in last segment)
  const UUID_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  
  // Validation function for checking if a string is a valid PostgreSQL UUID
  const isValidUuid = (str) => UUID_REGEX.test(str);
  
  // Helper function to extract UUID from a string and update state
  const extractAndSetUuid = (inputId) => {
    if (!inputId) return;
    
    // Log the input ID for debugging
    console.log(`🔎 Attempting to extract UUID from: '${inputId}'`);
    
    // Manual extraction since regex might have issues with certain string formats
    if (inputId.includes('-')) {
      // Try different extraction methods
      
      // Method 1: Use regex with careful extraction
      const match = inputId.match(UUID_REGEX);
      if (match && match[1] && isValidUuid(match[1])) { // Use our improved validation
        const extractedUuid = match[1];
        console.log(`✅ Valid UUID extracted: '${extractedUuid}'`);
        setQuizId(extractedUuid);
        return true;
      }
      
      // Method 2: Manual extraction for any UUID-like format
      const parts = inputId.split('-');
      if (parts.length >= 5) {
          // Extract just the timestamp part (12 chars) or use what we have if shorter
          const lastPart = parts[4].includes('quiz') 
            ? parts[4].split('quiz')[0]  // Remove 'quiz' and anything after
            : parts[4];
          
          // Make sure we're getting the complete last part without truncation
          // No artificial length restriction on the last segment
          const reconstructedUuid = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${lastPart}`;
          
          // Enhanced UUID validation using our isValidUuid function
          if (isValidUuid(reconstructedUuid)) {
            console.log(`🛠️ Manually reconstructed UUID: '${reconstructedUuid}'`);
            setQuizId(reconstructedUuid);
            return true;
          } else {
            console.warn(`⚠️ Reconstructed UUID failed validation: '${reconstructedUuid}'`);
            
            // Generate a proper RFC4122 v4 UUID that PostgreSQL will accept
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
            console.log(`🔄 Generated valid PostgreSQL UUID: ${uuid}`);
            setQuizId(uuid);
            return true;
          }
      }
    }
    
    console.log(`⚠️ No valid UUID found in: '${inputId}'`);
    return false;
  };
  
  // Create a stable fallback quizId for Expo Go - runs only once
  useEffect(() => {
    // Log the raw params for debugging
    console.log('Raw URL params:', params);
    
    if (quizId) {
      // First attempt: Remove known suffixes with a single regex
      if (/-quiz|_quiz|quiz$/i.test(quizId)) {
        const cleanId = quizId.trim().replace(/(-quiz|_quiz|quiz)$/i, '');
        console.log(`🧹 Removed quiz suffix in component: ${quizId} → ${cleanId}`);
        
        // If the cleaned ID is a valid UUID, use it
        if (UUID_REGEX.test(cleanId)) {
          setQuizId(cleanId);
        } else {
          // Try to extract a UUID from anywhere in the string
          extractAndSetUuid(quizId);
        }
      } 
      // If no suffix but might contain a UUID somewhere
      else if (quizId.includes('-')) {
        extractAndSetUuid(quizId);
      }
    }
    // Create a fallback quizId for Expo Go if needed
    else if ((!quizId || quizId === 'undefined') && isExpoGoSimulation) {
      const fallbackId = `expo-go-${new Date().getTime()}`;
      console.log('🚨 Creating fallback quizId for Expo Go:', fallbackId);
      setQuizId(fallbackId); // Properly update state
    }
  }, [params, quizId, isExpoGoSimulation]); // Add dependencies to ensure it runs correctly
  
  // Add missing useEffect to load questions
  useEffect(() => {
    const loadQuizQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Handle Expo Go simulation mode
        if (isExpoGoSimulation) {
          console.log('Running in Expo Go simulation mode, generating mock questions');
          const mockQuestions = generateSimulatedQuestions(documentTitle);
          setQuestions(mockQuestions);
          setIsLoading(false);
          return;
        }
        
        // For production: Fetch questions from the API using quizService
        if (quizId) {
          console.log('Fetching quiz questions with ID:', quizId);
          try {
            const fetchedQuestions = await quizService.getQuizQuestions(quizId);
            
            if (fetchedQuestions && fetchedQuestions.length > 0) {
              console.log(`Successfully loaded ${fetchedQuestions.length} questions`);
              setQuestions(fetchedQuestions);
            } else {
              console.error('No questions returned from the server');
              setError('No questions available for this quiz. Please try another quiz.');
            }
          } catch (fetchError) {
            console.error('Error fetching questions:', fetchError);
            setError(`Failed to load questions: ${fetchError.message}`);
          }
        } else {
          console.error('Cannot load questions: Missing quiz ID');
          setError('Missing quiz ID. Please go back and try again.');
        }
      } catch (err) {
        console.error('Error loading quiz questions:', err);
        setError(`Failed to load questions: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuizQuestions();
  }, [quizId, isExpoGoSimulation, documentTitle]);
  
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionNum = currentQuestionIndex + 1;
  
  // Helper function to extract a topic from document title
  const extractTopicFromTitle = (title) => {
    if (!title) return 'aviation';
    
    // Convert to lowercase for easier matching
    const lowerTitle = title.toLowerCase();
    
    // Common aviation and pilot certification topics to detect
    const topicKeywords = {
      'aviation': ['aviation', 'pilot', 'flight', 'aircraft', 'airplane', 'helicopter'],
      'regulations': ['regulation', 'rules', 'law', 'compliance', 'sacaa', 'faa', 'easa'],
      'weather': ['weather', 'meteorology', 'cloud', 'wind', 'forecast'],
      'navigation': ['navigation', 'gps', 'vor', 'waypoint', 'chart', 'route'],
      'systems': ['system', 'engine', 'electrical', 'hydraulic', 'avionics', 'instrument'],
      'operations': ['operation', 'procedure', 'checklist', 'emergency', 'maneuver'],
      'aerodynamics': ['aerodynamic', 'lift', 'drag', 'airfoil', 'stall', 'performance'],
      'communications': ['communication', 'radio', 'phraseology', 'atc', 'transmission']
    };
    
    // Search for matches in the title
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return topic;
      }
    }
    
    // If no match, default to aviation
    return 'aviation';
  };
  
  // Generate higher quality simulated questions when running in Expo Go
  const generateSimulatedQuestions = (documentTitle = '') => {
    console.log('Generating high-quality simulated questions for Expo Go');
    
    // Extract a topic from the document title or use a default
    const topic = documentTitle ? extractTopicFromTitle(documentTitle) : 'aviation';
    
    // Create aviation-specific questions that feel more real
    return [
      {
        id: `sim-q-1`,
        questionText: `What is the primary purpose of ${topic === 'aviation' ? 'pre-flight inspections' : 'the ' + topic + ' process'}?`,
        questionNumber: 1,
        category: 'Operations',
        difficulty: 'Medium',
        options: [
          { text: `To ensure safety and airworthiness before flight`, isCorrect: true },
          { text: `To comply with logbook requirements only`, isCorrect: false },
          { text: `To verify fuel prices at the destination`, isCorrect: false },
          { text: `To clean the aircraft exterior`, isCorrect: false }
        ],
        correctAnswer: 0,
        reference: 'SACAA Operations Manual Sec. 3.2',
      },
      {
        id: `sim-q-2`,
        questionText: `According to ${topic} regulations, when must a pilot file a flight plan?`,
        questionNumber: 2,
        category: 'Regulations',
        difficulty: 'Medium',
        options: [
          { text: `Only for international flights`, isCorrect: false },
          { text: `For all IFR flights and certain VFR flights`, isCorrect: true },
          { text: `Only when carrying passengers`, isCorrect: false },
          { text: `Only during night operations`, isCorrect: false }
        ],
        correctAnswer: 1,
        reference: 'SACAA Flight Planning Guide 2023',
      },
      {
        id: `sim-q-3`,
        questionText: `What is the minimum visibility requirement for VFR flight in Class G airspace below 1,000 feet AGL?`,
        questionNumber: 3,
        category: 'Weather',
        difficulty: 'Hard',
        options: [
          { text: `1 statute mile`, isCorrect: false },
          { text: `3 statute miles`, isCorrect: false },
          { text: `5 kilometers`, isCorrect: true },
          { text: `8 kilometers`, isCorrect: false }
        ],
        correctAnswer: 2,
        reference: 'SACAA VFR Weather Minimums Table 3-1',
      },
      {
        id: `sim-q-4`,
        questionText: `Which of the following is a primary function of the flight controls in a standard aircraft?`,
        questionNumber: 4,
        category: 'Aircraft Systems',
        difficulty: 'Easy',
        options: [
          { text: `Managing the electrical system`, isCorrect: false },
          { text: `Controlling the aircraft's attitude and direction`, isCorrect: true },
          { text: `Regulating cabin pressure`, isCorrect: false },
          { text: `Monitoring engine temperature`, isCorrect: false }
        ],
        correctAnswer: 1,
        reference: 'SACAA Flight Controls Manual Ch. 2',
      },
      {
        id: `sim-q-5`,
        questionText: `What action should a pilot take if they encounter an area of severe turbulence?`,
        questionNumber: 5,
        category: 'Emergency Procedures',
        difficulty: 'Medium',
        options: [
          { text: `Increase airspeed to exit the area quickly`, isCorrect: false },
          { text: `Maintain attitude and reduce airspeed to maneuvering speed`, isCorrect: true },
          { text: `Make rapid control inputs to maintain altitude`, isCorrect: false },
          { text: `Turn off all navigation equipment`, isCorrect: false }
        ],
        correctAnswer: 1,
        reference: 'SACAA Adverse Weather Operations Guide',
      }
    ];
  };
  
  // Generate placeholder questions for when real questions aren't available
  const generatePlaceholderQuestions = (count = 5, quizTitle = '') => {
    console.log('Generating basic placeholder questions for quiz');
    const placeholders = [];
    for (let i = 0; i < count; i++) {
      placeholders.push({
        id: `placeholder-${i + 1}`,
        question: `Sample question ${i + 1} ${quizTitle ? `about ${quizTitle}` : ''}`,
        questionText: `Sample question ${i + 1} ${quizTitle ? `about ${quizTitle}` : ''}`,
        questionNumber: i + 1,
        category: 'General',
        difficulty: 'Medium',
        options: [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B', isCorrect: false },
          { text: 'Option C', isCorrect: false },
          { text: 'Option D', isCorrect: false }
        ],
        correctAnswer: 0,
        reference: '',
      });
    }
    return placeholders;
  };
  
  // Using the enhanced extractTopicFromTitle function defined above

  // Fetch questions from API when component mounts
  useEffect(() => {
    console.log('DEBUG: quizId at fetch time:', quizId);
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If it's a simulated quiz from Expo Go, use better placeholder questions
        if (isExpoGoSimulation) {
          console.log('Using Expo Go simulated quiz with document info:', documentTitle);
          const simulatedQuestions = generateSimulatedQuestions(documentTitle);
          setQuestions(simulatedQuestions);
          setIsLoading(false);
          return;
        }
        
        // If no quizId provided, create basic placeholder questions to avoid crashes
        if (!quizId) {
          console.log('No quizId provided, using basic placeholder questions');
          setQuestions(generatePlaceholderQuestions());
          setIsLoading(false);
          return;
        }

        // Safely fetch quiz data with a timeout to prevent hanging
        let quizData = null;
        try {
          const fetchPromise = quizService.getQuiz(quizId);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Quiz fetch timed out')), 10000)
          );
          quizData = await Promise.race([fetchPromise, timeoutPromise]);
        } catch (fetchError) {
          console.log('Error fetching quiz:', fetchError);
          setQuestions(generatePlaceholderQuestions());
          setIsLoading(false);
          return;
        }
        
        // Safely extract questions with multiple fallbacks
        let formattedQuestions = [];
        
        // Case 1: We have questions array in the expected format
        if (quizData && quizData.questions && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
          console.log('Found questions array in quiz data');
          formattedQuestions = quizData.questions.map((q, index) => ({
            id: q.id || `q-${index + 1}`,
            question: q.question || q.questionText || `Question ${index + 1}`,
            questionText: q.questionText || q.question || `Question ${index + 1}`,
            questionNumber: index + 1,
            category: q.category || 'General',
            difficulty: q.difficulty || 'Medium',
            options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : [
              { text: 'Option A', isCorrect: true },
              { text: 'Option B', isCorrect: false },
              { text: 'Option C', isCorrect: false },
              { text: 'Option D', isCorrect: false }
            ],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            reference: q.reference || '',
          }));
        } 
        // Case 2: We have questions in a nested property
        else if (quizData && quizData.quiz && quizData.quiz.questions && 
                Array.isArray(quizData.quiz.questions) && quizData.quiz.questions.length > 0) {
          console.log('Found questions in quiz.questions');
          formattedQuestions = quizData.quiz.questions.map((q, index) => ({
            id: q.id || `q-${index + 1}`,
            question: q.question || q.questionText || `Question ${index + 1}`,
            questionText: q.questionText || q.question || `Question ${index + 1}`,
            questionNumber: index + 1,
            category: q.category || 'General',
            difficulty: q.difficulty || 'Medium',
            options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : [
              { text: 'Option A', isCorrect: true },
              { text: 'Option B', isCorrect: false },
              { text: 'Option C', isCorrect: false },
              { text: 'Option D', isCorrect: false }
            ],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            reference: q.reference || '',
          }));
        }
        // Case 3: We have a quiz but need to create placeholder questions
        else if (quizData) {
          console.log('Creating placeholder questions for quiz');
          const quizTitle = quizData.title || (quizData.quiz && quizData.quiz.title) || '';
          formattedQuestions = generatePlaceholderQuestions(5, quizTitle);
        }
        // Case 4: Last resort fallback
        else {
          console.log('No quiz data found, using fallback questions');
          formattedQuestions = generatePlaceholderQuestions();
        }
        
        // Always ensure we have questions to display
        if (formattedQuestions.length === 0) {
          console.log('No questions generated, using last resort fallback');
          formattedQuestions = generatePlaceholderQuestions();
        }
        
        setQuestions(formattedQuestions);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError(err.message || 'Failed to load questions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Removed fetchQuestions() call as we now use the new loadQuizQuestions function
  }, [quizId]);
  
  // Define styles within the component to use theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    counterContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
    },
    counter: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.8,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
    },
    navButton: {
      flex: 0.48,
    },
    navigationButton: {
      flex: 1,
      marginHorizontal: 8,
    },
    submitButtonContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.error || '#FF6B6B',
      textAlign: 'center',
    },
  });
  

  
  const handleSelectOption = (questionId, optionIndex) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionIndex
    });
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleQuizSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(selectedOptions).length < totalQuestions) {
      Alert.alert(
        'Incomplete Quiz',
        'You have not answered all questions. Are you sure you want to submit?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Submit Anyway',
            onPress: submitQuiz,
          },
        ]
      );
    } else {
      submitQuiz();
    }
  };
  
  const submitQuiz = async () => {
    try {
      setIsSubmitting(true);
      console.log('DEBUG: quizId at submission time:', quizId);
      
      // Use a local variable to track the ID for this submission
      let submissionId = quizId;
      
      // Validate quizId before submission
      if (!submissionId || submissionId === 'undefined') {
        console.error('🚨 Error: quizId is missing or invalid at submission time:', submissionId);
        
        // For Expo Go: Generate a temporary UUID for testing
        if (isExpoGoSimulation) {
          // We're in Expo Go, use a test ID
          const tempId = `test-uuid-${new Date().getTime()}`;
          console.log('Using fallback test UUID for Expo Go:', tempId);
          submissionId = tempId;
          setQuizId(tempId); // Update state for future reference
        } else {
          // In production build, show an error
          Alert.alert('Error', 'Quiz ID is missing. Please try again or create a new quiz.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Calculate results
      let correctAnswers = 0;
      const userAnswers = {};
      
      questions.forEach(question => {
        const selectedOption = selectedOptions[question.id];
        userAnswers[question.id] = selectedOption;
        
        if (selectedOption === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      const score = (correctAnswers / totalQuestions) * 100;
      
      // Save results to the server
      try {
        console.log('Submitting quiz with ID:', submissionId);
        await quizService.submitQuiz(submissionId, userAnswers);
      } catch (submitError) {
        console.error('Submit quiz error:', submitError);
        // Continue to the results page even if submission fails
        // This ensures the user sees results even with network issues
        if (!isExpoGoSimulation) {
          Alert.alert('Warning', 'Your quiz was completed but results could not be saved. You can still review your answers.');
        }
      }
      
      // Navigate to results screen with quiz data using URL query parameters
      const resultsParams = `score=${score.toFixed(1)}&total=${totalQuestions}&correct=${correctAnswers}&quizId=${submissionId}`;
      console.log('Navigating to results with params:', resultsParams);
      router.push(`/quiz-results?${resultsParams}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Quiz" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Quiz" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Quiz" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available. Please generate a quiz first.</Text>
          <Button 
            title="Go to Upload"
            onPress={() => router.push('/upload')}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="SACAA Practice Quiz" withBack={true} />
    
      <View style={styles.header}>
        <ProgressBar current={currentQuestionNum} total={totalQuestions} />
        <View style={styles.counterContainer}>
          <Text style={styles.counter}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {currentQuestion && (
          <QuestionCard
            questionNumber={currentQuestion.questionNumber}
            questionText={currentQuestion.questionText}
            category={currentQuestion.category}
            difficulty={currentQuestion.difficulty}
            options={currentQuestion.options}
            selectedOption={selectedOptions[currentQuestion.id]}
            onSelectOption={(optionIndex) => 
              handleSelectOption(currentQuestion.id, optionIndex)
            }
          />
        )}
        
        <View style={styles.navigationButtons}>
          <Button
            title="Previous"
            onPress={handlePrevQuestion}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            variant="outline"
            size="medium"
            style={styles.navButton}
            testID="quiz-screen-prev-btn"
          />
          
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              title="Next"
              onPress={handleNextQuestion}
              disabled={isSubmitting}
              variant="outline"
              size="medium"
              style={styles.navButton}
              testID="quiz-screen-next-btn"
            />
          ) : (
            <Button
              title={isSubmitting ? "Submitting..." : "Submit Quiz"}
              onPress={handleQuizSubmit}
              disabled={isSubmitting}
              variant="primary"
              size="medium"
              style={styles.navButton}
              testID="quiz-screen-submit-btn"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
