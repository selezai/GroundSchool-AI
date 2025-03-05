import React from 'react';
import { View, Text, FlatList } from 'react-native';

const QuestionBankScreen = ({ route }) => {
  const { questions } = route.params;

  return (
    <View style={{ padding: 16 }}>
      <Text>Question Bank</Text>
      <FlatList
        data={questions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text>{item.question}</Text>
            {item.options.map((option, idx) => (
              <Text key={idx}>{option}</Text>
            ))}
          </View>
        )}
      />
    </View>
  );
};

export default QuestionBankScreen;
