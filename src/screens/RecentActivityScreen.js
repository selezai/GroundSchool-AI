import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * RecentActivityScreen - Shows user's recent quiz attempts and study activity
 * Allows resuming unfinished quizzes and reviewing completed ones
 */
const RecentActivityScreen = ({ testID = 'recent-activity-screen' }) => {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent activities from storage (in real app would be from API/backend)
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // In a real implementation, this would be fetched from a backend
        // For now, we'll use mock data
        const mockActivities = [
          {
            id: 'act1',
            type: 'quiz',
            title: 'Navigation Fundamentals',
            date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            completed: true,
            score: 8,
            totalQuestions: 10,
            questions: [] // Would contain actual questions
          },
          {
            id: 'act2',
            type: 'quiz',
            title: 'Aircraft Systems',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            completed: true,
            score: 7,
            totalQuestions: 10,
            questions: []
          },
          {
            id: 'act3',
            type: 'quiz',
            title: 'Meteorology Basics',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            completed: false,
            progress: 4,
            totalQuestions: 10,
            questions: []
          },
          {
            id: 'act4',
            type: 'upload',
            title: 'Principles of Flight.pdf',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
            fileSize: '3.4 MB'
          },
          {
            id: 'act5',
            type: 'quiz',
            title: 'Radio Navigation',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            completed: true,
            score: 9,
            totalQuestions: 10,
            questions: []
          }
        ];

        // Sort by date (newest first)
        mockActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setActivities(mockActivities);
        setLoading(false);
        
        // Store mock data in AsyncStorage for future use
        await AsyncStorage.setItem('recentActivities', JSON.stringify(mockActivities));
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    } else if (diffMin > 0) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle activity item press
  const handleActivityPress = (activity) => {
    if (activity.type === 'quiz') {
      if (activity.completed) {
        // Navigate to results screen with the activity data
        navigation.navigate('QuizResults', { quizId: activity.id });
      } else {
        // Resume quiz
        navigation.navigate('Quiz', { 
          questions: activity.questions,
          resumeFrom: activity.progress
        });
      }
    } else if (activity.type === 'upload') {
      // Navigate to upload history or details
      navigation.navigate('UploadHistory', { fileId: activity.id });
    }
  };

  // Render activity list item
  const renderActivityItem = ({ item }) => {
    let iconName, iconColor, statusText, statusColor;

    if (item.type === 'quiz') {
      iconName = 'document-text-outline';
      iconColor = '#00FFCC';
      
      if (item.completed) {
        const percentScore = Math.round((item.score / item.totalQuestions) * 100);
        statusText = `${percentScore}%`;
        // Color based on score
        if (percentScore >= 80) {
          statusColor = '#00FFCC'; // Green
        } else if (percentScore >= 60) {
          statusColor = '#FFD700'; // Yellow
        } else {
          statusColor = '#FC8181'; // Red
        }
      } else {
        statusText = 'Continue';
        statusColor = '#3182CE'; // Blue
      }
    } else if (item.type === 'upload') {
      iconName = 'cloud-upload-outline';
      iconColor = '#3182CE';
      statusText = item.fileSize;
      statusColor = '#E2E8F0';
    }

    return (
      <TouchableOpacity 
        style={styles.activityItem}
        onPress={() => handleActivityPress(item)}
        testID={`${testID}-activity-${item.id}`}
      >
        <View style={styles.activityIconContainer}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityDate}>{formatRelativeTime(item.date)}</Text>
        </View>
        <View style={styles.activityStatus}>
          <Text style={[styles.activityStatusText, { color: statusColor }]}>
            {statusText}
          </Text>
          {item.type === 'quiz' && !item.completed && (
            <Ionicons name="play" size={16} color={statusColor} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // List empty component
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="hourglass-outline" size={48} color="#E2E8F0" />
      <Text style={styles.emptyTitle}>No Activity Yet</Text>
      <Text style={styles.emptyText}>
        Start a quiz or upload study materials to see your activity here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
      </View>
      
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={ListEmptyComponent}
        testID={`${testID}-list`}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24', // Dark navy (aviation-themed)
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    flexGrow: 1, // Ensures the empty state centers properly
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
  },
});

export default RecentActivityScreen;
