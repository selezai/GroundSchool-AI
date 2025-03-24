/* global jest, describe, beforeEach, afterEach, it, expect, test */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import Input from '../Input';

describe('Input Component', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    placeholder: 'Enter text',
    testID: 'custom-input'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const tree = renderer.create(<Input {...defaultProps} />).toJSON();
    expect(tree).toBeDefined();
    expect(tree.type).toBe('View');
  });

  it('renders with a label', () => {
    const props = { ...defaultProps, label: 'Email' };
    const tree = renderer.create(<Input {...props} />).toJSON();
    expect(tree).toBeDefined();
    expect(tree.children[0].type).toBe('Text');
    expect(tree.children[0].children[0]).toBe('Email');
  });

  it('renders in error state', () => {
    const props = { ...defaultProps, error: 'This field is required' };
    const tree = renderer.create(<Input {...props} />).toJSON();
    expect(tree).toBeDefined();
    
    // Find the error text
    const errorText = tree.children.find(child => 
      child.type === 'Text' && child.props.testID === `${defaultProps.testID}-error`
    );
    expect(errorText).toBeDefined();
    expect(errorText.children[0]).toBe('This field is required');
  });

  it('renders password input with toggle button', () => {
    const props = { ...defaultProps, secureTextEntry: true };
    const tree = renderer.create(<Input {...props} />).toJSON();
    expect(tree).toBeDefined();
    
    // The toggle button should be in the input container
    const inputContainer = tree.children.find(child => 
      child.type === 'View' && child.props.style.some(style => style && style.flexDirection === 'row')
    );
    expect(inputContainer).toBeDefined();
    
    // Find the toggle button
    const toggleButton = inputContainer.children.find(child => 
      child.type === 'TouchableOpacity' && 
      child.props.testID === `${defaultProps.testID}-toggle-visibility`
    );
    expect(toggleButton).toBeDefined();
  });

  it('toggles password visibility when eye icon is pressed', () => {
    const props = { ...defaultProps, secureTextEntry: true };
    let component;
    
    act(() => {
      component = renderer.create(<Input {...props} />);
    });
    
    // Get the initial state
    const inputField = component.root.findByProps({ testID: `${defaultProps.testID}-field` });
    expect(inputField.props.secureTextEntry).toBe(true);
    
    // Find and press the toggle button
    const toggleButton = component.root.findByProps({ 
      testID: `${defaultProps.testID}-toggle-visibility` 
    });
    
    act(() => {
      toggleButton.props.onPress();
    });
    
    // Check that the password is now visible
    expect(inputField.props.secureTextEntry).toBe(false);
  });

  it('handles focus and blur events', () => {
    let component;
    
    act(() => {
      component = renderer.create(<Input {...defaultProps} />);
    });
    
    const inputField = component.root.findByProps({ testID: `${defaultProps.testID}-field` });
    
    // Trigger focus
    act(() => {
      inputField.props.onFocus();
    });
    
    // Get the input container to check its styles
    const inputContainer = component.root.findByType('View').findAll(
      node => node.props.style && 
      Array.isArray(node.props.style) && 
      node.props.style.some(style => style && style.borderWidth === 1)
    )[0];
    
    // Check that the focused style is applied
    expect(inputContainer.props.style.some(style => 
      style && style.borderColor === '#4299E1'
    )).toBe(true);
    
    // Trigger blur
    act(() => {
      inputField.props.onBlur();
    });
    
    // Check that the focused style is removed
    expect(inputContainer.props.style.some(style => 
      style && style.borderColor === '#4299E1'
    )).toBe(false);
  });

  it('calls onChangeText when text changes', () => {
    let component;
    
    act(() => {
      component = renderer.create(<Input {...defaultProps} />);
    });
    
    const inputField = component.root.findByProps({ testID: `${defaultProps.testID}-field` });
    const newText = 'test@example.com';
    
    act(() => {
      inputField.props.onChangeText(newText);
    });
    
    expect(defaultProps.onChangeText).toHaveBeenCalledWith(newText);
  });
});
