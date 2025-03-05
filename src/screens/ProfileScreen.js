import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../store';
import Button from '../components/Button';

/**
 * ProfileScreen - User profile and settings
 * Shows user information, statistics, and allows logout
 */
const ProfileScreen = ({ testID = 'profile-screen' }) => {
  const { user, clearUser } = useStore();

  // Mock statistics data (would be fetched from backend in real implementation)
  const userStats = {
    questionsAnswered: 328,
    quizzesTaken: 14,
    avgAccuracy: '76%',
    topCategory: 'Navigation',
    studyTimeHours: 8.5,
  };

  // Placeholder settings options
  const settingsOptions = [
    { id: 'notifications', title: 'Push Notifications', icon: 'notifications-outline' },
    { id: 'appearance', title: 'Appearance', icon: 'color-palette-outline' },
    { id: 'language', title: 'Language', icon: 'language-outline' },
    { id: 'reset', title: 'Reset Progress', icon: 'refresh-outline' },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline' },
    { id: 'about', title: 'About', icon: 'information-circle-outline' },
  ];

  const handleSettingPress = (settingId) => {
    // For future implementation
    console.log(`Setting pressed: ${settingId}`);
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
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.questionsAnswered}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.quizzesTaken}</Text>
              <Text style={styles.statLabel}>Quizzes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.avgAccuracy}</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.additionalStats}>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Top Category</Text>
              <Text style={styles.statRowValue}>{userStats.topCategory}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Study Time</Text>
              <Text style={styles.statRowValue}>{userStats.studyTimeHours} hours</Text>
            </View>
          </View>
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
});

export default ProfileScreen;
