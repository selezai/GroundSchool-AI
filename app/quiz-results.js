import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import ScoreDisplay from '../src/components/ScoreDisplay';
import Button from '../src/components/Button';

export default function QuizResultsScreen() {
  // Get score data from route params
  const params = useLocalSearchParams();
  
  const score = parseFloat(params.score || "0");
  const total = parseInt(params.total || "0");
  const correct = parseInt(params.correct || "0");
  const timeSpent = parseInt(params.timeSpent || "0");
  
  // Format time spent
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
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
      <Stack.Screen 
        options={{
          title: 'Quiz Results',
          headerLeft: () => null, // Disable back button
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <ScoreDisplay score={score} />
        
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
            <Text style={styles.resultLabel}>Time Spent:</Text>
            <Text style={styles.resultValue}>{formatTime(timeSpent)}</Text>
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
            title="Return to Home"
            onPress={() => router.replace('/')}
            variant="primary"
            size="large"
            style={styles.button}
            testID="quiz-results-home-btn"
          />
          
          <Button
            title="Try Another Quiz"
            onPress={() => router.replace('/upload')}
            variant="outline"
            size="large"
            style={styles.button}
            testID="quiz-results-retry-btn"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.reviewLink}
          onPress={() => {
            // In a full implementation, this would navigate to a detailed review
            // where users can see which questions they got right/wrong
          }}
          testID="quiz-results-review-link"
        >
          <Text style={styles.reviewLinkText}>
            Review Questions and Answers
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00FFCC',
  },
  feedbackText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 12,
  },
  reviewLink: {
    alignItems: 'center',
    padding: 16,
  },
  reviewLinkText: {
    color: '#00FFCC',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
