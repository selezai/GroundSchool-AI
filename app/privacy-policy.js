import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../src/components/AppHeader';
import { useTheme } from '../src/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 16,
      color: colors.subText,
      marginBottom: 16,
      lineHeight: 24,
    },
    bulletPoint: {
      flexDirection: 'row',
      marginBottom: 8,
      paddingLeft: 8,
    },
    bullet: {
      fontSize: 16,
      color: colors.subText,
      marginRight: 8,
    },
    bulletText: {
      fontSize: 16,
      color: colors.subText,
      flex: 1,
      lineHeight: 24,
    },
    lastUpdated: {
      fontSize: 14,
      color: colors.subText,
      marginTop: 32,
      marginBottom: 16,
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Privacy Policy" withBack={true} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            At GroundSchool-AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information that you provide directly to us when you:
          </Text>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Create an account (name, email address, password)
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Complete quizzes and assessments
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Interact with the app's features
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Contact our support team
            </Text>
          </View>
          
          <Text style={styles.paragraph}>
            We also automatically collect certain information when you use the app, including:
          </Text>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Device information (model, operating system)
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Usage data (features accessed, quiz performance)
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Log data (error reports, app activity)
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Provide, maintain, and improve our services
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Personalize your learning experience
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Track your progress and performance
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Send you important notifications about your account or the app
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Respond to your comments and questions
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Analyze usage patterns to improve our app
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, loss, or damage. Your data is stored securely using industry-standard encryption and security practices.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing and Disclosure</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal information to third parties. We may share your information in the following circumstances:
          </Text>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              With service providers who help us operate our app
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              To comply with legal obligations
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              To protect our rights, privacy, safety, or property
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              In connection with a business transfer (merger, acquisition)
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Access, update, or delete your personal information
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Opt out of marketing communications
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Request a copy of your data
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last Updated" date.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at groundschoolai@gmail.com.
          </Text>
        </View>
        
        <Text style={styles.lastUpdated}>Last Updated: March 6, 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
