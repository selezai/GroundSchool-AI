import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const Button = ({ 
  title, 
  onPress, 
  disabled = false,
  variant = 'primary', 
  size = 'medium',
  style, 
  textStyle,
  testID = 'custom-button' 
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style
      ]}
      testID={testID}
    >
      <Text 
        style={[
          styles.text, 
          styles[`${variant}Text`],
          disabled && styles.disabledText,
          textStyle
        ]} 
        testID="button-text"
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

Button.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  style: PropTypes.object,
  textStyle: PropTypes.object,
  testID: PropTypes.string
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  primary: {
    backgroundColor: '#00FFCC', // Neon blue-green accent color
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent white
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00FFCC',
  },
  danger: {
    backgroundColor: '#FF6B6B', // Red with better contrast on dark background
    borderWidth: 0,
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  disabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#0A0F24', // Dark background color for contrast
    fontWeight: 'bold',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#00FFCC',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#A0AEC0',
  }
});

export default Button;
