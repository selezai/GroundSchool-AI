import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import QuestionCard from '../src/components/QuestionCard';
import ProgressBar from '../src/components/ProgressBar';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';

// Mock questions data (in a real app, this would come from an API)
const mockQuestions = [
  {
    id: 1,
    question: 'What is the primary purpose of the ailerons on an aircraft?',
    questionText: 'What is the primary purpose of the ailerons on an aircraft?',
    questionNumber: 1,
    category: 'Aircraft Systems',
    difficulty: 'Medium',
    options: [
      'Control roll movement around the longitudinal axis',
      'Control pitch movement around the lateral axis',
      'Control yaw movement around the vertical axis',
      'Reduce drag during high-speed flight'
    ],
    correctAnswer: 0,
  },
  {
    id: 2,
    question: 'Which of the following instruments relies on the pitot-static system?',
    questionText: 'Which of the following instruments relies on the pitot-static system?',
    questionNumber: 2,
    category: 'Instruments',
    difficulty: 'Medium',
    options: [
      'Turn coordinator',
      'Airspeed indicator',
      'Magnetic compass',
      'Tachometer'
    ],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: 'What does ADF stand for in aviation?',
    questionText: 'What does ADF stand for in aviation?',
    questionNumber: 3,
    category: 'Navigation',
    difficulty: 'Easy',
    options: [
      'Automatic Direction Finder',
      'Aviation Distance Factor',
      'Altitude Display Format',
      'Airborne Display Function'
    ],
    correctAnswer: 0,
  },
  {
    id: 4,
    question: 'Which meteorological phenomenon represents the greatest hazard to aircraft due to turbulence?',
    questionText: 'Which meteorological phenomenon represents the greatest hazard to aircraft due to turbulence?',
    questionNumber: 4,
    category: 'Meteorology',
    difficulty: 'Hard',
    options: [
      'Cirrus clouds',
      'Stratus clouds',
      'Cumulonimbus clouds',
      'Radiation fog'
    ],
    correctAnswer: 2,
  },
  {
    id: 5,
    question: 'What is the standard pressure setting for altimeter calibration at sea level?',
    options: [
      '1003 hPa',
      '1013 hPa',
      '1023 hPa',
      '1033 hPa'
    ],
    correctAnswer: 1,
  }
];

export default function QuizScreen() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { colors, isDarkMode } = useTheme();
  
  const totalQuestions = mockQuestions.length;
  const currentQuestion = mockQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
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
      mockQuestions.forEach(question => {
        if (selectedOptions[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      const score = (correctAnswers / totalQuestions) * 100;
      
      // In a real app, we would save results to the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to results screen with quiz data
      router.push({
        pathname: '/quiz-results',
        params: {
          score: score.toFixed(1),
          total: totalQuestions,
          correct: correctAnswers
        }
      });
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="quiz-screen">
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
