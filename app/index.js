import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';

/**
 * HomeScreen - The main hub of the GroundSchool-AI app
 * This screen provides access to Question Bank and Recent Activity
 */
export default function HomeScreen() {
  const { colors } = useTheme();
  
  // Define styles within the component to use theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    topSpacing: {
      marginTop: 10,
      marginBottom: 24,
      alignItems: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    cardContainer: {
      marginBottom: 24,
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: '#E2E8F0',
      marginBottom: 16,
    },
    infoSection: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    infoStep: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    stepNumber: {
      backgroundColor: colors.primary,
      color: '#0A0F24',
      width: 30,
      height: 30,
      borderRadius: 15,
      textAlign: 'center',
      lineHeight: 30,
      fontWeight: 'bold',
      marginRight: 12,
    },
    stepText: {
      color: colors.text,
      fontSize: 14,
      flex: 1,
    },
  });
  
  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      <AppHeader title="GroundSchool-AI" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSpacing}>
          <Text style={styles.subtitle}>AI-powered aviation study app for pilots</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Question Bank</Text>
            <Text style={styles.cardDescription}>
              Upload your study materials and generate SACAA-style multiple choice questions.
            </Text>
            <Button 
              title="Generate Questions" 
              onPress={() => {
                // Use requestAnimationFrame for more consistent navigation
                requestAnimationFrame(() => {
                  try {
                    router.push('/upload');
                  } catch (error) {
                    console.error('Navigation error:', error);
                    // Fallback navigation with shorter timeout
                    setTimeout(() => router.push('/upload'), 50);
                  }
                });
              }}
              size="large"
              variant="primary"
              testID="home-screen-question-bank-btn"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.cardDescription}>
              View your past attempts and resume incomplete question sets.
            </Text>
            <Button 
              title="View Activity" 
              onPress={() => {
                // Use requestAnimationFrame for more consistent navigation
                requestAnimationFrame(() => {
                  try {
                    router.push('/recent-activity');
                  } catch (error) {
                    console.error('Navigation error:', error);
                    // Fallback navigation with shorter timeout
                    setTimeout(() => router.push('/recent-activity'), 50);
                  }
                });
              }}
              size="large"
              variant="outline"
              testID="home-screen-recent-activity-btn"
            />
          </View>

          {/* Developer Tools Card - Only visible in development */}
          {__DEV__ && (
            <View style={[styles.card, { borderColor: 'rgba(75, 192, 192, 0.5)' }]}>
              <Text style={[styles.cardTitle, { color: '#4BC0C0' }]}>Developer Tools</Text>
              <Text style={styles.cardDescription}>
                Tools for testing and debugging the application.
              </Text>
              <Button 
                title="Sentry Test Screen" 
                onPress={() => {
                  requestAnimationFrame(() => {
                    try {
                      router.push('/sentry-test');
                    } catch (error) {
                      console.error('Navigation error:', error);
                      setTimeout(() => router.push('/sentry-test'), 50);
                    }
                  });
                }}
                size="large"
                variant="outline"
                style={{ backgroundColor: 'rgba(75, 192, 192, 0.2)' }}
                testID="home-screen-sentry-test-btn"
              />
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Upload your PDF or image study materials</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>AI generates SACAA-style multiple choice questions</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Answer questions and review your results</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles have been moved inside the component to access theme colors
