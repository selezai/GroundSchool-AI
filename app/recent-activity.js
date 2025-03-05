import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';

// Mock data for recent activity
const mockActivity = [
  {
    id: '1',
    title: 'SACAA Aircraft General Quiz',
    date: '2025-03-05',
    score: 85,
    totalQuestions: 10,
    completed: true,
  },
  {
    id: '2',
    title: 'Navigation Systems Quiz',
    date: '2025-03-04',
    score: 78,
    totalQuestions: 15,
    completed: true,
  },
  {
    id: '3',
    title: 'Aviation Regulations Quiz',
    date: '2025-03-02',
    score: 92,
    totalQuestions: 12,
    completed: true,
  },
  {
    id: '4',
    title: 'Weather Patterns Quiz',
    date: '2025-02-28',
    score: 0,
    totalQuestions: 8,
    completed: false,
  }
];

export default function RecentActivityScreen() {
  const renderActivityItem = ({ item }) => {
    // Format date for display
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Handle item press
    const handleItemPress = () => {
      if (item.completed) {
        // Navigate to results with historic data
        router.push({
          pathname: '/quiz-results',
          params: {
            score: item.score,
            total: item.totalQuestions,
            correct: Math.round(item.score * item.totalQuestions / 100),
            timeSpent: 0, // We don't have this data for past quizzes
            fromHistory: true
          }
        });
      } else {
        // Navigate to continue incomplete quiz
        router.push('/quiz');
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.activityCard}
        onPress={handleItemPress}
        testID={`recent-activity-item-${item.id}`}
      >
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.activityDate}>{formattedDate}</Text>
        </View>
        
        <View style={styles.activityDetails}>
          {item.completed ? (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text 
                style={[
                  styles.scoreValue, 
                  item.score >= 70 ? styles.goodScore : styles.badScore
                ]}
              >
                {item.score}%
              </Text>
            </View>
          ) : (
            <View style={styles.incompleteContainer}>
              <Text style={styles.incompleteText}>Incomplete</Text>
              <Text style={styles.continueText}>Tap to continue</Text>
            </View>
          )}
          
          <View style={styles.questionsContainer}>
            <Text style={styles.questionsLabel}>Questions</Text>
            <Text style={styles.questionsValue}>{item.totalQuestions}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} testID="recent-activity-screen">
      <Stack.Screen 
        options={{
          title: 'Recent Activity',
        }} 
      />
    
      {mockActivity.length > 0 ? (
        <FlatList
          data={mockActivity}
          renderItem={renderActivityItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          testID="recent-activity-list"
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyMessage}>
            Complete your first quiz to see your activity history.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/upload')}
            testID="empty-start-quiz-btn"
          >
            <Text style={styles.startButtonText}>Start a Quiz</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  listContent: {
    padding: 16,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00FFCC',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  activityDate: {
    fontSize: 14,
    color: '#E2E8F0',
    marginLeft: 8,
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  goodScore: {
    color: '#00FFCC', // Green for good scores
  },
  badScore: {
    color: '#FF6B6B', // Red for bad scores
  },
  incompleteContainer: {
    flex: 1,
  },
  incompleteText: {
    fontSize: 14,
    color: '#FFD700', // Yellow for incomplete
    fontWeight: 'bold',
    marginBottom: 4,
  },
  continueText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  questionsContainer: {
    alignItems: 'flex-end',
  },
  questionsLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  questionsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#00FFCC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0F24',
  },
});
