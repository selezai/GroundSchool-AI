import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const Timer = ({
  duration,
  onTimeUp,
  isRunning = true,
  showHours = false,
  testID = 'timer'
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  const formatTime = useCallback((time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    const pad = (num) => num.toString().padStart(2, '0');

    if (showHours) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, [showHours]);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp]);

  const getColorStyle = () => {
    if (timeLeft <= 60) return styles.danger;
    if (timeLeft <= 300) return styles.warning;
    return styles.normal;
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.time, getColorStyle()]} testID="timer-text">
        {formatTime(timeLeft)}
      </Text>
    </View>
  );
};

Timer.propTypes = {
  duration: PropTypes.number.isRequired,
  onTimeUp: PropTypes.func,
  isRunning: PropTypes.bool,
  showHours: PropTypes.bool,
  testID: PropTypes.string
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  time: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  normal: {
    color: '#2D3748',
  },
  warning: {
    color: '#C05621',
  },
  danger: {
    color: '#C53030',
  },
});

export default Timer;
