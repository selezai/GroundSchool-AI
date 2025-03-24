import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../store';
import Button from '../components/Button';
import { supabase } from '../services/supabaseClient';

/**
 * ProfileScreen - User profile and settings
 * Shows user information, statistics, and allows logout
 */
const ProfileScreen = ({ navigation, testID = 'profile-screen' }) => {
  const { user, clearUser } = useStore();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real user statistics from Supabase
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch quiz history from Supabase
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id);
          
        if (quizzesError) throw quizzesError;
        
        // Fetch question answers
        const { data: answers, error: answersError } = await supabase
          .from('question_answers')
          .select('*')
          .eq('user_id', user.id);
          
        if (answersError) throw answersError;
        
        // Calculate statistics
        const totalQuizzes = quizzes?.length || 0;
        const totalQuestions = answers?.length || 0;
        
        // Calculate accuracy
        const correctAnswers = answers?.filter(a => a.is_correct)?.length || 0;
        const accuracy = totalQuestions > 0 
          ? Math.round((correctAnswers / totalQuestions) * 100) + '%' 
          : '0%';
        
        // Calculate study time (sum of quiz durations)
        const studyTimeMinutes = quizzes?.reduce((total, quiz) => {
          return total + (quiz.duration_seconds || 0) / 60;
        }, 0) || 0;
        
        // Find top category
        const categories = {};
        answers?.forEach(answer => {
          if (answer.category) {
            categories[answer.category] = (categories[answer.category] || 0) + 1;
          }
        });
        
        let topCategory = 'None';
        let maxCount = 0;
        
        Object.entries(categories).forEach(([category, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topCategory = category;
          }
        });
        
        // Set user stats
        setUserStats({
          questionsAnswered: totalQuestions,
          quizzesTaken: totalQuizzes,
          avgAccuracy: accuracy,
          topCategory: topCategory,
          studyTimeHours: Math.round(studyTimeMinutes / 60 * 10) / 10, // Round to 1 decimal
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Provide default empty stats on error
        setUserStats({
          questionsAnswered: 0,
          quizzesTaken: 0,
          avgAccuracy: '0%',
          topCategory: 'None',
          studyTimeHours: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStats();
  }, [user?.id]);

  // Settings options
  const settingsOptions = [
    { id: 'notifications', title: 'Push Notifications', icon: 'notifications-outline' },
    { id: 'appearance', title: 'Appearance', icon: 'color-palette-outline' },
    { id: 'language', title: 'Language', icon: 'language-outline' },
    { id: 'reset', title: 'Reset Progress', icon: 'refresh-outline' },
    { id: 'diagnostics', title: 'DeepSeek API Diagnostics', icon: 'bug-outline' },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline' },
    { id: 'about', title: 'About', icon: 'information-circle-outline' },
  ];

  const handleSettingPress = (settingId) => {
    console.log(`Setting pressed: ${settingId}`);
    
    if (settingId === 'diagnostics') {
      // Navigate to the diagnostic screen
      navigation.navigate('DiagnoseScreen');
    }
    // Other settings can be implemented in the future
  };

  const handleLogout = async () => {
    await clearUser();
  };

  if (!user) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.name ? user.name[0].toUpperCase() : 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user.name || 'Pilot User'}</Text>
          <Text style={styles.userEmail}>{user.email || 'user@example.com'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Study Statistics</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00FFCC" />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats?.questionsAnswered || 0}</Text>
                  <Text style={styles.statLabel}>Questions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats?.quizzesTaken || 0}</Text>
                  <Text style={styles.statLabel}>Quizzes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats?.avgAccuracy || '0%'}</Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
              </View>

              <View style={styles.additionalStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Top Category</Text>
                  <Text style={styles.statRowValue}>{userStats?.topCategory || 'None'}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statRowLabel}>Study Time</Text>
                  <Text style={styles.statRowValue}>{userStats?.studyTimeHours || 0} hours</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.settingItem}
              onPress={() => handleSettingPress(option.id)}
              testID={`${testID}-setting-${option.id}`}
            >
              <Ionicons name={option.icon} size={24} color="#E2E8F0" />
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Ionicons name="chevron-forward" size={18} color="#E2E8F0" />
            </TouchableOpacity>
          ))}
        </View>

        <Button 
          title="Logout" 
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
          testID={`${testID}-logout-btn`}
        />
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00FFCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0A0F24',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FFCC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  additionalStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statRowLabel: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: '#E2E8F0',
    marginLeft: 12,
  },
  logoutButton: {
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#CCCCCC',
    marginTop: 10,
    fontSize: 14,
  },
});

export default ProfileScreen;
