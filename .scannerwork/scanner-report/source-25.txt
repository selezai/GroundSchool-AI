import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const AnswerOption = ({
  option,
  isSelected,
  isCorrect,
  showResult,
  onSelect,
  testID = 'answer-option'
}) => {
  const getStyles = () => {
    if (!showResult) {
      return isSelected ? styles.selected : styles.default;
    }
    if (isCorrect) {
      return styles.correct;
    }
    return isSelected ? styles.incorrect : styles.default;
  };

  const getTextStyles = () => {
    if (!showResult) {
      return isSelected ? styles.selectedText : styles.defaultText;
    }
    if (isCorrect) {
      return styles.correctText;
    }
    return isSelected ? styles.incorrectText : styles.defaultText;
  };

  return (
    <TouchableOpacity
      style={[styles.container, getStyles()]}
      onPress={onSelect}
      disabled={showResult}
      testID={testID}
    >
      <Text style={[styles.text, getTextStyles()]}>
        {option}
      </Text>
    </TouchableOpacity>
  );
};

AnswerOption.propTypes = {
  option: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isCorrect: PropTypes.bool.isRequired,
  showResult: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  testID: PropTypes.string
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 2,
  },
  default: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  selected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#4299E1',
  },
  correct: {
    backgroundColor: '#C6F6D5',
    borderColor: '#48BB78',
  },
  incorrect: {
    backgroundColor: '#FED7D7',
    borderColor: '#F56565',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  defaultText: {
    color: '#2D3748',
  },
  selectedText: {
    color: '#2B6CB0',
  },
  correctText: {
    color: '#2F855A',
  },
  incorrectText: {
    color: '#C53030',
  },
});

export default AnswerOption;
