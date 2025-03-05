import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';

/**
 * QuizResultsScreen - Shows the results of a completed quiz
 * Displays score, answer review, and allows retaking the quiz
 */
const QuizResultsScreen = ({ testID = 'quiz-results-screen' }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { quizId } = route.params || {};
  
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch the quiz data based on quizId
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // In a real app, this would come from an API or database
        // For demo purposes, we'll use mock data
        const mockQuizData = {
          id: quizId || 'quiz123',
          title: 'Navigation Fundamentals',
          date: new Date().toISOString(),
          score: 8,
          totalQuestions: 10,
          timeSpent: '6:42', // minutes:seconds
          questions: [
            {
              id: 'q1',
              question: 'What is the correct definition of altitude?',
              options: [
                'Distance above ground level',
                'Height above mean sea level',
                'Vertical distance from the standard datum plane',
                'Elevation above the highest terrain'
              ],
              correctAnswer: 'Vertical distance from the standard datum plane',
              userAnswer: 'Vertical distance from the standard datum plane',
              isCorrect: true,
              category: 'Navigation',
              difficulty: 'Medium'
            },
            {
              id: 'q2',
              question: 'Which of the following is NOT a primary flight control surface?',
              options: [
                'Aileron',
                'Elevator',
                'Rudder',
                'Flap'
              ],
              correctAnswer: 'Flap',
              userAnswer: 'Flap',
              isCorrect: true,
              category: 'Aircraft Systems',
              difficulty: 'Easy'
            },
            {
              id: 'q3',
              question: 'What is the standard atmospheric pressure at sea level?',
              options: [
                '1003 hPa',
                '1013.25 hPa',
                '1023 hPa',
                '1033.25 hPa'
              ],
              correctAnswer: '1013.25 hPa',
              userAnswer: '1013.25 hPa',
              isCorrect: true,
              category: 'Meteorology',
              difficulty: 'Medium'
            },
            {
              id: 'q4',
              question: 'What is the purpose of a gyroscope in aircraft instruments?',
              options: [
                'To measure airspeed',
                'To provide artificial horizon',
                'To detect wind direction',
                'To calculate fuel consumption'
              ],
              correctAnswer: 'To provide artificial horizon',
              userAnswer: 'To measure airspeed',
              isCorrect: false,
              category: 'Instrumentation',
              difficulty: 'Medium'
            },
            {
              id: 'q5',
              question: 'Which document contains the limitations, procedures, performance, and other information for operating a specific aircraft?',
              options: [
                'Aircraft Maintenance Manual',
                'Pilot\'s Operating Handbook',
                'Aeronautical Information Manual',
                'Flight Operations Manual'
              ],
              correctAnswer: 'Pilot\'s Operating Handbook',
              userAnswer: 'Pilot\'s Operating Handbook',
              isCorrect: true,
              category: 'Operations',
              difficulty: 'Easy'
            }
          ]
        };
        
        setQuizData(mockQuizData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [quizId]);

  // Calculate performance metrics
  const calculateMetrics = () => {
    if (!quizData) return {};
    
    const correctCount = quizData.questions.filter(q => q.isCorrect).length;
    const incorrectCount = quizData.questions.length - correctCount;
    const percentScore = Math.round((correctCount / quizData.questions.length) * 100);
    
    // Group by category
    const categoryStats = {};
    quizData.questions.forEach(q => {
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = {
          total: 0,
          correct: 0
        };
      }
      
      categoryStats[q.category].total += 1;
      if (q.isCorrect) {
        categoryStats[q.category].correct += 1;
      }
    });
    
    // Find strongest and weakest categories
    let strongestCategory = '';
    let weakestCategory = '';
    let highestScore = 0;
    let lowestScore = 1;
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const score = stats.correct / stats.total;
      if (score > highestScore) {
        highestScore = score;
        strongestCategory = category;
      }
      if (score < lowestScore) {
        lowestScore = score;
        weakestCategory = category;
      }
    });
    
    return {
      percentScore,
      correctCount,
      incorrectCount,
      strongestCategory,
      weakestCategory,
      categoryStats
    };
  };

  const metrics = calculateMetrics();

  // Handle retry quiz
  const handleRetry = () => {
    // Navigate back to the quiz screen with the same questions
    navigation.navigate('Quiz', { 
      questions: quizData.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        category: q.category,
        difficulty: q.difficulty
      }))
    });
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading quiz results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render no data state
  if (!quizData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Quiz data not found</Text>
          <Button 
            title="Go Back" 
            onPress={() => navigation.goBack()}
            variant="outline"
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{quizData.title}</Text>
          <Text style={styles.subtitle}>Quiz Results</Text>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{metrics.percentScore}%</Text>
          </View>
          <View style={styles.scoreDetails}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Correct</Text>
              <Text style={styles.scoreValue}>{metrics.correctCount}/{quizData.questions.length}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Time Spent</Text>
              <Text style={styles.scoreValue}>{quizData.timeSpent}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Completed</Text>
              <Text style={styles.scoreValue}>
                {new Date(quizData.date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.analysisContainer}>
          <Text style={styles.sectionTitle}>Performance Analysis</Text>
          
          {metrics.strongestCategory && (
            <View style={styles.analysisItem}>
              <Ionicons name="trophy-outline" size={24} color="#00FFCC" />
              <View style={styles.analysisContent}>
                <Text style={styles.analysisLabel}>Strongest Category</Text>
                <Text style={styles.analysisValue}>{metrics.strongestCategory}</Text>
              </View>
            </View>
          )}
          
          {metrics.weakestCategory && (
            <View style={styles.analysisItem}>
              <Ionicons name="flag-outline" size={24} color="#FC8181" />
              <View style={styles.analysisContent}>
                <Text style={styles.analysisLabel}>Needs Improvement</Text>
                <Text style={styles.analysisValue}>{metrics.weakestCategory}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.questionsContainer}>
          <Text style={styles.sectionTitle}>Question Review</Text>
          
          {quizData.questions.map((question, index) => (
            <View 
              key={question.id} 
              style={[
                styles.questionItem,
                question.isCorrect ? styles.correctItem : styles.incorrectItem
              ]}
              testID={`${testID}-question-${index}`}
            >
              <View style={styles.questionHeader}>
                <View style={[
                  styles.questionStatus,
                  question.isCorrect ? styles.correctStatus : styles.incorrectStatus
                ]}>
                  <Ionicons 
                    name={question.isCorrect ? "checkmark" : "close"} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={styles.questionCategory}>{question.category}</Text>
              </View>
              
              <Text style={styles.questionText}>{question.question}</Text>
              
              <View style={styles.answerContainer}>
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text 
                    style={[
                      styles.answerValue,
                      question.isCorrect ? styles.correctAnswer : styles.incorrectAnswer
                    ]}
                  >
                    {question.userAnswer}
                  </Text>
                </View>
                
                {!question.isCorrect && (
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <Text style={[styles.answerValue, styles.correctAnswer]}>
                      {question.correctAnswer}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <Button 
            title="Retry Quiz" 
            onPress={handleRetry}
            variant="primary"
            style={{ marginBottom: 12 }}
            testID={`${testID}-retry-btn`}
          />
          <Button 
            title="Back to Home" 
            onPress={() => navigation.navigate('Home')}
            variant="outline"
            testID={`${testID}-home-btn`}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24', // Dark navy (aviation-themed)
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 255, 204, 0.2)',
    borderWidth: 3,
    borderColor: '#00FFCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FFCC',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  analysisContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  analysisContent: {
    marginLeft: 12,
    flex: 1,
  },
  analysisLabel: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  questionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  questionItem: {
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  correctItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#00FFCC',
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
  },
  incorrectItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FC8181',
    backgroundColor: 'rgba(252, 129, 129, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
  },
  questionStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  correctStatus: {
    backgroundColor: '#00FFCC',
  },
  incorrectStatus: {
    backgroundColor: '#FC8181',
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  questionCategory: {
    fontSize: 12,
    color: '#E2E8F0',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  questionText: {
    fontSize: 15,
    color: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  answerContainer: {
    padding: 12,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    width: 110,
  },
  answerValue: {
    fontSize: 14,
    flex: 1,
  },
  correctAnswer: {
    color: '#00FFCC',
    fontWeight: 'bold',
  },
  incorrectAnswer: {
    color: '#FC8181',
    fontWeight: 'bold',
  },
  actionsContainer: {
    marginBottom: 40,
  },
});

export default QuizResultsScreen;
