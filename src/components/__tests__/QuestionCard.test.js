/* global describe, it, expect, jest */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import QuestionCard from '../QuestionCard';

describe('QuestionCard Component', () => {
  const defaultProps = {
    questionNumber: 1,
    questionText: 'What is the minimum flight visibility for VFR flight in Class G airspace below 1,200 feet AGL during the day?',
    category: 'Regulations',
    difficulty: 'Medium',
    options: [
      { text: '1 mile', isCorrect: true },
      { text: '3 miles', isCorrect: false },
      { text: '5 miles', isCorrect: false },
      { text: 'Clear of clouds', isCorrect: false }
    ]
  };

  it('renders correctly with default props', () => {
    let tree;
    act(() => {
      tree = renderer.create(<QuestionCard {...defaultProps} />).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders with different difficulty levels', () => {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    difficulties.forEach(difficulty => {
      let tree;
      act(() => {
        tree = renderer.create(
          <QuestionCard {...defaultProps} difficulty={difficulty} />
        ).toJSON();
      });
      expect(tree).toMatchSnapshot();
    });
  });

  it('renders with different categories', () => {
    const categories = ['Navigation', 'Weather', 'Aircraft Systems'];
    categories.forEach(category => {
      let tree;
      act(() => {
        tree = renderer.create(
          <QuestionCard {...defaultProps} category={category} />
        ).toJSON();
      });
      expect(tree).toMatchSnapshot();
    });
  });

  it('renders with long question text', () => {
    const longQuestion = 'A very long question that spans multiple lines and tests how the component handles text wrapping and layout adjustments when the content is significantly longer than usual. This helps ensure the component remains visually appealing with varying content lengths.';
    let tree;
    act(() => {
      tree = renderer.create(
        <QuestionCard {...defaultProps} questionText={longQuestion} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders with options and handles selection', () => {
    const onSelectOption = jest.fn();
    let component;
    
    act(() => {
      component = renderer.create(
        <QuestionCard 
          {...defaultProps}
          onSelectOption={onSelectOption}
          selectedOption={1}
        />
      );
    });

    // Find all options
    const options = component.root.findAllByType(TouchableOpacity);
    expect(options).toHaveLength(4);

    // Verify selected option has the correct style
    expect(options[1].props.style).toContainEqual(expect.objectContaining({
      backgroundColor: expect.any(String)
    }));

    // Test option selection
    act(() => {
      options[2].props.onPress();
    });
    expect(onSelectOption).toHaveBeenCalledWith(2);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('renders with no options', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <QuestionCard 
          {...defaultProps}
          options={[]}
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('handles undefined options gracefully', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <QuestionCard 
          {...defaultProps}
          options={undefined}
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders with custom testID', () => {
    const customTestID = 'custom-question-card';
    let component;
    
    act(() => {
      component = renderer.create(
        <QuestionCard 
          {...defaultProps}
          testID={customTestID}
        />
      );
    });

    const card = component.root.findByProps({ testID: customTestID });
    expect(card).toBeTruthy();
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('handles undefined difficulty gracefully', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <QuestionCard 
          {...defaultProps}
          difficulty={undefined}
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });
});
