// Import Jest globals
/* global test, expect */

test('React is properly configured', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  // Basic component rendering test
  const component = React.createElement(View, { testID: 'test-view' });
  expect(component).toBeTruthy();
});
