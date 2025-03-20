import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import renderer, { act } from 'react-test-renderer';
import { ThemeProvider, useTheme } from '../ThemeContext';

describe('ThemeContext', () => {
  it('provides theme values to children', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      ).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('provides theme values to function children', () => {
    let receivedTheme;
    act(() => {
      renderer.create(
        <ThemeProvider>
          {(theme) => {
            receivedTheme = theme;
            return null;
          }}
        </ThemeProvider>
      );
    });

    expect(receivedTheme).toEqual({
      isDarkMode: true,
      colors: {
        background: '#0A0F24',
        card: 'rgba(255, 255, 255, 0.05)',
        text: '#FFFFFF',
        subText: '#E2E8F0',
        primary: '#00FFCC',
        border: 'rgba(255, 255, 255, 0.1)',
        accent: 'rgba(0, 255, 204, 0.2)',
        lightText: '#E2E8F0',
      },
    });
  });

  it('useTheme hook returns theme context', () => {
    const wrapper = ({ children }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current).toEqual({
      isDarkMode: true,
      colors: {
        background: '#0A0F24',
        card: 'rgba(255, 255, 255, 0.05)',
        text: '#FFFFFF',
        subText: '#E2E8F0',
        primary: '#00FFCC',
        border: 'rgba(255, 255, 255, 0.1)',
        accent: 'rgba(0, 255, 204, 0.2)',
        lightText: '#E2E8F0',
      },
    });
  });

  it('useTheme hook throws error when used outside provider', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.error).toEqual(Error('useTheme must be used within a ThemeProvider'));
  });
});

// Test component that uses the theme
const TestComponent = () => {
  const theme = useTheme();
  return (
    <div style={{ backgroundColor: theme.colors.background }}>
      Test Component
    </div>
  );
};
