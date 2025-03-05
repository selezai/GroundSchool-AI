import React from 'react';
import renderer, { act } from 'react-test-renderer';
import QuestionCard from '../QuestionCard';

describe('QuestionCard Component', () => {
  const defaultProps = {
    questionNumber: 1,
    questionText: 'What is the minimum flight visibility for VFR flight in Class G airspace below 1,200 feet AGL during the day?',
    category: 'Regulations',
    difficulty: 'Medium'
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
});
