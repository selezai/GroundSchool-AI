/* global describe, beforeEach, it, expect, jest */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AnswerOption from '../AnswerOption';

describe('AnswerOption Component', () => {
  const defaultProps = {
    option: '1,500 feet',
    isSelected: false,
    isCorrect: false,
    showResult: false,
    onSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly in default state', () => {
    let tree;
    act(() => {
      tree = renderer.create(<AnswerOption {...defaultProps} />).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when selected', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <AnswerOption {...defaultProps} isSelected={true} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when showing correct answer', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <AnswerOption 
          {...defaultProps} 
          isCorrect={true} 
          showResult={true} 
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when showing incorrect answer', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <AnswerOption 
          {...defaultProps} 
          isSelected={true} 
          showResult={true} 
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('calls onSelect when pressed', () => {
    let component;
    act(() => {
      component = renderer.create(<AnswerOption {...defaultProps} />);
    });
    
    const button = component.root.findByProps({ testID: 'answer-option' });
    act(() => {
      button.props.onPress();
    });
    
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('disables touch events when showing result', () => {
    let component;
    act(() => {
      component = renderer.create(
        <AnswerOption {...defaultProps} showResult={true} />
      );
    });
    
    const button = component.root.findByProps({ testID: 'answer-option' });
    expect(button.props.disabled).toBe(true);
  });
});
