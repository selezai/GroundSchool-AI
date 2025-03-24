// Basic test for React Native components
/* global describe, it, expect */
import React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';

describe('Basic Component Testing', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<Text>Test</Text>).toJSON();
    expect(tree).toBeDefined();
    expect(tree.type).toBe('Text');
    expect(tree.children).toEqual(['Test']);
  });
});
