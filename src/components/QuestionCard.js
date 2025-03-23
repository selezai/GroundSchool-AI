import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

const QuestionCard = ({ 
  questionNumber,
  questionText,
  category,
  difficulty,
  options = [],
  selectedOption,
  onSelectOption,
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
      
      {/* Options container */}
      <View style={styles.optionsContainer}>
        {options && options.length > 0 ? options.map((option, index) => (
          <TouchableOpacity
            key={`option-${index}`}
            style={[
              styles.optionItem,
              selectedOption === index && styles.selectedOption
            ]}
            onPress={() => onSelectOption && onSelectOption(index)}
            testID={`option-${index}`}
          >
            <View style={styles.optionNumber}>
              <Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}</Text>
            </View>
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        )) : (
          <Text style={styles.noOptionsText}>No options available</Text>
        )}
      </View>
    </View>
  );
};

QuestionCard.propTypes = {
  questionNumber: PropTypes.number.isRequired,
  questionText: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  difficulty: PropTypes.oneOf(['Easy', 'Medium', 'Hard']),
  options: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    isCorrect: PropTypes.bool
  })),
  selectedOption: PropTypes.number,
  onSelectOption: PropTypes.func,
  testID: PropTypes.string
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
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
    marginBottom: 16,
  },
  optionsContainer: {
    marginTop: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedOption: {
    backgroundColor: '#E6F6FF',
    borderColor: '#3182CE',
  },
  optionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
  },
  noOptionsText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default QuestionCard;
