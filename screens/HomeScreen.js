import React from 'react';
import { View, Text, Button } from 'react-native';

const HomeScreen = ({ navigation }) => (
  <View style={{ padding: 16 }}>
    <Text>Welcome to GroundSchool-AI</Text>
    <Button
      title="Question Bank"
      onPress={() => navigation.navigate('QuestionBank')}
    />
    <Button
      title="Recent Activity"
      onPress={() => navigation.navigate('RecentActivity')}
    />
  </View>
);

export default HomeScreen;
