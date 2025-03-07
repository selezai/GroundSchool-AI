import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import QuestionCard from '../src/components/QuestionCard';
import ProgressBar from '../src/components/ProgressBar';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';
import { quizService } from '../src/services';

// Questions will be fetched from the API


export default function QuizScreen({ route }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const { colors, isDarkMode } = useTheme();
  
  // Get quizId from route params if available
  const quizId = route?.params?.quizId;
  
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  
  // Generate placeholder questions for when real questions aren't available
  const generatePlaceholderQuestions = (count = 5, quizTitle = '') => {
    console.log('Generating placeholder questions for quiz');
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

  // Fetch questions from API when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If no quizId provided, create demo questions to avoid crashes
        if (!quizId) {
          console.log('No quizId provided, using placeholder questions');
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
    
    fetchQuestions();
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
      await quizService.submitQuiz(quizId, userAnswers);
      
      // Navigate to results screen with quiz data
      router.push({
        pathname: '/quiz-results',
        params: {
          score: score.toFixed(1),
          total: totalQuestions,
          correct: correctAnswers,
          quizId: quizId
        }
      });
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
        <ProgressBar progress={progress} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    flex: 0.48,
  },
});
