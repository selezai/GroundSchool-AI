import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const ScoreDisplay = ({
  correct,
  total,
  timeSpent,
  passThreshold = 75,
  testID = 'score-display'
}) => {
  const percentage = Math.round((correct / total) * 100);
  const isPassed = percentage >= passThreshold;
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.scoreCard, isPassed ? styles.passCard : styles.failCard]}>
        <Text style={styles.title}>Exam Results</Text>
        
        <View style={styles.resultRow}>
          <Text style={styles.label}>Score:</Text>
          <Text style={[styles.score, isPassed ? styles.passText : styles.failText]}>
            {percentage}%
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Correct</Text>
            <Text style={styles.statValue}>{correct}/{total}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(timeSpent)}</Text>
          </View>
          
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[
              styles.statValue,
              isPassed ? styles.passText : styles.failText
            ]}>
              {isPassed ? 'PASS' : 'FAIL'}
            </Text>
          </View>
        </View>

        <Text style={styles.threshold}>
          Pass Threshold: {passThreshold}%
        </Text>
      </View>
    </View>
  );
};

ScoreDisplay.propTypes = {
  correct: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  timeSpent: PropTypes.number.isRequired,
  passThreshold: PropTypes.number,
  testID: PropTypes.string
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passCard: {
    borderColor: '#48BB78',
    borderWidth: 2,
  },
  failCard: {
    borderColor: '#F56565',
    borderWidth: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  label: {
    fontSize: 20,
    color: '#4A5568',
    marginRight: 8,
  },
  score: {
    fontSize: 36,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  passText: {
    color: '#48BB78',
  },
  failText: {
    color: '#F56565',
  },
  threshold: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ScoreDisplay;
