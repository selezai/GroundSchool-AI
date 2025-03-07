import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const QuestionCard = ({ 
  questionNumber,
  questionText,
  category,
  difficulty,
  testID = 'question-card'
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>Question {questionNumber}</Text>
        <View style={styles.metadata}>
          <Text style={styles.category}>{category || 'General'}</Text>
          {difficulty ? (
            <Text style={[
              styles.difficulty,
              styles[difficulty.toLowerCase() || 'medium']
            ]}>
              {difficulty}
            </Text>
          ) : (
            <Text style={[styles.difficulty, styles.medium]}>Medium</Text>
          )}
        </View>
      </View>
      <Text style={styles.questionText}>{questionText}</Text>
    </View>
  );
};

QuestionCard.propTypes = {
  questionNumber: PropTypes.number.isRequired,
  questionText: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  difficulty: PropTypes.oneOf(['Easy', 'Medium', 'Hard']).isRequired,
  testID: PropTypes.string
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    color: '#4A5568',
    marginRight: 8,
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficulty: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  easy: {
    backgroundColor: '#C6F6D5',
    color: '#2F855A',
  },
  medium: {
    backgroundColor: '#FEEBC8',
    color: '#C05621',
  },
  hard: {
    backgroundColor: '#FED7D7',
    color: '#C53030',
  },
  questionText: {
    fontSize: 16,
    color: '#1A202C',
    lineHeight: 24,
  },
});

export default QuestionCard;
