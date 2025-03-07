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
  
  // Fetch questions from API when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let quizData;
        if (quizId) {
          // If quizId is provided, fetch the specific quiz
          quizData = await quizService.getQuizById(quizId);
        } else {
          // Otherwise, get the most recent quiz
          const quizzes = await quizService.getQuizHistory();
          if (quizzes && quizzes.length > 0) {
            quizData = quizzes[0];
          } else {
            throw new Error('No quizzes found. Please generate a quiz first.');
          }
        }
        
        if (quizData && quizData.questions) {
          // Format questions to match the expected structure
          const formattedQuestions = quizData.questions.map((q, index) => ({
            id: q.id || index + 1,
            question: q.question || q.questionText,
            questionText: q.questionText || q.question,
            questionNumber: index + 1,
            category: q.category || 'General',
            difficulty: q.difficulty || 'Medium',
            options: q.options,
            correctAnswer: q.correctAnswer,
            reference: q.reference || '',
          }));
          
          setQuestions(formattedQuestions);
        } else {
          throw new Error('No questions found in the quiz data');
        }
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
      const quizResult = {
        quizId: quizId,
        answers: userAnswers,
        score: score,
        completedAt: new Date().toISOString()
      };
      
      await quizService.submitQuizAnswers(quizResult);
      
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
