import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabaseClient';
import generateMockData from '../services/fallbackData';

/**
 * RecentActivityScreen - Shows user's recent quiz attempts and study activity
 * Allows resuming unfinished quizzes and reviewing completed ones
 */
const RecentActivityScreen = ({ testID = 'recent-activity-screen' }) => {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent activities from Supabase database
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // For development: use a 5-second timeout to prevent hanging
        const timeout = setTimeout(() => {
          // If we're still loading after 5 seconds, use fallback data
          if (loading) {
            console.warn('Supabase fetch timed out, using fallback data');
            const mockData = generateMockData();
            const combinedActivities = [...mockData.quizAttempts, ...mockData.documentUploads];
            
            // Sort by created_at date
            combinedActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setActivities(combinedActivities);
            setLoading(false);
          }
        }, 5000);
        
        // Try to get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Auth error:', userError);
          // Use mock data since we couldn't authenticate
          const mockData = generateMockData();
          const combinedActivities = [...mockData.quizAttempts, ...mockData.documentUploads];
          
          // Sort by created_at date
          combinedActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          setActivities(combinedActivities);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }
        
        // User authenticated successfully, continue with real data
        // Fetch all quiz attempts for this user
        const { data: quizAttempts, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) {
          console.error('Error fetching quiz attempts:', error);
          // Fallback to mock data if we can't fetch quiz attempts
          const mockData = generateMockData();
          const combinedActivities = [...mockData.quizAttempts, ...mockData.documentUploads];
          combinedActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setActivities(combinedActivities);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }
        
        // Format the activities
        const formattedActivities = quizAttempts.map(attempt => ({
          id: attempt.id,
          type: 'quiz',
          title: attempt.title || 'Quiz',
          date: attempt.created_at,
          completed: attempt.completed,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          progress: attempt.progress || 0,
          documentName: attempt.document_name || null
        }));
        
        // Also fetch document uploads if needed
        const { data: uploads, error: uploadsError } = await supabase
          .from('document_uploads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (!uploadsError && uploads) {
          // Add document uploads to activities
          const uploadActivities = uploads.map(upload => ({
            id: upload.id,
            type: 'upload',
            title: upload.filename || 'Document',
            date: upload.created_at,
            fileSize: upload.filesize ? `${Math.round(upload.filesize / 1024)} KB` : 'Unknown size'
          }));
          
          // Combine and sort all activities by date
          const allActivities = [...formattedActivities, ...uploadActivities];
          allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          setActivities(allActivities);
        } else {
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        // Use fallback data in case of any errors
        const mockData = generateMockData();
        const combinedActivities = [...mockData.quizAttempts, ...mockData.documentUploads];
        combinedActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setActivities(combinedActivities);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Alert user about fallback data in development mode
    if (__DEV__) {
      setTimeout(() => {
        Alert.alert(
          'Development Mode',
          'The app will display mock data if Supabase connection fails.',
          [{ text: 'OK' }]
        );
      }, 1000);
    }
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
