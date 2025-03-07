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

export default function TermsOfServiceScreen() {
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
      <AppHeader title="Terms of Service" withBack={true} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Welcome to GroundSchool-AI. By accessing or using our mobile application, you agree to be bound by these Terms of Service. Please read them carefully.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By creating an account, downloading, or using the GroundSchool-AI application, you agree to these Terms of Service. If you do not agree to these terms, you may not use the application.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Account Registration</Text>
          <Text style={styles.paragraph}>
            To access certain features of the application, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Text>
          <Text style={styles.paragraph}>
            You agree to provide accurate and complete information when creating your account and to update your information to keep it accurate and current.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Content</Text>
          <Text style={styles.paragraph}>
            You retain ownership of any content you submit through the application. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content for the purpose of operating and improving the application.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Use the application for any illegal purpose
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Attempt to gain unauthorized access to any part of the application
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Interfere with or disrupt the application or servers
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Share your account credentials with others
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Use the application to transmit viruses or other harmful code
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              Engage in any activity that could damage, disable, or impair the application
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The application, including all content, features, and functionality, is owned by GroundSchool-AI and is protected by copyright, trademark, and other intellectual property laws.
          </Text>
          <Text style={styles.paragraph}>
            You may not reproduce, distribute, modify, create derivative works of, publicly display, or use any content from the application without our express written permission.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to terminate or suspend your account and access to the application at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            The application is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not guarantee that the application will be uninterrupted, secure, or error-free.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, GroundSchool-AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the application.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may revise these Terms of Service at any time by updating this page. Your continued use of the application after any changes constitutes your acceptance of the new Terms.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms of Service shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at groundschoolai@gmail.com.
          </Text>
        </View>
        
        <Text style={styles.lastUpdated}>Last Updated: March 6, 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
