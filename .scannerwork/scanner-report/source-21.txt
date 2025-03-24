const React = require('react');

const View = ({ children, style, testID }) => 
  React.createElement('View', { style, testID }, children);

const Text = ({ children, style, testID }) => 
  React.createElement('Text', { style, testID }, children);

const TextInput = (props) => 
  React.createElement('TextInput', props);

const TouchableOpacity = ({ children, onPress, style, testID }) => 
  React.createElement('TouchableOpacity', { onPress, style, testID }, children);

const StyleSheet = {
  create: styles => styles,
};

module.exports = {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
};
