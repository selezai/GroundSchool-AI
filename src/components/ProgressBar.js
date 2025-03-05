import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';

const ProgressBar = ({
  current,
  total,
  showPercentage = true,
  testID = 'progress-bar'
}) => {
  const progress = (current / total) * 100;
  const width = `${progress}%`;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar,
            { width }
          ]} 
          testID="progress-fill"
        />
      </View>
      {showPercentage && (
        <Text style={styles.text}>
          {current} of {total} Questions
        </Text>
      )}
    </View>
  );
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  showPercentage: PropTypes.bool,
  testID: PropTypes.string
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4299E1',
    borderRadius: 4,
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
  },
});

export default ProgressBar;
