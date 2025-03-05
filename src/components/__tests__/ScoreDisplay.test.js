import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ScoreDisplay from '../ScoreDisplay';

describe('ScoreDisplay Component', () => {
  const defaultProps = {
    correct: 8,
    total: 10,
    timeSpent: 600,
  };

  it('renders correctly for passing score', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ScoreDisplay {...defaultProps} />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly for failing score', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ScoreDisplay 
          correct={6} 
          total={10} 
          timeSpent={600} 
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('renders with custom pass threshold', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ScoreDisplay 
          {...defaultProps} 
          passThreshold={90}
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('formats time correctly', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ScoreDisplay 
          {...defaultProps} 
          timeSpent={3665} // 1h 1m 5s
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('handles perfect score', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ScoreDisplay 
          correct={10} 
          total={10} 
          timeSpent={300}
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('handles zero score', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ScoreDisplay 
          correct={0} 
          total={10} 
          timeSpent={300}
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });
});
