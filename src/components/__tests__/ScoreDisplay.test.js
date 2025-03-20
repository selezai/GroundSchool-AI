import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ScoreDisplay from '../ScoreDisplay';
import * as ThemeContextModule from '../../context/ThemeContext';

// Mock theme context
const mockTheme = {
  isDarkMode: true,
  colors: {
    background: '#0A0F24',
    card: 'rgba(255, 255, 255, 0.05)',
    text: '#FFFFFF',
    subText: '#E2E8F0',
    primary: '#00FFCC',
    border: 'rgba(255, 255, 255, 0.1)',
    accent: 'rgba(0, 255, 204, 0.2)',
    lightText: '#E2E8F0'
  }
};

// Mock useTheme hook
jest.spyOn(ThemeContextModule, 'useTheme').mockImplementation(() => mockTheme);

describe('ScoreDisplay Component', () => {
  const defaultProps = {
    correct: 8,
    total: 10,
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



  it('handles perfect score', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ScoreDisplay 
          correct={10} 
          total={10}
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
        />
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });
});
