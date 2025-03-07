import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import ScoreDisplay from '../src/components/ScoreDisplay';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';
import { quizService } from '../src/services';

export default function QuizResultsScreen() {
  // Get score data from route params
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  
  const score = parseFloat(params.score || "0");
  const total = parseInt(params.total || "0");
  const correct = parseInt(params.correct || "0");
  const quizId = params.quizId;
  
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load the full quiz data if quizId is provided
  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId) return;
      
      try {
        setLoading(true);
        const data = await quizService.getQuiz(quizId);
        setQuizData(data);
      } catch (err) {
        console.error('Error loading quiz data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuizData();
  }, [quizId]);
  
  // Define styles within the component to use theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    resultCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
    },
    resultTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    resultLabel: {
      fontSize: 16,
      color: '#E2E8F0',
    },
    resultValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
    },
    feedbackContainer: {
      marginTop: 16,
      padding: 12,
      backgroundColor: 'rgba(0, 255, 204, 0.1)',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    feedbackText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 22,
    },
    buttonContainer: {
      marginBottom: 20,
    },
    button: {
      marginBottom: 12,
    },

  });
  

  
  // Get performance message based on score
  const getPerformanceMessage = (score) => {
    if (score >= 90) {
      return 'Excellent work! You have a strong understanding of the material.';
    } else if (score >= 70) {
      return 'Good job! You have a solid grasp of most concepts.';
    } else if (score >= 50) {
      return 'Not bad, but there\'s room for improvement. Review the topics you missed.';
    } else {
      return 'You need more practice. Focus on reviewing the fundamentals.';
    }
  };
  
  // Calculate performance metrics
  const answered = Object.keys(params).length;
  const skipped = total - answered;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  
  return (
    <SafeAreaView style={styles.container} testID="quiz-results-screen">
      <AppHeader title="Quiz Results" withBack={false} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <ScoreDisplay
          correct={correct}
          total={total}
        />
        
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Performance Summary</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Correct Answers:</Text>
            <Text style={styles.resultValue}>{correct} of {total}</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Accuracy:</Text>
            <Text style={styles.resultValue}>{accuracy.toFixed(1)}%</Text>
          </View>
          

          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Skipped Questions:</Text>
            <Text style={styles.resultValue}>{skipped}</Text>
          </View>
          
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              {getPerformanceMessage(score)}
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Review Questions and Answers"
            onPress={() => {
              if (quizId) {
                router.push({
                  pathname: '/quiz-review',
                  params: { quizId }
                });
              } else {
                // If no quizId, just show message
                Alert.alert('Not Available', 'Question review is not available for this quiz.');
              }
            }}
            variant="primary"
            size="large"
            style={styles.button}
            testID="quiz-results-review-btn"
            disabled={!quizId || loading}
          />
          
          <Button
            title="Try Another Quiz"
            onPress={() => router.replace('/upload')}
            variant="outline"
            size="large"
            style={styles.button}
            testID="quiz-results-retry-btn"
          />
          
          <Button
            title="Return to Home"
            onPress={() => router.replace('/')}
            variant="outline"
            size="large"
            style={styles.button}
            testID="quiz-results-home-btn"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles moved inside the component to access theme colors
