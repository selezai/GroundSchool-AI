import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';

/**
 * HomeScreen - The main hub of the GroundSchool-AI app
 * This screen provides access to Question Bank and Recent Activity
 */
const HomeScreen = ({ testID = 'home-screen' }) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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
              onPress={() => navigation.navigate('Upload')}
              size="large"
              variant="primary"
              testID={`${testID}-question-bank-btn`}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.cardDescription}>
              View your past attempts and resume incomplete question sets.
            </Text>
            <Button 
              title="View Activity" 
              onPress={() => navigation.navigate('RecentActivity')}
              size="large"
              variant="outline"
              testID={`${testID}-recent-activity-btn`}
            />
          </View>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24', // Dark navy background (aviation-themed)
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 90,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight transparency
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    backgroundColor: '#00FFCC',
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
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
});

export default HomeScreen;
