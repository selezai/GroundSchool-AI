import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';
import Button from '../Button';

describe('Button Component', () => {
  // Snapshot test
  it('renders correctly', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <Button title="Test" onPress={() => {}} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  // Props tests
  it('renders with different titles', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <Button title="Different Title" onPress={() => {}} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  // Interaction tests
  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    let component;
    
    act(() => {
      component = renderer.create(
        <Button title="Press Me" onPress={mockOnPress} />
      );
    });

    const button = component.root.findByProps({ testID: 'custom-button' });
    act(() => {
      button.props.onPress();
    });

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  // Style tests
  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    let tree;
    
    act(() => {
      tree = renderer.create(
        <Button 
          title="Styled Button" 
          onPress={() => {}} 
          style={customStyle}
        />
      ).toJSON();
    });

    expect(tree).toMatchSnapshot();
  });

  // Disabled state tests
  it('handles disabled state', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <Button 
          title="Disabled Button" 
          onPress={() => {}} 
          disabled={true}
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });
});

